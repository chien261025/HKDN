import { AuthSession } from '../types';
import { authService } from '../services/authService';

const MASK_PRICE_STORAGE_KEY = 'smart_wms_force_mask_price';

/**
 * Kiểm tra xem người dùng hiện tại có quyền xem giá vốn / giá bán hay không.
 * - ROLE_OPERATOR (Nhân viên tác nghiệp kho): Luôn bị che giá vốn (trả về false).
 * - Các vai trò Quản lý / Admin / Kế toán: Được xem giá vốn, trừ khi tự bật chế độ Bảo mật hiển thị.
 */
export const canViewCostPrice = (customSession?: AuthSession | null): boolean => {
  // 1. Kiểm tra cờ cưỡng chế ẩn giá (Chế độ Trình chiếu / Bảo vệ màn hình)
  if (isPriceMaskedGlobally()) {
    return false;
  }

  // 2. Lấy phiên làm việc hiện tại
  const session = customSession !== undefined ? customSession : authService.getCurrentSession();
  if (!session) {
    return false;
  }

  // 3. Nhân viên tác nghiệp kho (ROLE_OPERATOR) không được thấy giá vốn
  if (session.role === 'ROLE_OPERATOR') {
    return false;
  }

  // 4. Các vai trò Quản lý, Giám đốc kho, Admin được phép xem giá
  return true;
};

/**
 * Kiểm tra trạng thái "Chế độ Bảo mật Giá vốn" đang lưu trong trình duyệt
 */
export const isPriceMaskedGlobally = (): boolean => {
  return localStorage.getItem(MASK_PRICE_STORAGE_KEY) === 'true';
};

/**
 * Bật / tắt chế độ Bảo mật Giá vốn (dành cho Quản lý / Admin khi muốn ẩn giá trên màn hình chung)
 */
export const setGlobalPriceMask = (masked: boolean): void => {
  if (masked) {
    localStorage.setItem(MASK_PRICE_STORAGE_KEY, 'true');
  } else {
    localStorage.removeItem(MASK_PRICE_STORAGE_KEY);
  }
  // Bắn event để các component lắng nghe và re-render tức thì
  window.dispatchEvent(new Event('smart_wms_price_mask_changed'));
};

/**
 * Format hiển thị số tiền hoặc chuỗi che dấu '***' theo quyền hạn
 */
export const formatMaskedPrice = (
  amount: number | undefined | null,
  canView: boolean,
  unit = '₫'
): string => {
  if (!canView) {
    return '***';
  }
  return `${(amount || 0).toLocaleString('vi-VN')} ${unit}`;
};

