# HƯỚNG DẪN CHI TIẾT TỪNG BƯỚC THỰC HIỆN DỰ ÁN SMART WMS
> **Đề tài:** Hệ Thống Quản Lý Kho Thông Minh (Event-Driven Modular Monolith)  
> **Dành cho:** Nhóm 2 thành viên (Bạn & Đồng đội)  
> **Mục tiêu:** Hoàn thành đồ án tốt nghiệp xuất sắc đạt điểm 9.5 - 10

---

## TỔNG QUAN LỘ TRÌNH 5 GIAI ĐOẠN

```
[GIAI ĐOẠN 1: TUẦN 1-2] ──► [GIAI ĐOẠN 2: TUẦN 3-4] ──► [GIAI ĐOẠN 3: TUẦN 5-6] ──► [GIAI ĐOẠN 4: TUẦN 7-8] ──► [GIAI ĐOẠN 5: TUẦN 9-10]
  Hạ Tầng Docker             Lõi Tồn Kho Chống Âm        Quy Trình Xuất FEFO         RabbitMQ Báo Cáo Lớn        Viết Báo Cáo Word
  Master Data Ô Kệ & SKU     Khóa Concurrency (20 Luồng) Lộ Trình Nhặt Hàng          Trợ Lý AI Safe Text-to-SQL  Slide & Video Demo
  Đăng Nhập JWT RBAC         Quét Barcode Camera / USB   Sổ Cái Bất Biến & Kiểm Kê   Gợi Ý Hành Động Thanh Lý    Tổng Duyệt Phản Biện
```

---

## GIAI ĐOẠN 1: THIẾT LẬP NỀN TẢNG, DOCKER & DỮ LIỆU SƠ ĐỒ KHO (TUẦN 1 - 2)

### 🎯 Mục tiêu giai đoạn:
Khởi chạy thành công cơ sở dữ liệu và hàng đợi qua Docker, đăng nhập phân quyền JWT thành công và hiển thị được danh sách ô kệ trên giao diện.

### 📋 Việc cụ thể của bạn và đồng đội:

#### 1. Khởi động hạ tầng Docker (Chạy 1 lần duy nhất):
Mở terminal gõ:
```bash
docker-compose up -d wms-postgres wms-rabbitmq wms-minio
```
- Truy cập PostgreSQL qua DBeaver / Navicat tại port `5432` (db: `wms_db`, user: `postgres`, pass: `password123`).
- Kiểm tra các bảng đã được Flyway tự động tạo: `wms_location`, `wms_product`, `wms_inventory`...

#### 2. Việc của Bạn 1 (Backend Lead):
- **File cần làm việc:** `backend/src/main/java/com/wms/module/identity/` và `module/masterdata/`.
- **Nhiệm vụ:**
  - Hoàn thiện API đăng nhập `POST /api/v1/auth/login` (nhận `username/password`, trả về JWT Token).
  - Hoàn thiện CRUD vị trí kệ: `GET /api/v1/masterdata/locations` (trả về danh sách ô kệ Zone A, Zone B).
  - Hoàn thiện CRUD sản phẩm: `GET /api/v1/masterdata/products` (trả về danh sách SKU và Barcode).
- **Kiểm tra:** Mở Swagger UI tại `http://localhost:8080/api/v1/swagger-ui/index.html` bấm test các API trên.

#### 3. Việc của Bạn 2 (Frontend Lead):
- **File cần làm việc:** `frontend/src/app/`, `features/auth/`, `features/masterdata/`.
- **Nhiệm vụ:**
  - Mở terminal: `cd frontend && npm run dev` để chạy web.
  - Xây dựng màn hình Đăng nhập (`LoginPage.tsx`): Nhập tài khoản `manager01/123456`, lưu token vào Zustand.
  - Xây dựng màn hình Sơ đồ kho (`LocationLayoutPage.tsx`): Vẽ các ô kệ trực quan theo từng dãy (Aisle), kệ (Rack), tầng (Shelf).
- **Kiểm tra:** Đăng nhập thành công và thấy danh sách các ô kệ hiển thị trên giao diện.

---

## GIAI ĐOẠN 2: LÕI TỒN KHO, CHỐNG ÂM KHO & QUÉT MÃ VẠCH (TUẦN 3 - 4)

### 🎯 Mục tiêu giai đoạn:
Giải quyết bài toán kỹ thuật "ăn điểm" lớn nhất: **Pessimistic Locking chống âm kho khi nhiều người cùng thao tác**, chạy pass bài test đa luồng, và tích hợp quét Barcode qua Camera để cất hàng vào kệ.

### 📋 Việc cụ thể của bạn và đồng đội:

#### 1. Việc của Bạn 1 (Backend Lead):
- **File cần làm việc:**
  - `backend/src/main/java/com/wms/module/inventory/service/InventoryLockService.java`
  - `backend/src/main/java/com/wms/module/inventory/repository/InventoryRepository.java`
  - `backend/src/test/java/com/wms/concurrency/InventoryLockingTest.java`
  - `backend/src/main/java/com/wms/module/order/service/InboundService.java`
- **Nhiệm vụ:**
  - Kiểm tra câu lệnh khóa bi quan `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`SELECT FOR UPDATE`).
  - Chạy bài kiểm thử Concurrency bằng lệnh:
    ```bash
    cd backend
    mvn test -Dtest=InventoryLockingTest
    ```
    *(Đảm bảo hiển thị `BUILD SUCCESS`, 20 luồng tranh chấp 1 mặt hàng chỉ có 10 đơn vị thành công, không bị âm kho).*
  - Hoàn thiện thuật toán gợi ý cất hàng (**Put-away Algorithm**) trong `InboundService.java` (hàng nặng tự động gợi ý vào tầng trệt `S01`).

#### 2. Việc của Bạn 2 (Frontend Lead):
- **File cần làm việc:**
  - `frontend/src/components/scanner/CameraBarcodeScanner.tsx`
  - `frontend/src/hooks/useBarcodeReader.ts`
  - `frontend/src/features/inventory/pages/InventoryBalancePage.tsx`
  - `frontend/src/features/inbound/pages/PutAwayDirectPage.tsx`
- **Nhiệm vụ:**
  - Tích hợp nút bật Camera trên giao diện để quét mã vạch sản phẩm và mã vạch ô kệ.
  - Xây dựng màn hình Hướng dẫn cất hàng (`PutAwayDirectPage`):
    - Quét mã sản phẩm $\rightarrow$ Hệ thống gợi ý ô kệ tối ưu.
    - Nhân viên mang hàng đến ô đó quét mã vạch trên kệ để xác nhận hoàn tất cất hàng.
  - Dựng bảng Tra cứu tồn kho thời gian thực (`InventoryBalancePage`): Xem tồn vật lý (`on_hand`) và tồn khả dụng (`available`).

---

## GIAI ĐOẠN 3: XUẤT HÀNG FEFO, LỘ TRÌNH NHẶT & SỔ CÁI KIỂM KÊ (TUẦN 5 - 6)

### 🎯 Mục tiêu giai đoạn:
Xây dựng quy trình xuất kho chuẩn Logistics theo chiến lược **FEFO** (First Expired, First Out - hàng hết hạn trước xuất trước), sinh lộ trình đi nhặt hàng tối ưu giữa các kệ và quy trình kiểm kê đếm mù.

### 📋 Việc cụ thể của bạn và đồng đội:

#### 1. Việc của Bạn 1 (Backend Lead):
- **File cần làm việc:**
  - `backend/src/main/java/com/wms/module/order/service/OutboundService.java`
  - `backend/src/main/java/com/wms/module/inventory/entity/StockLedger.java`
  - `backend/src/main/java/com/wms/module/inventory/service/StockAuditService.java`
- **Nhiệm vụ:**
  - Hoàn thiện thuật toán sinh Pick List theo FEFO trong `OutboundService.java`: Ưu tiên lô có `expiryDate ASC` gần nhất để giữ hàng trước.
  - Ghi vết biến động kho bất biến vào bảng `wms_stock_ledger` (ai làm, lúc nào, số lượng trước/sau).
  - Xây dựng cơ chế kiểm kê đếm mù (Blind count): Ẩn số lượng tồn máy khi tạo phiếu kiểm kê cho thủ kho đi đếm thực tế.

#### 2. Việc của Bạn 2 (Frontend Lead):
- **File cần làm việc:**
  - `frontend/src/features/outbound/pages/OutboundOrdersPage.tsx`
  - `frontend/src/features/outbound/pages/PickingProcessPage.tsx`
  - `frontend/src/features/audit/pages/StockAuditPage.tsx`
- **Nhiệm vụ:**
  - Màn hình duyệt đơn xuất: Bấm nút "Duyệt đơn & Giữ hàng" $\rightarrow$ Hệ thống sinh danh sách ô kệ cần đi lấy.
  - Màn hình Lộ trình nhặt hàng (`PickingProcessPage`): Hiển thị lộ trình bước 1 đi đến ô nào, bước 2 đến ô nào; quét mã xác nhận lấy hàng.
  - Màn hình Kiểm kê kho (`StockAuditPage`): Nhập số đếm thực tế ngoài kho $\rightarrow$ Bấm nút "Cân đối kho" tự động điều chỉnh độ lệch.

---

## GIAI ĐOẠN 4: BÁO CÁO NẶNG RABBITMQ & TRỢ LÝ AI SAFE TEXT-TO-SQL (TUẦN 7 - 8)

### 🎯 Mục tiêu giai đoạn:
Tạo 2 "vũ khí ghi điểm tuyệt đối" cho đồ án:
1. **Hàng đợi RabbitMQ:** Xuất báo cáo dữ liệu lớn ngầm không làm đơ ứng dụng.
2. **Trợ lý AI Smart Query:** Hỏi đáp số liệu kho tự nhiên, Text-to-SQL an toàn với JSqlParser và nút bấm hành động thông minh.

### 📋 Việc cụ thể của bạn và đồng đội:

#### 1. Việc của Bạn 1 (Backend Lead):
- **File cần làm việc:**
  - `backend/src/main/java/com/wms/module/reporting/mq/ReportTaskProducer.java`
  - `backend/src/main/java/com/wms/module/reporting/mq/ReportTaskConsumer.java`
  - `backend/src/main/java/com/wms/module/reporting/service/ExcelStreamingWorker.java`
  - `backend/src/main/java/com/wms/module/smartquery/text2sql/SqlAstSanitizer.java`
  - `backend/src/main/java/com/wms/module/smartquery/controller/SmartQueryController.java`
- **Nhiệm vụ:**
  - Đẩy task xuất file vào RabbitMQ; Worker dùng `SXSSFWorkbook` ghi file trực tiếp ra đĩa (giữ RAM < 50MB) và upload MinIO S3.
  - Cài đặt bộ lọc cú pháp AST `SqlAstSanitizer.java` bằng **JSqlParser**: Chặn đứng `DROP/DELETE/UPDATE`, tự động tiêm `LIMIT 50`.
  - Kết nối LLM API phân tích câu hỏi người dùng thành SQL an toàn hoặc Function Call.

#### 2. Việc của Bạn 2 (Frontend Lead):
- **File cần làm việc:**
  - `frontend/src/features/smartquery/pages/SmartAssistantPage.tsx`
  - `frontend/src/components/layout/NotificationBell.tsx`
- **Nhiệm vụ:**
  - Hoàn thiện giao diện Chatbot AI: Hỏi đáp: *"Mặt hàng nào sắp hết date trong 30 ngày tới?"*.
  - Render bảng số liệu các lô cận date trực tiếp trong khung chat.
  - Vẽ nút hành động màu cam: `[Tạo phiếu xuất thanh lý giảm giá 40%]`, người dùng bấm vào là tự động điền form xuất hàng!
  - Tích hợp chuông thông báo rung lên khi Worker xuất xong file báo cáo từ RabbitMQ kèm link tải file.

---

## GIAI ĐOẠN 5: TỔNG DUYỆT, VIẾT BÁO CÁO WORD & PHẢN BIỆN (TUẦN 9 - 10)

### 🎯 Mục tiêu giai đoạn:
Chuẩn bị đầy đủ hồ sơ khóa luận, slide thuyết trình, video demo dự phòng và luyện tập phản biện để đạt điểm 9.5 - 10.

### 📋 Việc cụ thể của bạn và đồng đội:

#### 1. Viết Báo cáo Khóa luận (File Word):
- **Bạn 1 viết:** Chương 2 (Cơ sở lý thuyết về Modular Monolith, Concurrency Locking, RabbitMQ) & Chương 3 (Thiết kế CSDL, Thuật toán Put-away, Thuật toán FEFO, Bảo mật Text-to-SQL).
- **Bạn 2 viết:** Chương 1 (Khảo sát bài toán quản lý kho) & Chương 4 (Hiện thực giao diện, hướng dẫn sử dụng, hình ảnh chụp màn hình).

#### 2. Quay Video Demo Dự Phòng (5 - 7 phút):
Quay lại video màn hình chạy mượt mà:
1. Đăng nhập $\rightarrow$ Xem sơ đồ kho.
2. Quét mã vạch cất hàng đúng ô chỉ định.
3. Xuất hàng tự động gom lô cận date theo FEFO.
4. Chạy bài test Concurrency đa luồng `InventoryLockingTest`.
5. Xuất báo cáo qua RabbitMQ và Chat với Trợ lý AI.
*(Đề phòng ngày bảo vệ hội trường bị mất mạng Internet).*

#### 3. Diễn tập trả lời 4 câu hỏi "tủ" của Hội đồng:
1. *Tại sao không dùng Microservices mà dùng Modular Monolith?*
2. *Làm sao đảm bảo kho không bị âm khi 20 người cùng bấm xuất 1 lúc?*
3. *AI sinh SQL có nguy cơ phá hỏng cơ sở dữ liệu không?*
4. *Tại sao cần RabbitMQ trong hệ thống Monolith?*
*(Xem kịch bản trả lời mẫu chi tiết trong file `SMART_WMS_ARCHITECTURE.md`).*
