package com.wms.common.exception;

import com.wms.common.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException ex) {
        log.warn("[BUSINESS_EXCEPTION] Mã lỗi: {} | Chi tiết: {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity
                .status(ex.getErrorCode().getHttpStatus())
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(ConcurrencyFailureException.class)
    public ResponseEntity<ApiResponse<Void>> handleConcurrencyException(ConcurrencyFailureException ex) {
        log.warn("[CONCURRENCY_CONFLICT] Xung đột thao tác đồng thời: {}", ex.getMessage());
        return ResponseEntity
                .status(ErrorCode.CONCURRENCY_CONFLICT.getHttpStatus())
                .body(ApiResponse.error("Xung đột khóa dữ liệu tồn kho do có nhiều thao tác xử lý đồng thời. Vui lòng thử lại!"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex) {
        String errorMsg = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining("; "));
        if (errorMsg.isBlank()) {
            errorMsg = "Dữ liệu đầu vào không hợp lệ";
        }
        log.warn("[VALIDATION_ERROR] {}", errorMsg);
        return ResponseEntity.badRequest().body(ApiResponse.error(errorMsg));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("[ACCESS_DENIED] {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Bạn không có quyền truy cập chức năng này (Yêu cầu quyền Quản trị viên)!"));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(NoResourceFoundException ex) {
        log.warn("[RESOURCE_NOT_FOUND] Không tìm thấy tài nguyên: {}", ex.getResourcePath());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Không tìm thấy đường dẫn tài nguyên: " + ex.getResourcePath()));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        log.warn("[METHOD_NOT_SUPPORTED] Phương thức HTTP không được hỗ trợ: {}", ex.getMethod());
        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiResponse.error("Phương thức HTTP không được hỗ trợ: " + ex.getMethod()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(Exception ex) {
        log.error("[INTERNAL_ERROR] Đã xảy ra lỗi ngoại lệ hệ thống chưa được phân loại:", ex);
        return ResponseEntity
                .status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())
                .body(ApiResponse.error("Hệ thống đang gặp sự cố xử lý nội bộ. Vui lòng liên hệ Quản trị viên để được hỗ trợ."));
    }
}
