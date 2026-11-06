-- Tạo tài khoản quản trị bổ sung: admin1 / 1234567
INSERT INTO wms_user (id, username, password_hash, full_name, email, is_active, must_change_password)
VALUES (
    4,
    'admin1',
    '$2a$10$7u/yAooOdTN402Jt3wVmeu8akcAsGmIZCMVy4URmUdwablnBEVKYy',
    'Quản trị viên 1',
    'admin1@smartwms.vn',
    TRUE,
    FALSE
)
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    full_name = VALUES(full_name),
    email = VALUES(email),
    is_active = VALUES(is_active),
    must_change_password = VALUES(must_change_password);

INSERT INTO wms_user_role (user_id, role_id)
SELECT u.id, r.id
FROM wms_user u
JOIN wms_role r ON r.name = 'ROLE_ADMIN'
WHERE u.username = 'admin1'
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), role_id = VALUES(role_id);
