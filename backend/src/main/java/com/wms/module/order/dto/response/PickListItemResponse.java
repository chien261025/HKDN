package com.wms.module.order.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PickListItemResponse {
    private String binBarcode;     // Mã vạch ô kệ cần đến lấy (VD: ZA-A01-R01-S01-B01)
    private String productSku;     // Mã sản phẩm
    private String productName;    // Tên sản phẩm
    private String batchNumber;    // Số Lô chỉ định nhặt
    private LocalDate expiryDate;  // Hạn sử dụng của Lô (Ưu tiên cận date nhất - FEFO)
    private int pickQty;           // Số lượng cần lấy tại ô này
    private int stepOrder;         // Thứ tự di chuyển tối ưu trong lộ trình
}
