# SMART WMS - Hệ Thống Quản Lý Kho Thông Minh Chuẩn Doanh Nghiệp

> **Đồ án Tốt nghiệp / Graduation Thesis:** Hệ Thống Quản Lý Kho Hàng Tích Hợp AI & Xử Lý Sự Kiện Bất Đồng Bộ  
> **Kiến trúc chủ đạo:** Event-Driven Modular Monolith (Spring Boot 3.3.3 + React 18 TypeScript + PostgreSQL 16 + RabbitMQ + MinIO)  
> **Mã nguồn GitHub:** [https://github.com/chien261025/HKDN](https://github.com/chien261025/HKDN)

---

## 1. CHU TRÌNH NGHIỆP VỤ LOGISTICS KHÉP KÍN (END-TO-END FULFILLMENT LIFECYCLE)

Khác biệt với các hệ thống đồ án chỉ tập trung vào CRUD cơ bản, **Smart WMS** hiện thực hóa trọn vẹn **Chu trình Quản lý Kho & Chuỗi cung ứng 9 bước khép kín** theo chuẩn quốc tế (từ lúc đặt mua hàng từ nhà cung ứng cho đến khi hàng giao tận tay khách hàng cuối):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CHẶNG 1: ĐẦU VÀO (INBOUND STREAM)                      │
│   [1. Purchase Order]  ──►  [2. Receiving & QC]  ──►  [3. Putaway Task]  ──►  [4. Inventory]   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                             CHẶNG 2: ĐẦU RA TRONG KHO (OUTBOUND STREAM)                │
│      [4. Inventory]    ──►  [5. Stock Allocation] ──► [6. FEFO Picking]                │
│                                                            │                           │
│      [8. Shipping]     ◄──  [7. Packing & QC]     ◄────────┘                           │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                             CHẶNG 3: GIAO VẬN NGOÀI KHO (LAST-MILE LOGISTICS)          │
│                                   [9. Delivery]                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Bảng Ánh Xạ 9 Bước Nghiệp Vụ Với Cơ Sở Dữ Liệu & Mã Nguồn

| Bước | Tên Nghiệp Vụ | Ý Nghĩa Thực Tế Ngoài Kho | Bảng CSDL (PostgreSQL) | Thành Phần Mã Nguồn (Java / Spring Boot) |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Purchase Order (PO)** | Đơn đặt mua hàng gửi Nhà cung cấp. Xác định số lượng dự kiến (`expected_qty`) và dung sai vượt giao cho phép. | `wms_inbound_order`<br>`wms_inbound_order_item` | `InboundOrder.java`<br>`InboundOrderItem.java` |
| **2** | **Receiving & QC** | Hàng về cửa nhận (Dock). Nhân viên quét mã kiểm đếm, ghi nhận số lượng đạt chuẩn (`accepted_qty`), số lỗi (`rejected_qty`), và sinh Lô hàng (Batch/HSD). | `wms_receipt`<br>`wms_receipt_item`<br>`wms_product_batch` | `Receipt.java`<br>`ReceiptItem.java`<br>`ProductBatch.java` |
| **3** | **Putaway Task** | Điều phối cất hàng: Putaway Engine phân tích Zone nhiệt độ và tải trọng kệ (`max_weight_kg`), ưu tiên hàng nặng (>100kg) vào tầng trệt `S01`. | `wms_putaway_task` | `PutawayTask.java`<br>`InboundService.suggestOptimalPutAwayLocation` |
| **4** | **Inventory Storage** | Hàng được lưu trữ an toàn trên ô kệ. Quản lý bất biến: `on_hand_qty >= reserved_qty`, cột tự sinh `available_qty = on_hand_qty - reserved_qty`. | `wms_inventory`<br>`wms_stock_ledger` | `Inventory.java`<br>`StockLedger.java` |
| **5** | **Stock Allocation** | Khách đặt đơn (Sales Order). Kích hoạt **Khóa bi quan (`SELECT FOR UPDATE`)** để "đặt gạch" giữ chỗ, chống 100% việc bán trùng (Overselling). | `wms_stock_reservation` | `StockReservation.java`<br>`InventoryLockService.reserveStock` |
| **6** | **FEFO Picking** | Lấy hàng: Thuật toán quét Lô cận date nhất xuất trước (FEFO) và tối ưu hóa lộ trình di chuyển (Aisle $\rightarrow$ Rack $\rightarrow$ Shelf) giúp thủ kho không đi vòng vèo. | `wms_pick_allocation` | `PickAllocation.java`<br>`OutboundService.generateFefoPickList` |
| **7** | **Packing & QC** | Hàng về bàn đóng gói: Quét barcode kiểm tra từng món, đóng thùng carton, dán băng dính niêm phong và in tem vận chuyển (`tracking_number`, `weight_kg`). | `wms_package`<br>`wms_package_item` | `OrderPackage.java`<br>`PackageItem.java` |
| **8** | **Shipping** | Hàng rời khỏi ranh giới kho: Bàn giao xe tải (GHTK, Viettel Post...). **Hành động dữ liệu:** Trừ tồn thực tế (`on_hand -= qty`), giải phóng giữ chỗ, chốt Sổ cái Thẻ kho. | `wms_shipment`<br>`wms_stock_ledger` | `Shipment.java`<br>`StockLedger.java` (`OUTBOUND`) |
| **9** | **Delivery** | Giao hàng chặng cuối (Last-mile): Shipper giao tận tay người nhận, khách hàng kiểm tra và ký nhận thành công (`status = 'DELIVERED'`). | `wms_shipment.status` | `ShipmentRepository.java` |

> 💡 **Điểm mấu chốt khi bảo vệ đồ án:**
> - **WMS kết thúc tại SHIPPING:** Khi hàng hóa đã đóng gói và rời cửa kho, WMS thực hiện trừ tồn kho vật lý và ghi nhận bút toán bất biến vào Sổ cái.
> - **DELIVERY thuộc về Last-Mile / TMS (Transportation Management):** WMS kết nối trạng thái với đơn vị vận chuyển để cập nhật ngày giờ khách nhận hàng hoàn tất.

---

## 2. CÁC PHÂN HỆ VỆ TINH & NỀN TẢNG KIẾN TRÚC

Bên cạnh luồng chính, hệ thống sở hữu các phân hệ song song giải quyết trọn vẹn bài toán vận hành kho:

```
                          ┌────────────────────────┐
                          │   CORE WMS PLATFORM    │
                          └───────────┬────────────┘
                                      │
     ┌──────────────────┬─────────────┼─────────────┬──────────────────┐
     ▼                  ▼             ▼             ▼                  ▼
[Sổ Cái Thẻ Kho]   [Điều Chuyển]  [Kiểm Kê Kho]  [Phân Quyền RBAC]  [Outbox Pattern]
- Bất biến 100%    - Chuyển ô/kệ  - Đếm mù       - User-Role-Perm   - Gửi RabbitMQ
- Append-Only      - Check ranh   - Phiếu Cân    - 100% đa vai trò  - Xử lý bất đồng
- Đối soát balance   giới kho       chỉnh (ADJ)    chuẩn Enterprise   bộ Excel nặng
```

1. **Sổ Cái Thẻ Kho Bất Biến (`wms_stock_ledger`):**
   - Trigger CSDL chặn tuyệt đối `UPDATE` và `DELETE`. Mọi điều chỉnh đều phải ghi bút toán mới.
   - Bắt buộc thứ tự giao dịch: `UPDATE wms_inventory` trước $\rightarrow$ `INSERT wms_stock_ledger` sau.
2. **Điều Chuyển Vị Trí Kho (`wms_stock_transfer`):**
   - Hỗ trợ di dời hàng hóa giữa các ô kệ để cân bằng tải trọng hoặc dọn kho.
   - Trigger `trg_wms_stock_transfer_warehouse_check` tự động ngăn chặn điều chuyển nhầm kho.
3. **Kiểm Kê Định Kỳ & Cân Chỉnh Tồn (`wms_inventory_audit` & `wms_stock_adjustment`):**
   - Kỹ thuật kiểm kê mù (Blind Count): Giấu số dư hệ thống khi đếm thực tế.
   - Tự động tính chênh lệch `difference_qty = counted_qty - system_qty`.
   - Lập phiếu điều chỉnh `wms_stock_adjustment` trình Trưởng kho phê duyệt để cập nhật lại tồn thực tế.
4. **Bảo Mật & Phân Quyền Đa Vai Trò (RBAC):**
   - Chuẩn hóa 100% mô hình: `wms_user` $\leftrightarrow$ `wms_user_role` $\leftrightarrow$ `wms_role` $\leftrightarrow$ `wms_role_permission` $\leftrightarrow$ `wms_permission`.
5. **Transactional Outbox & RabbitMQ Worker:**
   - Đảm bảo tính nhất quán dữ liệu (Reliable Event Delivery) khi tích hợp Message Queue.
   - Background Worker kết xuất báo cáo Excel streaming (SXSSFWorkbook) và lưu trữ MinIO S3 mà không làm treo Web API.

---

## 3. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
smart-wms/
├── .github/workflows/               # CI/CD pipeline tự động build và test
├── docker/
│   ├── postgres/init/
│   │   ├── 01-init-schema.sql       # DDL 34 bảng & Trigger toàn vẹn dữ liệu
│   │   ├── 02-create-views.sql      # Views tổng hợp tồn kho & cảnh báo date
│   │   ├── 03-create-readonly-ai.sql# User cấp quyền an toàn cho trợ lý AI
│   │   └── 04-seed-demo-data.sql    # Dữ liệu thực nghiệm phong phú
│   └── rabbitmq/definitions.json    # Khởi tạo Queues & Exchanges
├── backend/                         # Spring Boot 3.3.3 (Java 17 Modular Monolith)
│   ├── src/main/java/com/wms/
│   │   ├── common/                  # Outbox entity, Security, Exceptions, ApiResponse
│   │   ├── module/identity/         # Phân hệ Xác thực & Phân quyền RBAC
│   │   ├── module/masterdata/       # Phân hệ Kho, Vị trí kệ, Đối tác & Hàng hóa
│   │   ├── module/inventory/        # Lõi Tồn kho, Khóa bi quan, FEFO, Sổ cái, Kiểm kê
│   │   ├── module/order/            # Quản lý PO, SO, Receipt, Putaway, Packing, Shipment
│   │   ├── module/reporting/        # RabbitMQ Producer/Consumer, Excel Streaming Worker
│   │   └── module/smartquery/       # Trợ lý AI Safe Text-to-SQL với bộ lọc AST
│   └── src/main/resources/db/migration/ # Flyway migrations (V1, V2)
├── frontend/                        # React 18 + TypeScript + Vite + Tailwind CSS
├── docker-compose.yml               # Cụm 5 services: Postgres, RabbitMQ, MinIO, App, Web
├── LUONG_DU_LIEU_VA_QUY_TAC_NGHIEP_VU.md # Cẩm nang luồng dữ liệu & bất biến nghiệp vụ
├── SMART_WMS_ARCHITECTURE.md        # Tài liệu đặc tả kiến trúc chi tiết (Sequence Flows)
└── HUONG_DAN_CHI_TIET_TUNG_GIAI_DOAN.md # Hướng dẫn phân chia công việc nhóm 2 người
```

---

## 4. HƯỚNG DẪN KHỞI CHẠY (QUICK START)

### 4.1. Khởi động toàn bộ hệ thống bằng Docker
Từ thư mục gốc dự án:
```bash
docker compose up -d
```

### 4.2. Các địa chỉ dịch vụ
- **Giao diện Web Kho (Frontend):** [http://localhost:3000](http://localhost:3000)
- **Tài liệu REST API (Swagger UI):** [http://localhost:8080/api/v1/swagger-ui/index.html](http://localhost:8080/api/v1/swagger-ui/index.html)
- **RabbitMQ Management Dashboard:** [http://localhost:15672](http://localhost:15672) (`guest` / `guest`)
- **MinIO Object Storage Console:** [http://localhost:9001](http://localhost:9001) (`minioadmin` / `minioadmin`)
- **PostgreSQL Database:** `localhost:5432` (`wms_db` / `postgres` / `password123`)

### 4.3. Tài khoản demo có sẵn
| Tài khoản | Mật khẩu | Vai trò (Role) | Chức năng chính |
| :--- | :--- | :--- | :--- |
| `admin` | `123456` | `ROLE_ADMIN` | Quản trị toàn quyền hệ thống |
| `manager01` | `123456` | `ROLE_WAREHOUSE_MANAGER` | Duyệt đơn PO/SO, duyệt phiếu Kiểm kê/Điều chỉnh |
| `operator01` | `123456` | `ROLE_OPERATOR` | Tiếp nhận hàng, cất kệ, nhặt hàng FEFO, đóng gói |

---

## 5. CHẠY KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

Chạy kiểm thử toàn diện trên môi trường Docker chuẩn:
```bash
docker run --rm --network smart-wms_wms-net \
  -v "wms-m2-cache:/root/.m2" \
  -v "d:/Project-Tot-Nghiep/smart-wms/backend:/app" \
  -w /app maven:3.9-eclipse-temurin-17-alpine mvn test
```

- **Kiểm thử Concurrency 20 luồng đồng thời:** Chứng minh Khóa bi quan (`SELECT FOR UPDATE`) ngăn chặn 100% âm kho trên PostgreSQL thật.
- **Kiểm thử thuật toán Put-away:** Tự động ưu tiên tầng trệt `S01` cho hàng nặng > 100kg.
- **Kiểm thử giải thuật FEFO:** Sắp xếp danh sách nhặt hàng theo ngày hết hạn gần nhất.
- **Kiểm thử an toàn AI Smart Query:** JSqlParser chặn đứng SQL Injection và câu lệnh độc hại (DROP, DELETE, UPDATE).

---

## 6. TÀI LIỆU BỔ TRỢ HỮU ÍCH
- [LUONG_DU_LIEU_VA_QUY_TAC_NGHIEP_VU.md](./LUONG_DU_LIEU_VA_QUY_TAC_NGHIEP_VU.md): Cẩm nang chi tiết luồng dữ liệu, máy trạng thái State Machine và 6 bất biến kỹ thuật.
- [SMART_WMS_ARCHITECTURE.md](./SMART_WMS_ARCHITECTURE.md): Sơ đồ tuần tự (Sequence Diagrams) cho từng Use Case.
- [HUONG_DAN_CHI_TIET_TUNG_GIAI_DOAN.md](./HUONG_DAN_CHI_TIET_TUNG_GIAI_DOAN.md): Lộ trình 5 giai đoạn và phân công vai trò cho nhóm 2 người.
