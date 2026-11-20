package com.wms.unit;

import com.wms.common.exception.BusinessException;
import com.wms.module.masterdata.entity.*;
import com.wms.module.masterdata.repository.*;
import com.wms.module.masterdata.service.impl.*;
import com.wms.module.order.dto.request.CreateInboundOrderRequest;
import com.wms.module.order.dto.request.CreateOutboundOrderRequest;
import com.wms.module.order.entity.OutboundOrder;
import com.wms.module.order.repository.InboundOrderRepository;
import com.wms.module.order.repository.OutboundOrderRepository;
import com.wms.module.order.service.InboundService;
import com.wms.module.order.service.OutboundService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BusinessPartnerRoleUnitTest {
    @Test void migrationPreservesExistingSuppliersAndDoesNotChangeUserRoles() {
        var dataSource = new org.h2.jdbcx.JdbcDataSource();
        dataSource.setURL("jdbc:h2:mem:business_partner_migration;MODE=MySQL;DB_CLOSE_DELAY=-1");
        var jdbc = new org.springframework.jdbc.core.JdbcTemplate(dataSource);
        jdbc.execute("CREATE TABLE wms_supplier(id BIGINT PRIMARY KEY, name VARCHAR(255))");
        jdbc.execute("INSERT INTO wms_supplier VALUES(1, 'Existing supplier')");
        jdbc.execute("CREATE TABLE wms_outbound_order(id BIGINT PRIMARY KEY, customer_name VARCHAR(100))");
        jdbc.execute("INSERT INTO wms_outbound_order VALUES(1, 'Existing order customer')");
        jdbc.execute("CREATE TABLE wms_role(id BIGINT PRIMARY KEY, name VARCHAR(50))");
        jdbc.execute("INSERT INTO wms_role VALUES(1, 'ROLE_ADMIN')");
        new org.springframework.jdbc.datasource.init.ResourceDatabasePopulator(
                new org.springframework.core.io.ClassPathResource("db/migration/V7__add_business_partner_roles.sql"))
                .execute(dataSource);
        assertEquals("SUPPLIER", jdbc.queryForObject("SELECT partner_role FROM wms_supplier WHERE id=1", String.class));
        assertEquals("Existing supplier", jdbc.queryForObject("SELECT name FROM wms_supplier WHERE id=1", String.class));
        assertEquals("Existing order customer", jdbc.queryForObject("SELECT customer_name FROM wms_outbound_order WHERE id=1", String.class));
        assertEquals("ROLE_ADMIN", jdbc.queryForObject("SELECT name FROM wms_role WHERE id=1", String.class));
    }

    @Mock SupplierRepository suppliers;
    @Mock ProductRepository products;
    @Mock InboundOrderRepository inboundOrders;
    @Mock OutboundOrderRepository outboundOrders;
    @InjectMocks SupplierServiceImpl partnerService;
    @InjectMocks ProductServiceImpl productService;
    @InjectMocks InboundService inbound;
    @InjectMocks OutboundService outbound;

    private Supplier partner(long id, PartnerRole role) {
        return Supplier.builder().id(id).code("P-" + id).name("Partner " + id).partnerRole(role).build();
    }

    @Test void existingSuppliersKeepTheirDefaultRoleAndList() {
        Supplier supplier = Supplier.builder().id(1L).name("Existing supplier").build();
        Supplier receiver = partner(2L, PartnerRole.RECEIVER);
        when(suppliers.findAll()).thenReturn(List.of(supplier, receiver));
        assertEquals(PartnerRole.SUPPLIER, supplier.getPartnerRole());
        assertEquals(List.of(supplier), partnerService.getAllSuppliers());
        assertEquals(2, partnerService.getAllPartners().size());
    }

    @Test void createReceiverPersistsItsBusinessRoleAndContactDetailsWithoutProducts() {
        Supplier receiver = partner(2L, PartnerRole.RECEIVER);
        receiver.setContactPerson("Receiving office"); receiver.setEmail("receiving@example.test");
        receiver.setAddress("Receiving warehouse"); receiver.setContactPhone("0900000001");
        when(suppliers.save(any())).thenAnswer(call -> call.getArgument(0));
        Supplier saved = partnerService.createSupplier(receiver);
        assertEquals(PartnerRole.RECEIVER, saved.getPartnerRole());
        assertEquals("Receiving office", saved.getContactPerson());
        assertEquals("receiving@example.test", saved.getEmail());
        assertEquals("Receiving warehouse", saved.getAddress());
        verifyNoInteractions(products);
    }

    @Test void editingReceiverKeepsRoleAndUpdatesCooperationStatus() {
        Supplier receiver = partner(2L, PartnerRole.RECEIVER);
        when(suppliers.findById(2L)).thenReturn(Optional.of(receiver));
        when(suppliers.save(any())).thenAnswer(call -> call.getArgument(0));
        Supplier updated = partnerService.updateSupplier(2L, Supplier.builder().name("New name")
                .contactPerson("New contact").email("new@example.test").isActive(false).build());
        assertEquals(PartnerRole.RECEIVER, updated.getPartnerRole());
        assertEquals("New name", updated.getName());
        assertEquals("new@example.test", updated.getEmail());
        assertFalse(updated.getIsActive());
    }

    @Test void supplierCanStillOwnProductsButReceiverCannot() {
        when(suppliers.findById(1L)).thenReturn(Optional.of(partner(1L, PartnerRole.SUPPLIER)));
        when(products.save(any())).thenAnswer(call -> call.getArgument(0));
        assertNotNull(productService.createProduct(Product.builder().sku("P1").supplierId(1L).build()));
        when(suppliers.findById(2L)).thenReturn(Optional.of(partner(2L, PartnerRole.RECEIVER)));
        assertThrows(BusinessException.class, () -> productService.createProduct(
                Product.builder().sku("P2").supplierId(2L).build()));
        verify(products, times(1)).save(any());
    }

    @Test void inboundRejectsReceiverEvenIfProductSupplierIdMatches() {
        when(suppliers.findById(2L)).thenReturn(Optional.of(partner(2L, PartnerRole.RECEIVER)));
        assertThrows(BusinessException.class, () -> inbound.createInboundOrder(CreateInboundOrderRequest.builder()
                .supplierId(2L).items(List.of(CreateInboundOrderRequest.ItemRequest.builder()
                        .productId(1L).expectedQty(10).build())).build()));
        verifyNoInteractions(products, inboundOrders);
    }

    @Test void inboundStillAcceptsSuppliersAndTheirOwnProducts() {
        when(suppliers.findById(1L)).thenReturn(Optional.of(partner(1L, PartnerRole.SUPPLIER)));
        when(products.findById(1L)).thenReturn(Optional.of(Product.builder().id(1L).supplierId(1L).build()));
        when(inboundOrders.save(any())).thenAnswer(call -> call.getArgument(0));
        var saved = inbound.createInboundOrder(CreateInboundOrderRequest.builder().supplierId(1L)
                .items(List.of(CreateInboundOrderRequest.ItemRequest.builder().productId(1L).expectedQty(10).build())).build());
        assertEquals(1L, saved.getSupplierId());
        assertEquals(10, saved.getItems().get(0).getExpectedQty());
    }

    @Test void inboundStillRejectsProductsFromAnotherSupplier() {
        when(suppliers.findById(1L)).thenReturn(Optional.of(partner(1L, PartnerRole.SUPPLIER)));
        when(products.findById(1L)).thenReturn(Optional.of(Product.builder().id(1L).supplierId(3L).build()));
        assertThrows(BusinessException.class, () -> inbound.createInboundOrder(CreateInboundOrderRequest.builder()
                .supplierId(1L).items(List.of(CreateInboundOrderRequest.ItemRequest.builder()
                        .productId(1L).expectedQty(10).build())).build()));
        verifyNoInteractions(inboundOrders);
    }

    @Test void outboundRejectsSupplierDespiteReceivingValidPartnerId() {
        when(suppliers.findById(1L)).thenReturn(Optional.of(partner(1L, PartnerRole.SUPPLIER)));
        assertThrows(BusinessException.class, () -> outbound.createOutboundOrder(CreateOutboundOrderRequest.builder()
                .partnerId(1L).items(List.of(CreateOutboundOrderRequest.ItemRequest.builder()
                        .productId(1L).requestedQty(1).build())).build()));
        verifyNoInteractions(products, outboundOrders);
    }

    @Test void dispatchRejectsInactiveReceiverBeforeChangingInventory() {
        Supplier receiver = partner(2L, PartnerRole.RECEIVER); receiver.setIsActive(false);
        when(suppliers.findById(2L)).thenReturn(Optional.of(receiver));
        when(outboundOrders.findForUpdate(1L)).thenReturn(Optional.of(OutboundOrder.builder()
                .id(1L).partnerId(2L).status("ALLOCATED").build()));
        assertThrows(BusinessException.class, () -> outbound.dispatchOutboundOrder(1L));
        verify(outboundOrders, never()).save(any());
    }
}
