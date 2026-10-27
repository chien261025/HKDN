package com.wms.module.identity.constant;

/**
 * Các hằng số bảo mật, phiên làm việc và chống brute-force toàn hệ thống.
 * Loại bỏ Magic Numbers, tập trung quản lý chính sách bảo mật doanh nghiệp.
 */
public final class SecurityConstants {

    private SecurityConstants() {
        // Utility class
    }

    // --- Session Policy ---
    public static final int MAX_CONCURRENT_SESSIONS = 2;

    // --- Brute-Force & Lockout Policy ---
    public static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;
    public static final long INACTIVITY_EXPIRY_SECONDS = 900; // 15 phút không thao tác -> reset
    public static final long LOCKOUT_LEVEL_1_SECONDS = 60;   // 1 phút
    public static final long LOCKOUT_LEVEL_2_SECONDS = 180;  // 3 phút
    public static final long LOCKOUT_LEVEL_3_SECONDS = 900;  // 15 phút
    public static final long LOCKOUT_MAX_SECONDS = 3600;     // 1 giờ

    // --- OTP & Password Recovery Policy ---
    public static final int OTP_EXPIRATION_SECONDS = 180;    // 3 phút

    // --- JWT Token Policy ---
    public static final long JWT_EXPIRATION_MS = 86_400_000L; // 24 giờ
    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String HEADER_AUTHORIZATION = "Authorization";
    public static final String HEADER_DEVICE_FINGERPRINT = "X-Device-Fingerprint";

    // --- Audit Reasons ---
    public static final String REASON_PASSWORD_RESET = "PASSWORD_RESET_REVOKE_ALL";
    public static final String REASON_ADMIN_FORCE_LOGOUT = "ADMIN_FORCE_LOGOUT";
    public static final String REASON_SESSION_REVOKED = "SESSION_REVOKED";
    public static final String REASON_MAX_SESSIONS_EXCEEDED = "MAX_SESSIONS_EXCEEDED";
    public static final String REASON_ACTIVE = "ACTIVE";
    public static final String REASON_NO_TOKEN = "NO_TOKEN";
}
