package com.wms.unit;

import com.wms.common.exception.BusinessException;
import com.wms.module.identity.repository.UserRepository;
import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.entity.ProductBatch;
import com.wms.module.inventory.entity.StockLedger;
import com.wms.module.inventory.repository.*;
import com.wms.module.inventory.service.InventoryLockService;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.*;
import com.wms.module.order.dto.request.CreateOutboundOrderRequest;
import com.wms.module.order.entity.*;
import com.wms.module.order.repository.*;
import com.wms.module.order.service.OutboundService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutboundStockUnitTest {
    @Mock ProductRepository products;
    @Mock ProductBatchRepository batches;
    @Mock InventoryRepository inventory;
    @Mock LocationRepository locations;
    @Mock CategoryRepository categories;
    @Mock InventoryLockService locks;
    @Mock OutboundOrderRepository orders;
    @Mock PickAllocationRepository allocations;
    @Mock StockLedgerRepository ledgers;
    @Mock UserRepository users;
    @Mock SupplierRepository suppliers;
    @InjectMocks OutboundService service;

    @BeforeEach void useSharedClosingStock() {
        org.springframework.test.util.ReflectionTestUtils.setField(service, "warehouseStockService",
                new com.wms.module.inventory.service.WarehouseStockService(products, inventory, locations, batches));
        lenient().when(suppliers.findById(100L)).thenReturn(Optional.of(
                com.wms.module.masterdata.entity.Supplier.builder().id(100L).name("Receiver")
                        .partnerRole(com.wms.module.masterdata.entity.PartnerRole.RECEIVER).build()));
    }

    private Inventory stock(long location, long batch, int onHand, int reserved) {
        return Inventory.builder().id(location).productId(1L).locationId(location).batchId(batch)
                .onHandQty(onHand).reservedQty(reserved).build();
    }
    private ProductBatch batch(long id) {
        return ProductBatch.builder().id(id).productId(1L).expiryDate(LocalDate.now().plusDays(10)).build();
    }
    private OutboundOrder order(String status, int qty) {
        OutboundOrder order = OutboundOrder.builder().id(7L).orderCode("SO-7").warehouseId(1L).partnerId(100L).status(status).build();
        order.setItems(List.of(OutboundOrderItem.builder().id(8L).outboundOrder(order).productId(1L)
                .requestedQty(qty).allocatedQty(qty).pickedQty(0).allocations(new ArrayList<>()).build()));
        when(orders.findForUpdate(7L)).thenReturn(Optional.of(order));
        return order;
    }
    private PickAllocation allocation(OutboundOrder order, long location, long batch, int qty) {
        return PickAllocation.builder().id(location).outboundOrderItem(order.getItems().get(0))
                .productId(1L).locationId(location).batchId(batch).allocatedQty(qty).status("ALLOCATED").build();
    }
    private void warehouse(long location, long warehouse) {
        when(locations.findById(location)).thenReturn(Optional.of(Location.builder().id(location).warehouseId(warehouse).build()));
    }

    @Test void productOptionsExcludeUnavailableBatchesAndSeparateWarehouses() {
        when(products.findAll()).thenReturn(List.of(Product.builder().id(1L).sku("P1").name("Milk").build()));
        when(locations.findAll()).thenReturn(List.of(Location.builder().id(1L).warehouseId(1L).build(),
                Location.builder().id(2L).warehouseId(2L).build()));
        when(batches.findActiveBatchesOrderByExpiryAsc(eq(1L), any())).thenReturn(List.of(batch(10)));
        when(inventory.findAll()).thenReturn(List.of(stock(1, 10, 20, 5), stock(1, 11, 100, 0), stock(2, 10, 8, 8)));
        var result = service.getAvailableProducts();
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getWarehouseId());
        assertEquals(120, result.get(0).getOnHandQty());
        assertEquals(15, result.get(0).getAvailableQty());
        assertEquals(2, service.getStockProducts(true).size());
    }

    @Test void createRejectsProductWithoutWarehouseStock() {
        var request = CreateOutboundOrderRequest.builder().warehouseId(1L).partnerId(100L).items(List.of(
                CreateOutboundOrderRequest.ItemRequest.builder().productId(99L).requestedQty(1).build())).build();
        assertThrows(BusinessException.class, () -> service.createOutboundOrder(request));
        verify(orders, never()).save(any());
    }

    @Test void outboundOptionsContainOnlyActiveReceiversWithoutRequiringSuppliedProducts() {
        when(suppliers.findAll()).thenReturn(List.of(
                com.wms.module.masterdata.entity.Supplier.builder().id(1L).name("Supplier").build(),
                com.wms.module.masterdata.entity.Supplier.builder().id(2L).name("Receiver")
                        .partnerRole(com.wms.module.masterdata.entity.PartnerRole.RECEIVER).build(),
                com.wms.module.masterdata.entity.Supplier.builder().id(3L).name("Inactive receiver")
                        .partnerRole(com.wms.module.masterdata.entity.PartnerRole.RECEIVER).isActive(false).build()));
        var partners = service.getWarehousePartners(1L);
        assertEquals(1, partners.size());
        assertEquals(2L, partners.get(0).getId());
        verifyNoInteractions(products, inventory);
    }

    @Test void createRejectsReceiverOutsideWarehousePartnerList() {
        var request = CreateOutboundOrderRequest.builder().warehouseId(1L).partnerId(99L).items(List.of(
                CreateOutboundOrderRequest.ItemRequest.builder().productId(1L).requestedQty(1).build())).build();
        assertThrows(BusinessException.class, () -> service.createOutboundOrder(request));
        verify(orders, never()).save(any());
    }

    @Test void closingStockExcludesDeletedProductsWithoutInventingStockForCatalogueOnlyProducts() {
        when(products.findAll()).thenReturn(List.of(
                Product.builder().id(1L).deletedAt(java.time.Instant.now()).build(),
                Product.builder().id(2L).name("Never received").build()));
        when(locations.findAll()).thenReturn(List.of(Location.builder().id(1L).warehouseId(1L).build()));
        when(inventory.findAll()).thenReturn(List.of(stock(1, 10, 99, 0)));
        assertTrue(service.getStockProducts(true).isEmpty());
    }

    @Test void allocationDoesNotTakeStockFromAnotherWarehouse() {
        order("PENDING", 5);
        when(batches.findActiveBatchesOrderByExpiryAsc(eq(1L), any())).thenReturn(List.of(batch(10)));
        when(inventory.findByProductIdAndBatchId(1L, 10L)).thenReturn(List.of(stock(2, 10, 100, 0)));
        warehouse(2, 2);
        assertThrows(BusinessException.class, () -> service.allocateOutboundOrderFefo(7L));
        verifyNoInteractions(locks);
    }

    @Test void allocationCannotReserveAgain() {
        order("ALLOCATED", 5);
        assertThrows(BusinessException.class, () -> service.allocateOutboundOrderFefo(7L));
        verifyNoInteractions(locks);
    }

    @Test void dispatchDeductsExactQuantityAcrossBatchesAndKeepsOtherReservations() {
        OutboundOrder order = order("ALLOCATED", 8);
        Inventory first = stock(1, 10, 10, 7), second = stock(2, 11, 20, 6);
        when(allocations.findByOutboundOrderItemId(8L)).thenReturn(List.of(allocation(order, 1, 10, 5), allocation(order, 2, 11, 3)));
        when(inventory.findByProductLocationAndBatchForUpdate(1L, 1L, 10L)).thenReturn(Optional.of(first));
        when(inventory.findByProductLocationAndBatchForUpdate(1L, 2L, 11L)).thenReturn(Optional.of(second));
        when(batches.findActiveBatchesOrderByExpiryAsc(eq(1L), any())).thenReturn(List.of(batch(10), batch(11)));
        warehouse(1, 1); warehouse(2, 1);
        when(orders.save(any())).thenAnswer(i -> i.getArgument(0));
        service.dispatchOutboundOrder(7L);
        assertEquals(5, first.getOnHandQty()); assertEquals(2, first.getReservedQty());
        assertEquals(17, second.getOnHandQty()); assertEquals(3, second.getReservedQty());
        assertEquals("DISPATCHED", order.getStatus()); assertEquals(8, order.getItems().get(0).getPickedQty());
        ArgumentCaptor<StockLedger> ledger = ArgumentCaptor.forClass(StockLedger.class);
        verify(ledgers, times(2)).save(ledger.capture());
        assertEquals(-8, ledger.getAllValues().stream().mapToInt(StockLedger::getQtyChange).sum());
        assertEquals(List.of(5, 17), ledger.getAllValues().stream().map(StockLedger::getBalanceAfter).toList());
        assertThrows(BusinessException.class, () -> service.dispatchOutboundOrder(7L));
        verify(ledgers, times(2)).save(any());
    }

    @Test void directDispatchAllocatesBeforeDeductingAndDoesNotTouchOtherReservations() {
        OutboundOrder order = order("PENDING", 8);
        Inventory inv = stock(1, 10, 20, 4);
        warehouse(1, 1);
        when(batches.findActiveBatchesOrderByExpiryAsc(eq(1L), any())).thenReturn(List.of(batch(10)));
        when(inventory.findByProductIdAndBatchId(1L, 10L)).thenReturn(List.of(inv));
        when(inventory.findByProductLocationAndBatchForUpdate(1L, 1L, 10L)).thenReturn(Optional.of(inv));
        doAnswer(call -> { inv.setReservedQty(inv.getReservedQty() + 8); return null; })
                .when(locks).reserveStock(1L, 1L, 10L, 8);
        List<PickAllocation> saved = new ArrayList<>();
        when(allocations.save(any())).thenAnswer(call -> {
            PickAllocation allocation = call.getArgument(0);
            if (!saved.contains(allocation)) saved.add(allocation);
            return allocation;
        });
        when(allocations.findByOutboundOrderItemId(8L)).thenAnswer(call -> saved);
        when(orders.save(any())).thenAnswer(call -> call.getArgument(0));
        service.dispatchOutboundOrder(7L);
        assertEquals(12, inv.getOnHandQty());
        assertEquals(4, inv.getReservedQty());
        assertEquals("DISPATCHED", order.getStatus());
        verify(locks).reserveStock(1L, 1L, 10L, 8);
        verify(ledgers).save(any());
    }

    @Test void createRejectsQuantityAboveAvailableAndDuplicateProducts() {
        when(products.findAll()).thenReturn(List.of(Product.builder().id(1L).build()));
        when(locations.findAll()).thenReturn(List.of(Location.builder().id(1L).warehouseId(1L).build()));
        when(batches.findActiveBatchesOrderByExpiryAsc(eq(1L), any())).thenReturn(List.of(batch(10)));
        when(inventory.findAll()).thenReturn(List.of(stock(1, 10, 10, 5)));
        var request = CreateOutboundOrderRequest.builder().warehouseId(1L).partnerId(100L).items(List.of(
                CreateOutboundOrderRequest.ItemRequest.builder().productId(1L).requestedQty(6).build())).build();
        assertThrows(BusinessException.class, () -> service.createOutboundOrder(request));
        var item = CreateOutboundOrderRequest.ItemRequest.builder().productId(1L).requestedQty(3).build();
        request.setItems(List.of(item, item));
        assertThrows(BusinessException.class, () -> service.createOutboundOrder(request));
        verify(orders, never()).save(any());
    }

    @Test void createDoesNotDeductStockOrTrustClientAllocatedQuantity() {
        when(products.findAll()).thenReturn(List.of(Product.builder().id(1L).build()));
        when(locations.findAll()).thenReturn(List.of(Location.builder().id(1L).warehouseId(1L).build()));
        when(batches.findActiveBatchesOrderByExpiryAsc(eq(1L), any())).thenReturn(List.of(batch(10)));
        Inventory inv = stock(1, 10, 10, 5);
        when(inventory.findAll()).thenReturn(List.of(inv));
        when(orders.save(any())).thenAnswer(call -> call.getArgument(0));
        var response = service.createOutboundOrder(CreateOutboundOrderRequest.builder().warehouseId(1L).partnerId(100L).items(List.of(
                CreateOutboundOrderRequest.ItemRequest.builder().productId(1L).requestedQty(5).allocatedQty(999).build())).build());
        assertEquals("PENDING", response.getStatus());
        assertEquals(0, response.getItems().get(0).getAllocatedQty());
        assertEquals(10, inv.getOnHandQty());
        assertEquals(5, inv.getReservedQty());
        verifyNoInteractions(locks, ledgers);
    }

    @Test void dispatchRejectsIncompleteAllocation() {
        OutboundOrder order = order("ALLOCATED", 8);
        when(allocations.findByOutboundOrderItemId(8L)).thenReturn(List.of(allocation(order, 1, 10, 5)));
        assertThrows(BusinessException.class, () -> service.dispatchOutboundOrder(7L));
        assertEquals("ALLOCATED", order.getStatus());
        verify(inventory, never()).saveAndFlush(any()); verifyNoInteractions(ledgers);
    }

    @Test void dispatchRejectsInsufficientPhysicalStockInsteadOfClampingToZero() {
        OutboundOrder order = order("ALLOCATED", 8);
        Inventory inv = stock(1, 10, 3, 8);
        when(allocations.findByOutboundOrderItemId(8L)).thenReturn(List.of(allocation(order, 1, 10, 8)));
        when(inventory.findByProductLocationAndBatchForUpdate(1L, 1L, 10L)).thenReturn(Optional.of(inv));
        when(batches.findActiveBatchesOrderByExpiryAsc(eq(1L), any())).thenReturn(List.of(batch(10)));
        warehouse(1, 1);
        assertThrows(BusinessException.class, () -> service.dispatchOutboundOrder(7L));
        assertEquals(3, inv.getOnHandQty()); verifyNoInteractions(ledgers);
    }

    @Test void dispatchRejectsAllocationInAnotherWarehouse() {
        OutboundOrder order = order("ALLOCATED", 8);
        when(allocations.findByOutboundOrderItemId(8L)).thenReturn(List.of(allocation(order, 2, 10, 8)));
        when(inventory.findByProductLocationAndBatchForUpdate(1L, 2L, 10L)).thenReturn(Optional.of(stock(2, 10, 20, 8)));
        when(batches.findActiveBatchesOrderByExpiryAsc(eq(1L), any())).thenReturn(List.of(batch(10)));
        warehouse(2, 2);
        assertThrows(BusinessException.class, () -> service.dispatchOutboundOrder(7L)); verifyNoInteractions(ledgers);
    }

    @Test void dispatchRejectsExpiredOrQuarantinedAllocation() {
        OutboundOrder order = order("ALLOCATED", 8);
        when(allocations.findByOutboundOrderItemId(8L)).thenReturn(List.of(allocation(order, 1, 10, 8)));
        when(inventory.findByProductLocationAndBatchForUpdate(1L, 1L, 10L)).thenReturn(Optional.of(stock(1, 10, 20, 8)));
        warehouse(1, 1);
        assertThrows(BusinessException.class, () -> service.dispatchOutboundOrder(7L)); verifyNoInteractions(ledgers);
    }
}
