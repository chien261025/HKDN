package com.wms.module.order.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboundStockResponse {
    private Long productId;
    private Long warehouseId;
    private String sku;
    private String name;
    private String unit;
    private int onHandQty;        // Tổng tồn thực tế vật lý
    private int reservedQty;      // Đã khóa/giữ trước cho đơn xuất
    private int unavailableQty;   // Chưa giữ cho đơn nhưng không thể xuất (hết hạn / cách ly / khóa kệ)
    private int availableQty;     // Tồn khả dụng có thể cấp phát ngay (OnHand - Reserved - Unavailable)
}
