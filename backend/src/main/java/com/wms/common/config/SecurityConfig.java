package com.wms.common.config;

import com.wms.module.identity.security.ApiRateLimitingFilter;
import com.wms.module.identity.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Cấu hình an ninh hệ thống Spring Security 6 & JWT Stateless.
 * Tăng cường phòng thủ đa lớp:
 * - Chống Clickjacking (X-Frame-Options: DENY)
 * - Chống MIME-sniffing (X-Content-Type-Options: nosniff)
 * - Chống rò rỉ dữ liệu (Referrer-Policy & Permissions-Policy)
 * - Chống DoS / Brute-force với ApiRateLimitingFilter
 * - Kiểm soát nguồn tin cậy CORS và phân quyền chặt chẽ theo RBAC
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ApiRateLimitingFilter apiRateLimitingFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Thiết lập bộ Header An ninh mạng chuẩn OWASP
                .headers(headers -> {
                    headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::deny);
                    headers.contentTypeOptions(Customizer.withDefaults());
                    headers.referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN));
                    headers.permissionsPolicy(permissions -> permissions.policy("geolocation=(), camera=(), microphone=()"));
                    headers.contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; frame-ancestors 'none';"));
                })
                // Đăng ký bộ lọc giới hạn tần suất request (chống DoS/DDoS) trước bộ lọc xác thực
                .addFilterBefore(apiRateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
                            response.getWriter().write("{\"success\":false,\"code\":401,\"message\":\"Yêu cầu không hợp lệ hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
                            response.getWriter().write("{\"success\":false,\"code\":403,\"message\":\"Bạn không có quyền truy cập chức năng này (Yêu cầu quyền Quản trị viên/Quản lý kho)!\"}");
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        // 1. Cho phép truy cập tài liệu Swagger UI & OpenAPI
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()
                        // 2. Cho phép các API công khai của Xác thực & WebSocket Handshake
                        .requestMatchers(
                                "/auth/**",
                                "/ws/**"
                        ).permitAll()
                        // 3. Phân quyền Endpoint Quản trị Người dùng (User Management)
                        .requestMatchers("/users/change-password").authenticated()
                        .requestMatchers("/users/me/**").authenticated()
                        .requestMatchers("/users/**").hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        // 4. Phân quyền Báo cáo phân tích chuyên sâu
                        .requestMatchers("/reports/**").hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        // 5. Toàn bộ các API nghiệp vụ còn lại BẮT BUỘC phải có JWT Token hợp lệ
                        .anyRequest().authenticated()
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With", "X-Device-Fingerprint", "X-Device-Name", "X-Device-Type"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
