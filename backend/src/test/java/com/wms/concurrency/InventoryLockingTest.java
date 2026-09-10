package com.wms.concurrency;

import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.entity.ProductBatch;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.ProductBatchRepository;
import com.wms.module.inventory.service.InventoryLockService;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductBatchRepository productBatchRepository;

    private Long productId;
    private Long locationId;
    private Long batchId;

    @BeforeEach
    public void setUp() {
        // Đảm bảo Location hợp lệ tồn tại trong DB (thỏa mãn Foreign Key)
        Location location = locationRepository.findAll().stream().findFirst()
                .orElseGet(() -> locationRepository.save(Location.builder()
                        .zoneCode("ZONE_A")
                        .aisle("A01")
                        .rack("R01")
                        .shelf("S01")
                        .binBarcode("ZA-TEST-CONCURRENCY")
                        .maxWeightKg(BigDecimal.valueOf(500.0))
                        .isActive(true)
                        .build()));
        locationId = location.getId();

        // Đảm bảo Product hợp lệ tồn tại trong DB (thỏa mãn Foreign Key)
        Product product = productRepository.findAll().stream().findFirst()
                .orElseGet(() -> productRepository.save(Product.builder()
                        .sku("SKU-TEST-LOCK-" + System.currentTimeMillis())
                        .barcode("BARCODE-TEST-" + System.currentTimeMillis())
                        .name("Sản phẩm Test Khóa Concurrency")
                        .unit("Cái")
                        .build()));
        productId = product.getId();

        // Đảm bảo ProductBatch hợp lệ tồn tại trong DB (thỏa mãn Foreign Key)
        ProductBatch batch = productBatchRepository.findAll().stream()
                .filter(b -> b.getProductId().equals(productId))
                .findFirst()
                .orElseGet(() -> productBatchRepository.save(ProductBatch.builder()
                        .productId(productId)
                        .batchNumber("BATCH-TEST-" + System.currentTimeMillis())
                        .expiryDate(LocalDate.now().plusMonths(6))
                        .build()));
        batchId = batch.getId();

        // Dọn dẹp bản ghi tồn kho cũ nếu có
        inventoryRepository.findByProductIdAndLocationIdAndBatchId(productId, locationId, batchId)
                .ifPresent(inventoryRepository::delete);

        // Chuẩn bị dữ liệu mẫu: Kho chỉ có 10 cái hàng, 0 cái đang giữ
        Inventory testStock = Inventory.builder()
                .productId(productId)
                .locationId(locationId)
                .batchId(batchId)
                .onHandQty(10)
                .reservedQty(0)
                .build();
        inventoryRepository.save(testStock);
    }

    @AfterEach
    public void tearDown() {
        if (productId != null && locationId != null && batchId != null) {
            inventoryRepository.findByProductIdAndLocationIdAndBatchId(productId, locationId, batchId)
                    .ifPresent(inventoryRepository::delete);
        }
    }

    @Test
    @DisplayName("Giả lập 20 luồng cùng tranh chấp 1 mặt hàng chỉ còn 10 cái")
    public void testConcurrentReservation() throws InterruptedException {
        int numberOfThreads = 20;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        // Kích hoạt 20 luồng cùng xuất phát đồng thời
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

        Inventory finalState = inventoryRepository.findByProductIdAndLocationIdAndBatchId(productId, locationId, batchId).orElseThrow();
        assertEquals(10, finalState.getReservedQty(), "Reserved Qty phải bằng đúng 10");
        assertEquals(0, finalState.getAvailableQty(), "Available Qty phải bằng 0 (hết sạch)");
    }
}
