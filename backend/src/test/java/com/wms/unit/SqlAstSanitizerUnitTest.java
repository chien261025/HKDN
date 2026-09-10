package com.wms.unit;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.smartquery.text2sql.SqlAstSanitizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class SqlAstSanitizerUnitTest {

    private SqlAstSanitizer sanitizer;

    @BeforeEach
    void setUp() {
        sanitizer = new SqlAstSanitizer();
    }

    @Test
    @DisplayName("Cho phep cau SELECT hop le va tu dong chen LIMIT 50")
    void testSanitize_EnforcesLimit50() {
        String rawSql = "SELECT sku, product_name, available_qty FROM v_stock_summary WHERE available_qty > 0";
        String cleanSql = sanitizer.sanitizeAndEnforceLimit(rawSql);

        assertNotNull(cleanSql);
        assertTrue(cleanSql.toUpperCase().contains("LIMIT 50"), "Cau SQL phai duoc tu dong ep them LIMIT 50");
        assertTrue(cleanSql.contains("v_stock_summary"));
    }

    @Test
    @DisplayName("Giu nguyen LIMIT neu nguoi dung / AI da co LIMIT nho hon")
    void testSanitize_PreservesExistingLimit() {
        String rawSql = "SELECT * FROM v_expiring_batches LIMIT 10";
        String cleanSql = sanitizer.sanitizeAndEnforceLimit(rawSql);

        assertNotNull(cleanSql);
        assertTrue(cleanSql.toUpperCase().contains("LIMIT 10"));
        assertFalse(cleanSql.toUpperCase().contains("LIMIT 50"));
    }

    @Test
    @DisplayName("Chan dung lenh DROP TABLE va nem loi FORBIDDEN")
    void testSanitize_BlocksDropTable() {
        String rawSql = "DROP TABLE wms_inventory;";
        BusinessException ex = assertThrows(BusinessException.class, () ->
                sanitizer.sanitizeAndEnforceLimit(rawSql));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Chan dung lenh DELETE va nem loi FORBIDDEN")
    void testSanitize_BlocksDelete() {
        String rawSql = "DELETE FROM wms_user WHERE id = 1";
        BusinessException ex = assertThrows(BusinessException.class, () ->
                sanitizer.sanitizeAndEnforceLimit(rawSql));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Chan dung lenh UPDATE va nem loi FORBIDDEN")
    void testSanitize_BlocksUpdate() {
        String rawSql = "UPDATE wms_inventory SET on_hand_qty = 99999 WHERE id = 1";
        BusinessException ex = assertThrows(BusinessException.class, () ->
                sanitizer.sanitizeAndEnforceLimit(rawSql));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Chan dung lenh INSERT va nem loi FORBIDDEN")
    void testSanitize_BlocksInsert() {
        String rawSql = "INSERT INTO wms_role (id, name) VALUES (99, 'ROLE_HACK')";
        BusinessException ex = assertThrows(BusinessException.class, () ->
                sanitizer.sanitizeAndEnforceLimit(rawSql));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Nem loi BAD_REQUEST khi cau SQL rong hoac null")
    void testSanitize_ThrowsOnEmpty() {
        BusinessException ex1 = assertThrows(BusinessException.class, () ->
                sanitizer.sanitizeAndEnforceLimit(""));
        assertEquals(ErrorCode.BAD_REQUEST, ex1.getErrorCode());

        BusinessException ex2 = assertThrows(BusinessException.class, () ->
                sanitizer.sanitizeAndEnforceLimit(null));
        assertEquals(ErrorCode.BAD_REQUEST, ex2.getErrorCode());
    }

    @Test
    @DisplayName("Nem loi BAD_REQUEST khi cu phap SQL khong hop le")
    void testSanitize_ThrowsOnSyntaxError() {
        String invalidSql = "SELECT FROM WHERE UNKNOWN SYNTAX *#&$";
        BusinessException ex = assertThrows(BusinessException.class, () ->
                sanitizer.sanitizeAndEnforceLimit(invalidSql));

        assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
    }
}
