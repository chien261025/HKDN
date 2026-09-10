package com.wms.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerOpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI smartWmsOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Smart WMS API - Hệ Thống Quản Lý Kho Thông Minh")
                        .description("Tài liệu đặc tả toàn bộ REST API cho dự án Đồ án Tốt nghiệp Smart WMS " +
                                "(Event-Driven Modular Monolith).\n\n" +
                                "Các phân hệ cốt lõi:\n" +
                                "- **Identity & RBAC:** Đăng nhập JWT phân quyền Admin, Warehouse Manager, Operator.\n" +
                                "- **Master Data:** Sơ đồ ô kệ (Location Topology) và Danh mục sản phẩm (SKU, Barcode).\n" +
                                "- **Core Inventory:** Khóa bi quan (Pessimistic Locking) chống âm kho đa luồng.\n" +
                                "- **Order Operations:** Gợi ý cất hàng (Put-away) và Xuất kho chuẩn FEFO.\n" +
                                "- **Smart Query AI:** Kiểm duyệt AST an toàn cho Text-to-SQL (JSqlParser).\n" +
                                "- **Async Reporting:** Xuất báo cáo dữ liệu lớn ngầm với RabbitMQ.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Nhóm Đồ Án Smart WMS")
                                .email("contact@smartwms.vn"))
                        .license(new License().name("Apache 2.0").url("https://springdoc.org")))
                .servers(List.of(
                        new Server().url("/api/v1").description("API Gateway / Base Path")
                ))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Nhập Access Token (JWT) theo định dạng: Bearer {token}")));
    }
}
