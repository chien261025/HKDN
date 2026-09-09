package com.wms.concurrency;

import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.service.InventoryLockService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Bài kiểm thử Concurrency: Giả lập 20 luồng đồng thời cùng tranh chấp hàng
 * Chứng minh hệ thống không bao giờ bị âm kho nhờ Pessimistic Locking
 */
@SpringBootTest
public class InventoryLockingTest {

    @Autowired
    private InventoryLockService inventoryLockService;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Test
    @DisplayName("Giả lập 20 luồng cùng tranh chấp 1 mặt hàng chỉ còn 10 cái")
    public void testConcurrentReservation() throws InterruptedException {
        // Chuẩn bị dữ liệu mẫu: Kho chỉ có 10 cái hàng
        Long productId = 1001L;
        Long locationId = 2001L;
        Long batchId = 3001L;

        Inventory testStock = Inventory.builder()
                .productId(productId)
                .locationId(locationId)
                .batchId(batchId)
                .onHandQty(10)
                .reservedQty(0)
                .build();
        inventoryRepository.save(testStock);

        int numberOfThreads = 20;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        // Kích hoạt 20 luồng cùng xuất phát 1 giây
        for (int i = 0; i < numberOfThreads; i++) {
            executorService.execute(() -> {
                try {
                    // Mỗi luồng yêu cầu giữ 1 cái
                    inventoryLockService.reserveStock(productId, locationId, batchId, 1);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executorService.shutdown();

        // Kết quả mong đợi: Đúng 10 luồng thành công, 10 luồng thất bại, KHÔNG BAO GIỜ ÂM KHO!
        assertEquals(10, successCount.get(), "Chỉ đúng 10 đơn vị được phép giữ thành công");
        assertEquals(10, failCount.get(), "10 yêu cầu còn lại phải bị từ chối vì hết hàng");

        Inventory finalState = inventoryRepository.findByProductIdAndLocationIdAndBatchId(productId, locationId, batchId).get();
        assertEquals(10, finalState.getReservedQty(), "Reserved Qty phải bằng đúng 10");
        assertEquals(0, finalState.getAvailableQty(), "Available Qty phải bằng 0 (hết sạch)");
    }
}
