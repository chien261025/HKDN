package com.wms.module.inventory.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin chi tiết lệnh điều chuyển nội bộ")
public class StockTransferResponse {

    @Schema(description = "ID của lệnh điều chuyển")
    private Long id;

    @Schema(description = "Mã phiếu điều chuyển", example = "TRF-882190")
    private String transferCode;

    @Schema(description = "ID ô kệ nguồn")
    private Long fromLocationId;

    @Schema(description = "Mã vạch ô kệ nguồn", example = "ZB-B01-R01-S01-B05")
    private String fromLocationBarcode;

    @Schema(description = "ID ô kệ đích")
    private Long toLocationId;

    @Schema(description = "Mã vạch ô kệ đích", example = "ZB-B01-R01-S02-B06")
    private String toLocationBarcode;

    @Schema(description = "ID sản phẩm")
    private Long productId;

    @Schema(description = "Mã SKU sản phẩm", example = "SKU-MILK-100")
    private String productSku;

    @Schema(description = "Tên sản phẩm", example = "Sữa tươi tiệt trùng Vinamilk 100% 1L")
    private String productName;

    @Schema(description = "ID lô hàng")
    private Long batchId;

    @Schema(description = "Số lô", example = "BATCH-MILK-26A")
    private String batchNumber;

    @Schema(description = "Số lượng điều chuyển", example = "10")
    private Integer quantity;

    @Schema(description = "Trạng thái lệnh chuyển", example = "COMPLETED")
    private String status;

    @Schema(description = "Ghi chú điều chuyển")
    private String notes;

    @Schema(description = "Thời gian tạo lệnh")
    private Instant createdAt;

    @Schema(description = "Thời gian hoàn tất")
    private Instant completedAt;
}
