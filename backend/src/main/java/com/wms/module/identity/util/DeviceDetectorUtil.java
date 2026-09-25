package com.wms.module.identity.util;

import jakarta.servlet.http.HttpServletRequest;

public final class DeviceDetectorUtil {

    private DeviceDetectorUtil() {}

    public static String extractClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return (ip != null && !ip.isBlank()) ? ip : "127.0.0.1";
    }

    public static String resolveLocation(String ip) {
        if (ip == null || ip.isBlank() || "127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip) || ip.startsWith("172.")) {
            return "Trụ Sở WMS / Văn Phòng Điều Hành (TP.HCM)";
        }
        if (ip.startsWith("192.168.1.")) {
            return "Kho Tổng Tân Bình - ZONE A & B (LAN Nội Bộ)";
        }
        if (ip.startsWith("192.168.2.")) {
            return "Kho Phân Phối Bình Chánh (LAN Nội Bộ)";
        }
        return "TP. Hồ Chí Minh, VN (Mạng Cáp Quang)";
    }

    public static DeviceInfo detectDevice(HttpServletRequest request) {
        String ua = request != null ? request.getHeader("User-Agent") : "";
        if (ua == null || ua.isBlank()) {
            return new DeviceInfo("Trình Duyệt Web Tiêu Chuẩn", "DESKTOP");
        }

        String lowerUa = ua.toLowerCase();
        String os = "Hệ Điều Hành Khác";
        if (lowerUa.contains("windows nt 10.0") || lowerUa.contains("windows nt 11.0")) os = "Windows 11/10";
        else if (lowerUa.contains("mac os x")) os = "macOS";
        else if (lowerUa.contains("android")) os = "Android";
        else if (lowerUa.contains("iphone") || lowerUa.contains("ipad")) os = "iOS";
        else if (lowerUa.contains("linux")) os = "Linux";

        String browser = "Trình duyệt Web";
        if (lowerUa.contains("edg/")) browser = "Microsoft Edge";
        else if (lowerUa.contains("chrome/")) browser = "Google Chrome";
        else if (lowerUa.contains("safari/") && !lowerUa.contains("chrome")) browser = "Apple Safari";
        else if (lowerUa.contains("firefox/")) browser = "Mozilla Firefox";

        String deviceType = "DESKTOP";
        if (lowerUa.contains("mobile") || lowerUa.contains("android") || lowerUa.contains("iphone")) {
            deviceType = "MOBILE_PDA";
        } else if (lowerUa.contains("ipad") || lowerUa.contains("tablet")) {
            deviceType = "TABLET";
        }

        String deviceName = os + " (" + browser + ")";
        if ("MOBILE_PDA".equals(deviceType) && lowerUa.contains("android")) {
            deviceName = "PDA Scanner / Android (" + browser + ")";
        }

        return new DeviceInfo(deviceName, deviceType);
    }

    public record DeviceInfo(String deviceName, String deviceType) {}
}
