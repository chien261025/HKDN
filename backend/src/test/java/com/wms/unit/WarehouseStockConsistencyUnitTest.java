package com.wms.unit;

import com.wms.module.identity.repository.UserRepository;
import com.wms.module.inventory.entity.*;
import com.wms.module.inventory.repository.*;
import com.wms.module.inventory.service.WarehouseStockService;
import com.wms.module.inventory.service.impl.InventoryQueryServiceImpl;
import com.wms.module.masterdata.entity.*;
import com.wms.module.masterdata.repository.*;
import com.wms.module.masterdata.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WarehouseStockConsistencyUnitTest {
    @Mock InventoryRepository inventory;
    @Mock StockLedgerRepository ledgers;
    @Mock ProductRepository products;
    @Mock LocationRepository locations;
    @Mock WarehouseRepository warehouses;
    @Mock ProductBatchRepository batches;
    @Mock CategoryRepository categories;
    @Mock UserRepository users;
    @Mock SupplierRepository suppliers;
    @Mock WarehouseStockService warehouseStockService;
    @InjectMocks InventoryQueryServiceImpl query;

    @Test void outboundApiRequiresASelectedWarehousePartnerInsteadOfFreeText() {
        try (var factory = jakarta.validation.Validation.buildDefaultValidatorFactory()) {
            var request = com.wms.module.order.dto.request.CreateOutboundOrderRequest.builder()
                    .customerName("Free text receiver").items(List.of(
                            com.wms.module.order.dto.request.CreateOutboundOrderRequest.ItemRequest.builder()
                                    .productId(1L).requestedQty(1).build())).build();
            assertTrue(factory.getValidator().validate(request).stream()
                    .anyMatch(violation -> violation.getPropertyPath().toString().equals("partnerId")));
        }
    }

    @Test void catalogueClosingStockSumsLocalBinsAndExcludesOtherWarehouses() {
        Product product = Product.builder().id(1L).name("P1").build();
        when(products.findAll()).thenReturn(List.of(product));
        when(products.findAllByDeletedAtIsNullOrderByCreatedAtDesc()).thenReturn(List.of(product));
        when(locations.findAll()).thenReturn(List.of(Location.builder().id(1L).warehouseId(1L).build(),
                Location.builder().id(2L).warehouseId(2L).build()));
        when(inventory.findAll()).thenReturn(List.of(
                Inventory.builder().productId(1L).locationId(1L).batchId(10L).onHandQty(12).reservedQty(2).build(),
                Inventory.builder().productId(1L).locationId(1L).batchId(11L).onHandQty(8).reservedQty(0).build(),
                Inventory.builder().productId(1L).locationId(2L).batchId(10L).onHandQty(500).reservedQty(0).build()));
        WarehouseStockService summary = new WarehouseStockService(products, inventory, locations, batches);
        ProductServiceImpl catalogue = new ProductServiceImpl(products, suppliers, categories, inventory, batches, summary);
        assertEquals(20, catalogue.getAllProducts().get(0).getCurrentStock());
        assertEquals(20, summary.getClosingBalances(true).stream().filter(s -> s.getWarehouseId() == 1L).findFirst().orElseThrow().getOnHandQty());
    }

    @Test void currentBalanceAndHistoricalLedgerKeepTheirOwnMeaningAndWarehouse() {
        when(products.findAll()).thenReturn(List.of(Product.builder().id(1L).name("P1").build()));
        when(locations.findAll()).thenReturn(List.of(Location.builder().id(5L).warehouseId(1L).build()));
        when(inventory.findAll()).thenReturn(List.of(Inventory.builder().id(1L).productId(1L).locationId(5L)
                .batchId(10L).onHandQty(12).reservedQty(2).build()));
        when(ledgers.findTop50ByOrderByCreatedAtDesc()).thenReturn(List.of(StockLedger.builder().id(1L)
                .productId(1L).locationId(5L).batchId(10L).qtyChange(20).balanceAfter(20).build()));
        var current = query.getAllBalances().get(0);
        var historical = query.getRecentLedgers(50).get(0);
        assertEquals(1L, current.getWarehouseId());
        assertEquals(12, current.getOnHandQty());
        assertEquals(10, current.getAvailableQty());
        assertEquals(1L, historical.getWarehouseId());
        assertEquals(0, historical.getBalanceBefore());
        assertEquals(20, historical.getBalanceAfter());
    }
}
