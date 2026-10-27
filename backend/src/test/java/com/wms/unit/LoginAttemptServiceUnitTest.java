package com.wms.unit;

import com.wms.module.identity.constant.SecurityConstants;
import com.wms.module.identity.service.LoginAttemptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Unit Test: LoginAttemptService & SecurityConstants Policy")
class LoginAttemptServiceUnitTest {

    private LoginAttemptService loginAttemptService;

    @BeforeEach
    void setUp() {
        loginAttemptService = new LoginAttemptService();
        loginAttemptService.clearAllForTesting();
    }

    @Test
    @DisplayName("1-4 lần nhập sai: Chưa bị khóa, số lần thử giảm dần")
    void shouldNotBlockBeforeMaxAttempts() {
        String user = "test_operator";
        String ip = "192.168.1.50";
        String dev = "DFP_TEST_DEVICE_1";

        for (int i = 1; i < SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS; i++) {
            var res = loginAttemptService.registerFailure(user, ip, dev);
            assertFalse(res.blocked(), "Chưa chạm ngưỡng 5 lần thì không được khóa!");
            assertEquals(SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS - i, res.remainingAttempts(),
                    "Số lần còn lại phải đếm lùi chính xác");
        }
    }

    @Test
    @DisplayName("Lần nhập sai thứ 5: Khóa mức 1 (60 giây)")
    void shouldBlockAtFifthAttempt() {
        String user = "test_manager";
        String ip = "192.168.1.51";
        String dev = "DFP_TEST_DEVICE_2";

        for (int i = 1; i < SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS; i++) {
            loginAttemptService.registerFailure(user, ip, dev);
        }

        var blockedRes = loginAttemptService.registerFailure(user, ip, dev);
        assertTrue(blockedRes.blocked(), "Lần thứ 5 phải kích hoạt khóa bảo vệ!");
        assertEquals(1, blockedRes.lockLevel(), "Mức phạt đầu tiên phải là Level 1");
        assertTrue(blockedRes.remainingSeconds() > 0 && blockedRes.remainingSeconds() <= SecurityConstants.LOCKOUT_LEVEL_1_SECONDS,
                "Thời gian khóa phải xấp xỉ 60 giây");
    }

    @Test
    @DisplayName("Đăng nhập thành công: Xóa toàn bộ lịch sử sai và mở khóa")
    void shouldResetOnSuccessfulLogin() {
        String user = "test_admin";
        String ip = "192.168.1.52";
        String dev = "DFP_TEST_DEVICE_3";

        // Nhập sai 3 lần
        for (int i = 0; i < 3; i++) {
            loginAttemptService.registerFailure(user, ip, dev);
        }

        var statusBefore = loginAttemptService.checkStatus(user, ip, dev);
        assertEquals(2, statusBefore.remainingAttempts(), "Sau 3 lần sai còn 2 lần thử");

        // Đăng nhập thành công
        loginAttemptService.loginSucceeded(user, ip, dev);

        var statusAfter = loginAttemptService.checkStatus(user, ip, dev);
        assertEquals(SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS, statusAfter.remainingAttempts(),
                "Sau đăng nhập thành công phải reset về 5 lần thử");
        assertFalse(statusAfter.blocked(), "Trạng thái không được ở trạng thái khóa");
    }

    @Test
    @DisplayName("Dọn dẹp bản ghi định kỳ: Ngăn chặn rò rỉ RAM (Memory Leak Prevention)")
    void shouldCleanupExpiredRecordsWithoutError() {
        loginAttemptService.cleanupExpiredRecords();
        // Không ném Exception là thành công
        assertNotNull(loginAttemptService);
    }
}
