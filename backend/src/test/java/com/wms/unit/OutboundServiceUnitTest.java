package com.wms.unit;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.entity.ProductBatch;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.ProductBatchRepository;
import com.wms.module.inventory.service.InventoryLockService;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.order.dto.response.PickListItemResponse;
import com.wms.module.order.service.OutboundService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OutboundServiceUnitTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductBatchRepository productBatchRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private InventoryLockService inventoryLockService;

    @InjectMocks
    private OutboundService outboundService;

    @Test
    @DisplayName("FEFO: Uu tien xuat lo co han su dung gan nhat truoc")
    void testGenerateFefoPickList_EarliestExpiryFirst() {
        Long productId = 1L;
        Product product = Product.builder()
                .id(productId)
                .sku("SKU-MILK-100")
                .name("Sữa tươi 1L")
                .build();

        ProductBatch batchNearExpiry = ProductBatch.builder()
                .id(101L)
                .productId(productId)
                .batchNumber("BATCH-EARLY")
                .expiryDate(LocalDate.now().plusDays(10))
                .build();

        ProductBatch batchLaterExpiry = ProductBatch.builder()
                .id(102L)
                .productId(productId)
                .batchNumber("BATCH-LATE")
                .expiryDate(LocalDate.now().plusDays(60))
                .build();

        Inventory inv1 = Inventory.builder()
                .id(1L)
                .productId(productId)
                .locationId(5L)
                .batchId(101L)
                .onHandQty(20)
                .reservedQty(0) // Available: 20
                .build();

        Location loc = Location.builder()
                .id(5L)
                .binBarcode("ZB-B01-R01-S01-B05")
                .build();

        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productBatchRepository.findActiveBatchesOrderByExpiryAsc(eq(productId), any(LocalDate.class)))
                .thenReturn(List.of(batchNearExpiry, batchLaterExpiry));
        when(inventoryRepository.findAll()).thenReturn(List.of(inv1));
        when(locationRepository.findById(5L)).thenReturn(Optional.of(loc));

        // Xuat 5 hop
        List<PickListItemResponse> pickList = outboundService.generateFefoPickList(productId, 5);

        assertNotNull(pickList);
        assertEquals(1, pickList.size());
        PickListItemResponse item = pickList.get(0);
        assertEquals("BATCH-EARLY", item.getBatchNumber(), "Phai lay lo BATCH-EARLY vi han gan hon");
        assertEquals(5, item.getPickQty());
        assertEquals("ZB-B01-R01-S01-B05", item.getBinBarcode());

        // Kiem tra da goi khoa ton kho
        verify(inventoryLockService, times(1)).reserveStock(productId, 5L, 101L, 5);
    }

    @Test
    @DisplayName("FEFO: Chia tach lay tu nhieu lo khi lo dau khong du so luong")
    void testGenerateFefoPickList_MultiBatchAllocation() {
        Long productId = 1L;
        Product product = Product.builder()
                .id(productId)
                .sku("SKU-MILK-100")
                .name("Sữa tươi 1L")
                .build();

        ProductBatch batch1 = ProductBatch.builder()
                .id(101L)
                .productId(productId)
                .batchNumber("BATCH-1")
                .expiryDate(LocalDate.now().plusDays(10))
                .build();

        ProductBatch batch2 = ProductBatch.builder()
                .id(102L)
                .productId(productId)
                .batchNumber("BATCH-2")
                .expiryDate(LocalDate.now().plusDays(30))
                .build();

        Inventory invBatch1 = Inventory.builder()
                .id(1L)
                .productId(productId)
                .locationId(5L)
                .batchId(101L)
                .onHandQty(5)
                .reservedQty(0) // Available: 5
                .build();

        Inventory invBatch2 = Inventory.builder()
                .id(2L)
                .productId(productId)
                .locationId(6L)
                .batchId(102L)
                .onHandQty(20)
                .reservedQty(0) // Available: 20
                .build();

        Location loc5 = Location.builder().id(5L).binBarcode("BIN-05").build();
        Location loc6 = Location.builder().id(6L).binBarcode("BIN-06").build();

        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productBatchRepository.findActiveBatchesOrderByExpiryAsc(eq(productId), any(LocalDate.class)))
                .thenReturn(List.of(batch1, batch2));
        when(inventoryRepository.findAll()).thenReturn(List.of(invBatch1, invBatch2));
        when(locationRepository.findById(5L)).thenReturn(Optional.of(loc5));
        when(locationRepository.findById(6L)).thenReturn(Optional.of(loc6));

        // Yeu cau xuat 12 hop: 5 hop tu Batch 1 + 7 hop tu Batch 2
        List<PickListItemResponse> pickList = outboundService.generateFefoPickList(productId, 12);

        assertEquals(2, pickList.size());
        assertEquals("BATCH-1", pickList.get(0).getBatchNumber());
        assertEquals(5, pickList.get(0).getPickQty());

        assertEquals("BATCH-2", pickList.get(1).getBatchNumber());
        assertEquals(7, pickList.get(1).getPickQty());

        verify(inventoryLockService, times(1)).reserveStock(productId, 5L, 101L, 5);
        verify(inventoryLockService, times(1)).reserveStock(productId, 6L, 102L, 7);
    }

    @Test
    @DisplayName("Nem loi INSUFFICIENT_STOCK khi tong ton kho tat ca cac lo khong du")
    void testGenerateFefoPickList_InsufficientStock() {
        Long productId = 1L;
        Product product = Product.builder().id(productId).sku("SKU-1").name("SP 1").build();

        ProductBatch batch1 = ProductBatch.builder()
                .id(101L)
                .productId(productId)
                .batchNumber("BATCH-1")
                .expiryDate(LocalDate.now().plusDays(10))
                .build();

        Inventory inv = Inventory.builder()
                .id(1L)
                .productId(productId)
                .locationId(5L)
                .batchId(101L)
                .onHandQty(5)
                .reservedQty(0)
                .build();

        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productBatchRepository.findActiveBatchesOrderByExpiryAsc(eq(productId), any(LocalDate.class)))
                .thenReturn(List.of(batch1));
        when(inventoryRepository.findAll()).thenReturn(List.of(inv));

        // Can 20 hop nhung chi co 5
        BusinessException ex = assertThrows(BusinessException.class, () ->
                outboundService.generateFefoPickList(productId, 20));

        assertEquals(ErrorCode.INSUFFICIENT_STOCK, ex.getErrorCode());
    }
}
