/**
 * Smart WMS Pro - Định nghĩa kiểu dữ liệu dùng chung (Common Types)
 * Phân chia chuẩn kiến trúc Module / Feature-Sliced
 */

/** Cấu trúc chuẩn phản hồi từ Backend REST API */
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp?: string;
}

/** Phân trang dữ liệu */
export interface PaginationMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isFirst?: boolean;
  isLast?: boolean;
}

export interface PaginatedResult<T> {
  content: T[];
  pagination: PaginationMeta;
}

/** Thực thể cơ bản có trường Audit */
export interface BaseEntity {
  id: number | string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | number;
  updatedBy?: string | number;
}

/** Vai trò người dùng trong hệ thống (RBAC) */
export type UserRole = 
  | 'ROLE_ADMIN' 
  | 'ROLE_WAREHOUSE_MANAGER' 
  | 'ROLE_MANAGER' 
  | 'ROLE_OPERATOR';

/** Tùy chọn lọc khoảng thời gian */
export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

/** Hướng sắp xếp dữ liệu */
export type SortDirection = 'asc' | 'desc';

export interface SortCriteria {
  field: string;
  direction: SortDirection;
}

/** Tùy chọn hiển thị trong thẻ Select / Dropdown */
export interface SelectOption<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
  badge?: string;
}

/** Kiểu biến thể màu sắc Badge dùng chung */
export type BadgeVariant = 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'purple' 
  | 'default'
  | 'secondary';

/** Trạng thái thao tác bất đồng bộ */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/** Lỗi chuẩn API */
export interface ApiError {
  status: number;
  message: string;
  errorCode?: string;
  errors?: Record<string, string>;
}
