package com.wms.unit;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.service.InventoryLockService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InventoryLockServiceUnitTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @InjectMocks
    private InventoryLockService inventoryLockService;

    @Test
    @DisplayName("Giu hang thanh cong khi so luong ton kha dung du")
    void testReserveStock_Success() {
        Long productId = 1L;
        Long locationId = 1L;
        Long batchId = 1L;
        int requestedQty = 5;

        Inventory inventory = Inventory.builder()
                .id(100L)
                .productId(productId)
                .locationId(locationId)
                .batchId(batchId)
                .onHandQty(20)
                .reservedQty(5) // Kha dung: 20 - 5 = 15
                .build();

        when(inventoryRepository.findByProductLocationAndBatchForUpdate(productId, locationId, batchId))
                .thenReturn(Optional.of(inventory));

        assertDoesNotThrow(() -> inventoryLockService.reserveStock(productId, locationId, batchId, requestedQty));

        // Kiem tra so luong reserved da tang tu 5 -> 10
        assertEquals(10, inventory.getReservedQty());
        assertEquals(10, inventory.getAvailableQty());
        verify(inventoryRepository, times(1)).save(inventory);
    }

    @Test
    @DisplayName("Nem loi INSUFFICIENT_STOCK khi ton kha dung khong du")
    void testReserveStock_InsufficientStock() {
        Long productId = 1L;
        Long locationId = 1L;
        Long batchId = 1L;
        int requestedQty = 10;

        Inventory inventory = Inventory.builder()
                .id(100L)
                .productId(productId)
                .locationId(locationId)
                .batchId(batchId)
                .onHandQty(10)
                .reservedQty(8) // Kha dung con lai: 2
                .build();

        when(inventoryRepository.findByProductLocationAndBatchForUpdate(productId, locationId, batchId))
                .thenReturn(Optional.of(inventory));

        BusinessException exception = assertThrows(BusinessException.class, () ->
                inventoryLockService.reserveStock(productId, locationId, batchId, requestedQty));

        assertEquals(ErrorCode.INSUFFICIENT_STOCK, exception.getErrorCode());
        verify(inventoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Nem loi NOT_FOUND khi khong tim thay o ke / hang hoa")
    void testReserveStock_NotFound() {
        Long productId = 999L;
        Long locationId = 999L;
        Long batchId = 999L;

        when(inventoryRepository.findByProductLocationAndBatchForUpdate(productId, locationId, batchId))
                .thenReturn(Optional.empty());

        BusinessException exception = assertThrows(BusinessException.class, () ->
                inventoryLockService.reserveStock(productId, locationId, batchId, 1));

        assertEquals(ErrorCode.NOT_FOUND, exception.getErrorCode());
        verify(inventoryRepository, never()).save(any());
    }
}
