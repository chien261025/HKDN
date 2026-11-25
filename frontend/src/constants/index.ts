/**
 * Smart WMS Pro - Hằng số dùng chung toàn hệ thống (Application Constants)
 */

export const APP_CONFIG = {
  APP_NAME: 'Smart WMS Pro',
  APP_VERSION: '2.0.0',
  DEFAULT_WAREHOUSE_ID: 1,
  DEFAULT_WAREHOUSE_CODE: 'WH-01',
  API_TIMEOUT_MS: 15000,
} as const;

/** Khóa lưu trữ LocalStorage / SessionStorage */
export const STORAGE_KEYS = {
  TOKEN: 'smart_wms_token',
  SESSION: 'smart_wms_session',
  USER_INFO: 'smart_wms_user',
  THEME: 'smart_wms_theme',
  SIDEBAR_COLLAPSED: 'smart_wms_sidebar_collapsed',
} as const;

/** Danh mục Vai trò và nhãn hiển thị Tiếng Việt */
export const USER_ROLES = {
  ADMIN: 'ROLE_ADMIN',
  WAREHOUSE_MANAGER: 'ROLE_WAREHOUSE_MANAGER',
  OPERATOR: 'ROLE_OPERATOR',
} as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  ROLE_ADMIN: 'Quản trị viên',
  ROLE_WAREHOUSE_MANAGER: 'Trưởng kho',
  ROLE_MANAGER: 'Trưởng kho',
  ROLE_OPERATOR: 'Thủ kho quét mã',
};

/** Phân vùng kho chuẩn */
export const WAREHOUSE_ZONES = {
  ZONE_A: 'ZONE_A',
  ZONE_B: 'ZONE_B',
  ZONE_C: 'ZONE_C',
  ZONE_QUA: 'ZONE_QUA',
} as const;

export const WAREHOUSE_ZONE_LABELS: Record<string, string> = {
  ZONE_A: 'Khu A - Hàng Khô & Tiêu Dùng Thường',
  ZONE_B: 'Khu B - Kho Mát & Thực Phẩm (2°C - 8°C)',
  ZONE_C: 'Khu C - Hàng Giá Trị Cao & Điện Tử',
  ZONE_QUA: 'Khu Q - Khu Cách Ly & Hàng Chờ Xử Lý',
};

/** Phân trang mặc định */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

/** Trạng thái đơn nhập (Inbound Status) */
export const INBOUND_STATUSES = {
  PENDING: 'PENDING',
  RECEIVED: 'RECEIVED',
  STOCKED: 'STOCKED',
  CANCELLED: 'CANCELLED',
} as const;

/** Trạng thái đơn xuất (Outbound Status) */
export const OUTBOUND_STATUSES = {
  PENDING: 'PENDING',
  ALLOCATED: 'ALLOCATED',
  PICKING: 'PICKING',
  DISPATCHED: 'DISPATCHED',
  CANCELLED: 'CANCELLED',
} as const;
