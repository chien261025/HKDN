import React, { useState } from 'react';
import { Check, X, Shield, Smartphone, Monitor, Lock, Info, CheckCircle2 } from 'lucide-react';
import { RbacModulePermission } from '../types';

const INITIAL_RBAC_MODULES: (RbacModulePermission & { id: number; device: 'Desktop' | 'Mobile' | 'Desktop / Mobile' })[] = [
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
    moduleName: 'Báo Cáo & Lịch Sử Xuất File (RabbitMQ)',
    desktopRoute: '/reports',
    adminAllowed: true,
    managerAllowed: true,
    operatorAllowed: false,
    device: 'Desktop',
    description: 'Xử lý hàng đợi RabbitMQ, SXSSF RAM Guard <50MB, tải MinIO S3',
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

export const RbacMatrixTable: React.FC = () => {
  const [modules, setModules] = useState(INITIAL_RBAC_MODULES);
  const [saveToast, setSaveToast] = useState(false);

  const togglePermission = (id: number, role: 'managerAllowed' | 'operatorAllowed') => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return { ...m, [role]: !m[role] };
        }
        return m;
      })
    );
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Table Header Info */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900">
              Bảng Tổng Hợp Phân Quyền Màn Hình & Thiết Bị (RBAC Master Matrix)
            </h2>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
              12 MÀN HÌNH CHUẨN ĐỒ ÁN
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Quy định phân định ranh giới chức năng giữa nhân viên văn phòng (Admin, Manager) và thủ kho thao tác thực địa (Operator Mobile/PDA)
          </p>
        </div>

        {saveToast && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold animate-fade-in shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã tự động đồng bộ thay đổi RBAC!</span>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4 text-center w-12">STT</th>
              <th className="py-3.5 px-4">Tên Trang / Màn Hình Hệ Thống</th>
              <th className="py-3.5 px-4 text-center w-28">Admin</th>
              <th className="py-3.5 px-4 text-center w-36">Quản Lý Kho (Manager)</th>
              <th className="py-3.5 px-4 text-center w-36">Thủ Kho (Operator)</th>
              <th className="py-3.5 px-4 text-center w-40">Thiết Bị Tối Ưu</th>
              <th className="py-3.5 px-4">Mô Tả Nghiệp Vụ & Quyền Hạn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-sans">
            {modules.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                {/* STT */}
                <td className="py-3.5 px-4 text-center font-mono text-slate-500 font-bold">
                  {m.id}
                </td>

                {/* Module Name & Route */}
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900 text-sm">{m.moduleName}</div>
                  <div className="font-mono text-xs text-indigo-600 mt-0.5">
                    Route: {m.desktopRoute}
                  </div>
                </td>

                {/* Admin Role (Always Full Access) */}
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-700 border border-purple-200 shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </span>
                </td>

                {/* Manager Role */}
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => togglePermission(m.id, 'managerAllowed')}
                    title="Bấm để bật/tắt quyền Quản lý kho"
                    className="cursor-pointer transition-transform active:scale-95"
                  >
                    {m.managerAllowed ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-400 border border-slate-300">
                        <X className="w-4 h-4 stroke-[2]" />
                      </span>
                    )}
                  </button>
                </td>

                {/* Operator Role */}
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => togglePermission(m.id, 'operatorAllowed')}
                    title="Bấm để bật/tắt quyền Thủ kho PDA"
                    className="cursor-pointer transition-transform active:scale-95"
                  >
                    {m.operatorAllowed ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-400 border border-slate-300">
                        <X className="w-4 h-4 stroke-[2]" />
                      </span>
                    )}
                  </button>
                </td>

                {/* Optimal Device */}
                <td className="py-3.5 px-4 text-center">
                  {m.device === 'Mobile' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                      Mobile / PDA
                    </span>
                  ) : m.device === 'Desktop / Mobile' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Monitor className="w-3.5 h-3.5 text-indigo-600" />
                      PC & Mobile
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <Monitor className="w-3.5 h-3.5 text-slate-500" />
                      Desktop PC
                    </span>
                  )}
                </td>

                {/* Description */}
                <td className="py-3.5 px-4 text-slate-600 text-xs leading-relaxed">
                  {m.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Legend */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center gap-2">
        <Info className="w-4 h-4 text-indigo-600 flex-shrink-0" />
        <span>Bấm trực tiếp vào các biểu tượng dấu kiểm để cấp hoặc thu hồi quyền truy cập.</span>
      </div>
    </div>
  );
};
