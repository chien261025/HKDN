# Smart WMS · Quản lý kho theo lô và ô kệ

Đồ án quản lý nhập, kiểm nhận, cất kệ, cấp phát FEFO (lô gần hết hạn xuất trước), xuất kho và kiểm kê. Backend là Spring Boot 3.5 / Java 25, frontend là React 18 / TypeScript, CSDL chạy bằng Docker Compose là MySQL 8.0.

## Chạy từ mã nguồn

Cần Docker và Docker Compose v2. Tại thư mục chứa `docker-compose.yml`, chạy:

```sh
docker compose up -d --build
```

Maven build JAR từ mã nguồn; Node chạy `npm ci` và build frontend trước khi Nginx phục vụ web. Không cần cài Java/Node trên máy hoặc chuẩn bị `frontend/dist`. Các biến tùy chọn cho Gemini và email nằm trong `.env.example`.

- Web: **http://localhost:3000**
- Backend: `http://localhost:8080/api/v1`
- MySQL: `localhost:3307`, database `wms_db`
- RabbitMQ Management: `http://localhost:15672`; giao diện lưu trữ tương thích MinIO: `http://localhost:9001`.

Tài khoản seed cho demo: `admin`, `manager01`, `operator01`; mật khẩu ban đầu `123456`. Dùng tài khoản quản lý để tạo PO/SO và đợt kiểm kê. Nhân viên có thể kiểm nhận và cất hàng ở cổng vận hành PDA.

### Khi đã có database demo

Volume `hkdn_wms_mysqldata` giữ dữ liệu qua các lần build. `wms-schema` chạy script [08-inbound-qc-ledger.sql](docker/mysql/init/08-inbound-qc-ledger.sql) cho cả volume cũ và mới trước khi backend khởi động; container này kết thúc với mã 0 là bình thường. Có thể xem `docker compose logs wms-schema wms-backend`.

Bản nâng cấp thêm số lượng lỗi, số đã cất và trigger chặn sửa/xóa bút toán. Với dòng `COMPLETED` từ bản cũ chưa có bộ đếm cất kệ, migration lấy lượng thực nhận làm số đã cất ban đầu. Đây là giả định chuyển đổi, không phải kết quả đo lại hàng; nếu trước đây đã cất thiếu thì đối chiếu chứng từ và sổ kho. Script không viết lại tồn vật lý hay lịch sử giao dịch.

Để sao lưu volume đang dùng (chạy khi MySQL đang hoạt động):

```sh
docker compose exec -T wms-mysql sh -c 'mysqldump --single-transaction -uroot -p"$MYSQL_ROOT_PASSWORD" --result-file=/tmp/wms_db_backup.sql wms_db'
docker compose cp wms-mysql:/tmp/wms_db_backup.sql ./wms_db_backup.sql
```

Dùng `docker compose down` để dừng. Không dùng `down -v` trên stack demo nếu cần giữ dữ liệu.

## Kịch bản bảo vệ: từ đơn đặt 100 đến tồn cuối 55

Chọn một **SKU mới chưa có tồn**, gắn nhà cung cấp, trong Kho Tổng Tân Bình. Chọn hạn dùng tương lai để lô đủ điều kiện FEFO. Có thể tải lại trang sau mỗi bước.

| Bước | Thao tác | Chờ cất | Tồn vật lý | Đang giữ | Khả dụng |
|---|---|---:|---:|---:|---:|
| 1 | Tạo PO đặt 100 | 0 | 0 | 0 | 0 |
| 2 | Nhận vào đệm: nhập thực nhận 80, lỗi 5, mã lô và hạn dùng | 75 | 0 | 0 | 0 |
| 3 | Cất 50 vào ô đang hoạt động của kho | 25 | 50 | 0 | 50 |
| 4 | Mở lại đơn, cất tiếp 25 vào cùng ô | 0 | 75 | 0 | 75 |
| 5 | Tạo SO cho đối tác của kho, cấp phát FEFO 20 | 0 | 75 | 20 | 55 |
| 6 | Xác nhận xuất 20 | 0 | **55** | **0** | **55** |

Kiểm tra chi tiết PO thấy **80 thực nhận, 5 lỗi, 75 đã cất**. Sổ cái của SKU có ba bút toán `+50`, `+25`, `−20`; số dư sau từng giao dịch tại ô/lô là `50`, `75`, `55`. Cấp phát chỉ giữ chỗ nên không có bút toán xuất ở bước 5.

- Mỗi PO được kiểm nhận một lần, đủ các dòng. Chỉ lượng đạt QC mới được cất. Đơn không có hàng đạt được đóng với trạng thái `CLOSED_NO_STOCK`.
- Mỗi lần cất áp dụng cho một dòng PO và một ô kệ. Backend kiểm tra kho, trạng thái ô, lượng còn chờ và số đã cất lần cuối mà người dùng nhìn thấy. Một yêu cầu cũ gửi lại không làm tăng tồn lần hai.
- Kiểm kê lấy số dư theo đúng kho được chọn, theo từng ô/sản phẩm/lô. Điều chỉnh tồn có chứng từ và bút toán riêng.

## Chạy kiểm thử

```sh
docker compose -f compose.test.yml up --force-recreate --abort-on-container-exit --exit-code-from tests
docker compose -f compose.test.yml down
```

Hoặc `make test` cho lệnh đầu. Stack `smart-wms-tests` có MySQL riêng trong RAM, không mở cổng và không gắn volume kho demo. Mỗi lần tạo lại container là một database mới.

- [WarehouseLifecycleTest.java](backend/src/test/java/com/wms/integration/WarehouseLifecycleTest.java): gửi payload qua Spring MVC, đối chiếu số dư/bút toán trong MySQL; bao gồm QC, cất từng phần, yêu cầu lặp, sai kho, xuất FEFO và chặn sửa/xóa sổ cái.
- [InventoryLockingTest.java](backend/src/test/java/com/wms/concurrency/InventoryLockingTest.java): 20 yêu cầu tranh giữ 10 đơn vị trên MySQL.
- Các unit test trong `backend/src/test/java/com/wms/unit` kiểm tra cấp phát, lô hết hạn, tồn theo kho, gợi ý kệ và bộ lọc truy vấn.

## Phạm vi và tài liệu

`backend/` chứa các phân hệ Spring, `frontend/src/features/` chứa màn hình theo nghiệp vụ, `docker/mysql/init/` là bộ SQL khởi tạo đang sử dụng. Bản demo xác nhận xuất tại cửa kho (`DISPATCHED`); không theo dõi giao hàng chặng cuối. Các endpoint Excel đồng bộ lấy dữ liệu nghiệp vụ; nhánh worker RabbitMQ xuất dữ liệu mẫu và chưa lưu file báo cáo vào MinIO.

Các tài liệu thiết kế dưới đây còn mô tả cả kiến trúc mục tiêu (PostgreSQL, outbox, packing, delivery); đối chiếu với luồng đã triển khai ở trên:

- [Luồng dữ liệu và quy tắc nghiệp vụ](LUONG_DU_LIEU_VA_QUY_TAC_NGHIEP_VU.md)
- [Thiết kế kiến trúc](SMART_WMS_ARCHITECTURE.md)
- [Lộ trình thực hiện đồ án](HUONG_DAN_CHI_TIET_TUNG_GIAI_DOAN.md)
