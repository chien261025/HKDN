package com.wms.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi máy chủ nội bộ"),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "Yêu cầu không hợp lệ"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Chưa xác thực hoặc token hết hạn"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Không có quyền thực hiện hành động này"),
    NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy tài nguyên yêu cầu"),
    
    // Lỗi Nghiệp Vụ Kho (WMS)
    INSUFFICIENT_STOCK(HttpStatus.CONFLICT, "Số lượng tồn kho khả dụng không đủ"),
    CONCURRENCY_CONFLICT(HttpStatus.CONFLICT, "Xung đột khóa dữ liệu, vui lòng thử lại"),
    LOCATION_FULL(HttpStatus.BAD_REQUEST, "Ô chứa đã đạt tải trọng hoặc thể tích tối đa"),
    INVALID_BARCODE(HttpStatus.BAD_REQUEST, "Mã vạch không hợp lệ hoặc không tồn tại"),
    BATCH_EXPIRED(HttpStatus.BAD_REQUEST, "Lô hàng đã hết hạn sử dụng, không thể xuất");

    private final HttpStatus httpStatus;
    private final String defaultMessage;

    ErrorCode(HttpStatus httpStatus, String defaultMessage) {
        this.httpStatus = httpStatus;
        this.defaultMessage = defaultMessage;
    }
}
