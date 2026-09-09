# SMART WMS - Hệ Thống Quản Lý Kho Thông Minh

> **Kiến trúc:** Event-Driven Modular Monolith (Spring Boot 3 + React 18 TypeScript)  
> **Tính năng nổi bật:** Kiểm soát đồng thời chống âm kho (Pessimistic Locking), FEFO Picking, Báo cáo ngầm với RabbitMQ + MinIO, Trợ lý AI Text-to-SQL an toàn với JSqlParser, Quét mã vạch Camera & Đầu đọc cầm tay.

---

## 1. Cấu Trúc Tổng Thể

```
smart-wms/
├── docker-compose.yml       # Khởi chạy Postgres, RabbitMQ, MinIO, Backend, Frontend
├── Makefile                 # Lệnh tắt: make up, make down, make logs
├── docker/                  # Cấu hình Nginx, Postgres Init, RabbitMQ
├── backend/                 # Java 17 / Spring Boot 3 (Modular Monolith)
└── frontend/                # React 18 + TypeScript + Vite + Tailwind CSS
```

---

## 2. Hướng Dẫn Khởi Chạy Nhanh

### Bước 1: Khởi chạy toàn bộ hạ tầng với Docker
```bash
docker-compose up -d
```
Các dịch vụ sẽ sẵn sàng tại:
- **Web App (Frontend):** http://localhost:3000
- **REST API (Backend):** http://localhost:8080/api/v1
- **Swagger API Docs:** http://localhost:8080/swagger-ui/index.html
- **RabbitMQ Management:** http://localhost:15672 (user: `guest` / pass: `guest`)
- **MinIO Console (S3):** http://localhost:9001 (user: `minioadmin` / pass: `minioadmin`)
- **PostgreSQL Database:** `localhost:5432` (db: `wms_db`, user: `postgres`, pass: `password123`)

---

## 3. Khởi Chạy Local Cho Lập Trình Viên (Dev Mode)

### Backend (Spring Boot 3):
```bash
cd backend
./mvnw spring-boot:run
```

### Frontend (React 18):
```bash
cd frontend
npm install
npm run dev
```
Truy cập giao diện tại: http://localhost:5173
