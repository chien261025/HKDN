import { RbacModulePermission } from '../types';

export interface RbacModuleItem extends RbacModulePermission {
  id: number;
  device: 'Desktop' | 'Mobile' | 'Desktop / Mobile';
}

export const INITIAL_RBAC_MODULES: RbacModuleItem[] = [
  {
    id: 1,
    moduleId: 'AUTH_LOGIN',
    moduleName: 'Trang Đăng Nhập (Login)',
    desktopRoute: '/login',
    adminAllowed: true,
    managerAllowed: true,
    operatorAllowed: true,
    device: 'Desktop / Mobile',
    description: 'Xác thực tài khoản JWT, cấp Token & Phân luồng vai trò',
  },
  {
    id: 2,
    moduleId: 'DASHBOARD_KPI',
    moduleName: 'Tổng Quan & Dashboard KPI',
    desktopRoute: '/',
    adminAllowed: true,
    managerAllowed: true,
    operatorAllowed: false,
    device: 'Desktop',
    description: 'KPI sức chứa ô kệ, biểu đồ nhập/xuất, Sandbox Pessimistic Lock',
  },
  {
    id: 3,
    moduleId: 'USER_RBAC',
    moduleName: 'Quản Lý Tài Khoản & Phân Quyền',
    desktopRoute: '/users',
    adminAllowed: true,
    managerAllowed: false,
    operatorAllowed: false,
    device: 'Desktop',
    description: 'Tạo tài khoản, phân quyền Role, khóa tài khoản, cấp lại mật khẩu',
  },
  {
    id: 4,
    moduleId: 'PRODUCT_SUPPLIER',
    moduleName: 'Danh Mục Sản Phẩm & Nhà Cung Cấp',
    desktopRoute: '/products',
    adminAllowed: true,
    managerAllowed: true,
    operatorAllowed: false,
    device: 'Desktop',
    description: 'Quản lý Master Data SKU, mã vạch GS1 Barcode, đối tác cung ứng',
  },
  {
    id: 5,
    moduleId: 'WAREHOUSE_LAYOUT',
    moduleName: 'Quản Lý Kho & Sơ Đồ Ô Kệ (Layout)',
    desktopRoute: '/layout',
    adminAllowed: true,
    managerAllowed: true,
    operatorAllowed: false,
    device: 'Desktop',
    description: 'Topology ô kệ 3D/2D, tọa độ Bin, in Barcode nhãn dán ô kệ',
  },
  {
    id: 6,
    moduleId: 'INBOUND_ORDERS',
    moduleName: 'Quản Lý Đơn Nhập Kho (Inbound)',
    desktopRoute: '/inbound',
    adminAllowed: true,
    managerAllowed: true,
    operatorAllowed: false,
    device: 'Desktop',
    description: 'Tạo đơn PO nhập hàng, điều phối tiếp nhận và lưu kho Putaway',
  },
  {
    id: 7,
    moduleId: 'OUTBOUND_ORDERS',
    moduleName: 'Quản Lý Đơn Xuất Kho (Outbound)',
    desktopRoute: '/outbound',
    adminAllowed: true,
    managerAllowed: true,
    operatorAllowed: false,
    device: 'Desktop',
    description: 'Tạo đơn SO xuất hàng, khóa giữ tồn FEFO, cấp lệnh Picking',
  },
  {
    id: 8,
    moduleId: 'INVENTORY_LEDGER',
    moduleName: 'Tra Cứu Tồn Kho & Sổ Cái (Ledger)',
    desktopRoute: '/inventory',
    adminAllowed: true,
    managerAllowed: true,
    operatorAllowed: false,
    device: 'Desktop',
    description: 'Sổ cái bất biến (Immutable Stock Ledger), tra cứu hạn dùng FEFO',
  },
  {
    id: 9,
    moduleId: 'AUDIT_STOCKTAKE',
    moduleName: 'Quản Lý Kiểm Kê & Cân Đối Kho',
    desktopRoute: '/audit',
    adminAllowed: true,
    managerAllowed: true,
    operatorAllowed: false,
    device: 'Desktop',
    description: 'Tạo đợt kiểm kê mù Blind Count, đối soát chênh lệch, duyệt cân đối',
  },
  {
    id: 10,
    moduleId: 'ASYNC_REPORTS',
    moduleName: 'Trung Tâm Báo Cáo & Thống Kê Kho Vận',
    desktopRoute: '/reports',
    adminAllowed: true,
    managerAllowed: true,
    operatorAllowed: false,
    device: 'Desktop',
    description: 'Trích xuất sổ cái thẻ kho, cân đối hạn dùng FEFO, đối soát xuất nhập tồn định kỳ',
  },
  {
    id: 11,
    moduleId: 'SMART_AI_ASSISTANT',
    moduleName: 'Trợ Lý Truy Vấn Kho AI (Smart Query)',
    desktopRoute: '/smartquery',
    adminAllowed: true,
    managerAllowed: true,
    operatorAllowed: false,
    device: 'Desktop / Mobile',
    description: 'Text-to-SQL AI, lá chắn bảo mật AST JSqlParser, chặn SQL Injection',
  },
  {
    id: 12,
    moduleId: 'OPERATOR_PDA_PORTAL',
    moduleName: 'Portal Vận Hành Kho (Quét Barcode)',
    desktopRoute: '/operator',
    adminAllowed: false,
    managerAllowed: false,
    operatorAllowed: true,
    device: 'Mobile',
    description: 'Thao tác thực địa Mobile/PDA: Nhận hàng Staging, Cất kho, Nhặt hàng, Kiểm kê',
  },
];

const RBAC_STORAGE_KEY = 'smart_wms_rbac_matrix';

export const getStoredRbacModules = (): RbacModuleItem[] => {
  try {
    const raw = localStorage.getItem(RBAC_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc RBAC matrix từ localStorage:', e);
  }
  return INITIAL_RBAC_MODULES;
};

export const saveStoredRbacModules = (modules: RbacModuleItem[]): void => {
  try {
    localStorage.setItem(RBAC_STORAGE_KEY, JSON.stringify(modules));
    window.dispatchEvent(new CustomEvent('smart_wms_rbac_updated', { detail: modules }));
  } catch (e) {
    console.error('Lỗi lưu RBAC matrix vào localStorage:', e);
  }
};

export const isRouteAllowedForRole = (routePath: string, role?: string): boolean => {
  if (!role) return false;
  const cleanRole = role.toUpperCase();
  if (cleanRole === 'ROLE_ADMIN' || cleanRole === 'ADMIN') {
    return true; // Admin luôn có toàn quyền
  }

  const modules = getStoredRbacModules();
  const targetModule = modules.find((m) => {
    if (m.desktopRoute === routePath) return true;
    if (routePath === '/labels' && m.desktopRoute === '/layout') return true;
    if (routePath !== '/' && m.desktopRoute !== '/' && routePath.startsWith(m.desktopRoute)) return true;
    return false;
  });

  if (!targetModule) {
    return true;
  }

  if (cleanRole.includes('MANAGER')) {
    return targetModule.managerAllowed;
  }

  if (cleanRole.includes('OPERATOR')) {
    return targetModule.operatorAllowed;
  }

  return false;
};

