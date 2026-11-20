package com.wms.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username = "admin", roles = "ADMIN")
class WarehouseLifecycleTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate db;
    @Autowired ProductRepository products;

    private JsonNode send(MockHttpServletRequestBuilder request, Object body) throws Exception {
        var response = mvc.perform(request.contentType("application/json").content(mapper.writeValueAsBytes(body)))
                .andExpect(status().isOk()).andReturn().getResponse();
        return mapper.readTree(response.getContentAsByteArray()).path("data");
    }

    private void rejected(MockHttpServletRequestBuilder request, Object body) throws Exception {
        mvc.perform(request.contentType("application/json").content(mapper.writeValueAsBytes(body)))
                .andExpect(status().is4xxClientError());
    }

    private void stock(long product, int onHand, int reserved) {
        assertEquals(onHand, db.queryForObject("select coalesce(sum(on_hand_qty),0) from wms_inventory where product_id=?", Integer.class, product));
        assertEquals(reserved, db.queryForObject("select coalesce(sum(reserved_qty),0) from wms_inventory where product_id=?", Integer.class, product));
    }

    @Test
    void receivedRejectedStagedAllocatedAndDispatchedQuantitiesReconcile() throws Exception {
        String key = UUID.randomUUID().toString();
        long product = products.save(Product.builder().sku(key).barcode(key).name("QC test")
                .supplierId(1L).categoryId(1L).build()).getId();
        var po = send(post("/orders/inbound"), Map.of("orderCode", "PO-" + key, "warehouseId", 1,
                "supplierId", 1, "items", List.of(Map.of("productId", product, "expectedQty", 100))));
        long id = po.get("id").asLong(), line = po.at("/items/0/id").asLong();
        String receive = "/orders/inbound/" + id + "/receive";
        rejected(put(receive), Map.of("items", List.of(Map.of("id", line, "receivedQty", 80, "rejectedQty", 81))));
        var receipt = Map.of("items", List.of(Map.of("id", line, "receivedQty", 80, "rejectedQty", 5,
                "batchNumber", key, "expiryDate", "2040-12-31")));
        send(put(receive), receipt);
        rejected(put(receive), receipt);
        var saved = db.queryForMap("select received_qty,rejected_qty,stocked_qty,batch_number from wms_inbound_order_item where id=?", line);
        assertEquals(List.of(80, 5, 0, key), List.of(saved.get("received_qty"), saved.get("rejected_qty"), saved.get("stocked_qty"), saved.get("batch_number")));
        stock(product, 0, 0);

        var placement = new java.util.HashMap<String,Object>(Map.of("orderId", id, "orderItemId", line,
                "productId", product, "locationId", 1, "quantity", 50, "expectedStockedQty", 0));
        db.update("insert into wms_location (warehouse_id,zone_code,aisle,rack,shelf,bin,bin_barcode,max_weight_kg,is_active) values (2,'ZONE_A',?,'R01','S01','B01',?,500,true)", key.substring(0, 12), key);
        long foreignBin = db.queryForObject("select id from wms_location where bin_barcode=?", Long.class, key);
        placement.put("locationId", foreignBin);
        rejected(post("/orders/inbound/putaway"), placement);
        stock(product, 0, 0);
        placement.put("locationId", 1);
        assertEquals(25, send(post("/orders/inbound/putaway"), placement).at("/items/0/remainingQty").asInt());
        stock(product, 50, 0);
        rejected(post("/orders/inbound/putaway"), placement);
        placement.put("expectedStockedQty", 50);
        rejected(post("/orders/inbound/putaway"), placement);
        placement.put("quantity", 25);
        assertEquals("STOCKED", send(post("/orders/inbound/putaway"), placement).get("status").asText());
        stock(product, 75, 0);

        var so = send(post("/orders/outbound"), Map.of("orderCode", "SO-" + key, "warehouseId", 1,
                "partnerId", 1, "items", List.of(Map.of("productId", product, "requestedQty", 20))));
        String path = "/orders/outbound/" + so.get("id").asLong();
        send(put(path + "/allocate-fefo"), Map.of());
        stock(product, 75, 20);
        send(put(path + "/dispatch"), Map.of());
        stock(product, 55, 0);
        long batch = db.queryForObject("select batch_id from wms_inventory where product_id=?", Long.class, product);
        db.update("insert into wms_inventory (location_id,product_id,batch_id,on_hand_qty,reserved_qty,version) values (?,?,?,12,0,0)", foreignBin, product, batch);
        var audit = send(post("/inventory/audit"), Map.of("warehouseId", 1, "auditCode", "AUD-" + key));
        assertTrue(audit.get("items").size() > 0);
        for (var row : audit.get("items")) assertNotEquals(foreignBin, row.get("locationId").asLong());
        rejected(post("/inventory/audit/" + audit.get("id").asLong() + "/count"),
                Map.of("productId", product, "locationId", foreignBin, "countedQty", 12));
        assertEquals(List.of(50, 25, -20), db.queryForList("select qty_change from wms_stock_ledger where product_id=? order by id", Integer.class, product));
        assertEquals(List.of(50, 75, 55), db.queryForList("select balance_after from wms_stock_ledger where product_id=? order by id", Integer.class, product));
        for (String sql : List.of("update wms_stock_ledger set notes='changed' where product_id=?", "delete from wms_stock_ledger where product_id=?")) {
            var ex = assertThrows(DataAccessException.class, () -> db.update(sql, product));
            assertTrue(ex.getMostSpecificCause().getMessage().contains("append-only"));
        }
    }

    @Test
    void fullRejectionClosesReceiptWithoutStockOrLedger() throws Exception {
        String code = "PO-" + UUID.randomUUID();
        var product = products.findAll().stream().filter(p -> Boolean.TRUE.equals(p.getIsActive())
                && p.getDeletedAt() == null && p.getSupplierId() != null).findFirst().orElseThrow();
        var po = send(post("/orders/inbound"), Map.of("orderCode", code, "warehouseId", 1, "supplierId", product.getSupplierId(),
                "items", List.of(Map.of("productId", product.getId(), "expectedQty", 5))));
        var result = send(put("/orders/inbound/" + po.get("id").asLong() + "/receive"), Map.of("items",
                List.of(Map.of("id", po.at("/items/0/id").asLong(), "receivedQty", 5, "rejectedQty", 5))));
        assertEquals("CLOSED_NO_STOCK", result.get("status").asText());
        assertEquals(0, result.at("/items/0/remainingQty").asInt());
        assertEquals(0, db.queryForObject("select count(*) from wms_stock_ledger where reference_code=?", Integer.class, code));
    }
}
