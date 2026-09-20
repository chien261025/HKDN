-- Fix mojibake in wms_user
UPDATE wms_user SET full_name = 'Nguyễn Quản Trị' WHERE username = 'admin';
UPDATE wms_user SET full_name = 'Trần Trưởng Kho' WHERE username = 'manager01';
UPDATE wms_user SET full_name = 'Lê Thủ Kho' WHERE username = 'operator01';

-- Fix mojibake in wms_role
UPDATE wms_role SET description = 'Quản trị viên toàn hệ thống' WHERE name = 'ROLE_ADMIN';
UPDATE wms_role SET description = 'Quản lý trưởng kho' WHERE name = 'ROLE_WAREHOUSE_MANAGER';
UPDATE wms_role SET description = 'Nhân viên vận hành kho' WHERE name = 'ROLE_OPERATOR';

-- Fix mojibake in wms_permission
UPDATE wms_permission SET name = 'Xem tồn kho theo thời gian thực' WHERE code = 'INVENTORY:READ';
UPDATE wms_permission SET name = 'Điều chỉnh cân bằng tồn kho' WHERE code = 'INVENTORY:ADJUST';
UPDATE wms_permission SET name = 'Tạo đơn đặt hàng nhập/xuất' WHERE code = 'ORDER:CREATE';
UPDATE wms_permission SET name = 'Phê duyệt xuất nhập kho' WHERE code = 'ORDER:APPROVE';
UPDATE wms_permission SET name = 'Xuất báo cáo Streaming Excel dung lượng lớn' WHERE code = 'REPORT:EXPORT';
