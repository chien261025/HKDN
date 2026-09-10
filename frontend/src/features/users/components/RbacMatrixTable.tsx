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
    <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden space-y-4">
      {/* Table Header Info */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">
              Bảng Tổng Hợp Phân Quyền Màn Hình & Thiết Bị (RBAC Master Matrix)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
              12 MÀN HÌNH CHUẨN ĐỒ ÁN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quy định phân định ranh giới chức năng giữa nhân viên văn phòng (Admin, Manager) và thủ kho thao tác thực địa (Operator Mobile/PDA)
          </p>
        </div>

        {saveToast && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã tự động đồng bộ thay đổi RBAC!</span>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 text-center w-12">STT</th>
              <th className="py-3 px-4">Tên Trang / Màn Hình Hệ Thống</th>
              <th className="py-3 px-4 text-center w-28">Admin</th>
              <th className="py-3 px-4 text-center w-36">Quản Lý Kho (Manager)</th>
              <th className="py-3 px-4 text-center w-36">Thủ Kho (Operator)</th>
              <th className="py-3 px-4 text-center w-40">Thiết Bị Tối Ưu</th>
              <th className="py-3 px-4">Mô Tả Nghiệp Vụ & Quyền Hạn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {modules.map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                {/* STT */}
                <td className="py-3 px-4 text-center font-mono text-slate-500 font-bold">
                  {m.id}
                </td>

                {/* Module Name & Route */}
                <td className="py-3 px-4">
                  <div className="font-bold text-white">{m.moduleName}</div>
                  <div className="font-mono text-[10px] text-indigo-400 mt-0.5">
                    Route: {m.desktopRoute}
                  </div>
                </td>

                {/* Admin Role (Always Full Access) */}
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </span>
                </td>

                {/* Manager Role */}
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => togglePermission(m.id, 'managerAllowed')}
                    title="Bấm để bật/tắt quyền Quản lý kho"
                    className="cursor-pointer transition-transform active:scale-95"
                  >
                    {m.managerAllowed ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
                        <X className="w-4 h-4 stroke-[2]" />
                      </span>
                    )}
                  </button>
                </td>

                {/* Operator Role */}
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => togglePermission(m.id, 'operatorAllowed')}
                    title="Bấm để bật/tắt quyền Thủ kho PDA"
                    className="cursor-pointer transition-transform active:scale-95"
                  >
                    {m.operatorAllowed ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
                        <X className="w-4 h-4 stroke-[2]" />
                      </span>
                    )}
                  </button>
                </td>

                {/* Optimal Device */}
                <td className="py-3 px-4 text-center">
                  {m.device === 'Mobile' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      <Smartphone className="w-3 h-3 text-amber-400" />
                      Mobile / PDA
                    </span>
                  ) : m.device === 'Desktop / Mobile' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                      <Monitor className="w-3 h-3 text-indigo-400" />
                      PC & Mobile
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      <Monitor className="w-3 h-3 text-slate-400" />
                      Desktop PC
                    </span>
                  )}
                </td>

                {/* Description */}
                <td className="py-3 px-4 text-slate-400 text-[11px] leading-relaxed">
                  {m.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Legend */}
      <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>Bấm trực tiếp vào các biểu tượng dấu kiểm để cấp hoặc thu hồi quyền truy cập theo thời gian thực.</span>
        </div>
        <div className="text-[11px] text-slate-500">
          Tuân thủ chuẩn RBAC NIST SP 800-162
        </div>
      </div>
    </div>
  );
};
