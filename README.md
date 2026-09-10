# SMART WMS - Hệ Thống Quản Lý Kho Thông Minh

> **Kiến trúc:** Event-Driven Modular Monolith (Spring Boot 3 + React 18 TypeScript + PostgreSQL + RabbitMQ + MinIO)  
> **Tính năng nổi bật:** Kiểm soát đồng thời chống âm kho (Pessimistic Locking `SELECT FOR UPDATE`), Điều phối lấy hàng FEFO (First Expired First Out), Gợi ý cất hàng Put-away theo tải trọng, Xuất báo cáo dữ liệu lớn ngầm (RabbitMQ + SXSSFWorkbook streaming), Trợ lý AI Text-to-SQL an toàn với bộ lọc AST JSqlParser, Quét mã vạch Barcode Camera & Súng quét USB.

---

## 1. Cấu Trúc Tổng Thể Dự Án (Enterprise Standard)

```text
smart-wms/
├── .gitignore                   # Cấu hình chuẩn loại bỏ file rác, cache, build artifacts
├── docker-compose.yml           # Khởi chạy cụm 5 container: Postgres, RabbitMQ, MinIO, Backend, Frontend
├── Makefile                     # Lệnh chuẩn: make up, make down, make logs, make test
├── SMART_WMS_ARCHITECTURE.md    # Tài liệu đặc tả kiến trúc kỹ thuật chi tiết
├── HUONG_DAN_CHI_TIET_TUNG_GIAI_DOAN.md # Hướng dẫn phân chia công việc cho nhóm 2 người
├── docker/                      # Cấu hình khởi tạo Postgres, RabbitMQ definitions
├── backend/                     # Mã nguồn Spring Boot 3.3.3 (Java 17 Modular Monolith)
└── frontend/                    # Mã nguồn React 18 + Vite + Tailwind CSS (Cyber Dark Theme)
```

---

## 2. Hướng Dẫn Khởi Chạy (Chuẩn Docker)

Chỉ với 1 câu lệnh duy nhất từ thư mục gốc:
```bash
docker compose up -d
```
Hoặc dùng Makefile:
```bash
make up
```

Các địa chỉ truy cập dịch vụ:
- **Giao diện Web Kho (Frontend):** [http://localhost:3000](http://localhost:3000)
- **Tài liệu REST API (Swagger UI):** [http://localhost:8080/api/v1/swagger-ui/index.html](http://localhost:8080/api/v1/swagger-ui/index.html)
- **RabbitMQ Management Dashboard:** [http://localhost:15672](http://localhost:15672) (`guest` / `guest`)
- **MinIO Object Storage Console:** [http://localhost:9001](http://localhost:9001) (`minioadmin` / `minioadmin`)
- **PostgreSQL Database:** `localhost:5432` (`postgres` / `password123`)

---

## 3. Chạy Kiểm Thử Tự Động (19/19 Tests Passed)

Chạy lệnh kiểm thử tự động trong môi trường chuẩn Java 17:
```bash
docker run --rm --network smart-wms_wms-net -v "smart-wms_wms-m2-cache:/root/.m2" -v "%cd%/backend:/app" -w /app maven:3.9-eclipse-temurin-17-alpine mvn test
```
Hoặc dùng Makefile:
```bash
make test
```
- **Test 20 luồng đồng thời (`InventoryLockingTest`):** Kiểm chứng Pessimistic Locking chống âm kho trên PostgreSQL thật.
- **Test gợi ý vị trí cất hàng (`InboundServiceUnitTest`):** Thuật toán Put-away ưu tiên tầng trệt cho hàng nặng >100kg.
- **Test lộ trình nhặt hàng (`OutboundServiceUnitTest`):** Thuật toán FEFO tự động gom lô cận hạn dùng trước.
- **Test bảo mật AI (`SqlAstSanitizerUnitTest`):** JSqlParser chặn đứng SQL Injection phá hoại và tự động tiêm LIMIT 50.
