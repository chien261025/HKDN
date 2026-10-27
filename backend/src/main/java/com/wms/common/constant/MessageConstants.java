package com.wms.common.constant;

/**
 * Danh mục thông điệp phản hồi chuẩn hóa doanh nghiệp (Clean Architecture).
 */
public final class MessageConstants {

    private MessageConstants() {
        // Utility class
    }

    public static final String LOGIN_SUCCESS = "Đăng nhập thành công!";
    public static final String LOGOUT_SUCCESS = "Đăng xuất thành công! Phiên làm việc đã được hủy an toàn.";
    public static final String REGISTER_SUCCESS = "Đăng ký tài khoản thành công!";
    public static final String PASSWORD_RESET_SUCCESS = "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.";
    public static final String PROFILE_LOAD_SUCCESS = "Lấy thông tin tài khoản thành công!";
    public static final String OTP_SENT_EMAIL = "Mã OTP đã được gửi đến email!";
    public static final String OTP_VERIFY_SUCCESS = "Xác thực OTP thành công!";

    public static final String ERR_USER_NOT_FOUND = "Không tìm thấy tài khoản người dùng!";
    public static final String ERR_ACCOUNT_LOCKED = "Tài khoản đang bị tạm khóa. Vui lòng liên hệ Quản trị viên!";
    public static final String ERR_INVALID_CREDENTIALS = "Tài khoản hoặc mật khẩu không đúng!";
    public static final String ERR_OTP_INVALID_OR_EXPIRED = "Mã OTP không chính xác hoặc đã hết hạn!";
    public static final String ERR_UNAUTHORIZED = "Chưa cung cấp Bearer token!";
    public static final String ERR_USERNAME_EXISTS = "Tên đăng nhập đã tồn tại trong hệ thống!";
    public static final String ERR_EMAIL_EXISTS = "Địa chỉ email đã được sử dụng bởi tài khoản khác!";
}
