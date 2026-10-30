package com.wms.module.identity.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wms.common.response.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

/**
 * Bộ lọc bảo vệ hệ thống trước tấn công DoS, DDoS quét tần suất cao (Layer 7 Rate Limiting).
 * Sử dụng Redis Counter phân tán kèm TTL trượt theo từng phút cho mỗi Client IP.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApiRateLimitingFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    // Giới hạn tối đa 200 requests/phút trên mỗi địa chỉ IP
    private static final int MAX_REQUESTS_PER_MINUTE = 200;
    private static final String RATE_LIMIT_PREFIX = "wms:ratelimit:api:ip:";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String uri = request.getRequestURI();

        // Bỏ qua rate limit cho Swagger docs và WebSocket handshake
        if (uri.startsWith("/swagger-ui") || uri.startsWith("/v3/api-docs") || uri.startsWith("/ws")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = resolveClientIp(request);
        String redisKey = RATE_LIMIT_PREFIX + clientIp;

        try {
            Long count = redisTemplate.opsForValue().increment(redisKey);
            if (count != null && count == 1) {
                redisTemplate.expire(redisKey, Duration.ofMinutes(1));
            }

            if (count != null && count > MAX_REQUESTS_PER_MINUTE) {
                log.warn("[SECURITY-DOS-DEFENSE] Phát hiện tấn công tần suất cao từ IP: {}. Tổng request trong phút: {}", clientIp, count);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
                response.setHeader("Retry-After", "60");
                response.setHeader("X-RateLimit-Limit", String.valueOf(MAX_REQUESTS_PER_MINUTE));
                response.setHeader("X-RateLimit-Remaining", "0");

                ApiResponse<Void> errorResponse = ApiResponse.error("Phát hiện tần suất truy cập bất thường (Quá nhiều yêu cầu từ IP của bạn). Vui lòng thử lại sau 1 phút để bảo vệ hệ thống!");
                response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
                return;
            }

            // Ghi nhận HTTP headers chuẩn RFC Rate-Limiting
            response.setHeader("X-RateLimit-Limit", String.valueOf(MAX_REQUESTS_PER_MINUTE));
            long remaining = (count != null) ? Math.max(0, MAX_REQUESTS_PER_MINUTE - count) : MAX_REQUESTS_PER_MINUTE;
            response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));

        } catch (Exception e) {
            // Fail-open: Khi cụm Redis gặp sự cố, hệ thống không chặn request của người dùng hợp lệ
            log.warn("[RATE-LIMIT] Redis tạm thời không phản hồi, cho phép request đi tiếp: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}

