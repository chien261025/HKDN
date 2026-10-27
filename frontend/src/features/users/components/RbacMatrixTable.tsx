import React, { useState } from 'react';
import { Check, X, Shield, Smartphone, Monitor, Lock, Info, CheckCircle2 } from 'lucide-react';
import { INITIAL_RBAC_MODULES, RbacModuleItem } from '../data/rbacModulesData';

export const RbacMatrixTable: React.FC = () => {
  const [modules, setModules] = useState<RbacModuleItem[]>(INITIAL_RBAC_MODULES);
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
      {/* Table Header Info */}
      <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Bảng Tổng Hợp Phân Quyền Màn Hình & Thiết Bị (RBAC Matrix)
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
              12 MÀN HÌNH
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Phân định ranh giới chức năng giữa nhân viên quản lý (Admin, Manager) và thủ kho thực địa (Operator PDA)
          </p>
        </div>

        {saveToast && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold animate-fade-in shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã đồng bộ thay đổi RBAC!</span>
          </div>
        )}
      </div>

      {/* Mobile Card Feed (< md) */}
      <div className="block md:hidden p-3 space-y-3 bg-slate-50/70">
        {modules.map((m) => (
          <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-slate-900 text-sm">{m.moduleName}</div>
                <div className="font-mono text-xs text-indigo-600 mt-0.5">{m.desktopRoute}</div>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                {m.device}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">{m.description}</p>

            {/* Permission Toggles */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-xs">
              {/* Admin */}
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-center">
                <div className="text-[10px] text-slate-400 font-mono font-semibold">ADMIN</div>
                <div className="mt-1 flex justify-center">
                  {m.adminAllowed ? (
                    <span className="p-1 rounded-md bg-purple-100 text-purple-700"><Check className="w-3.5 h-3.5" /></span>
                  ) : (
                    <span className="p-1 rounded-md bg-slate-200 text-slate-400"><X className="w-3.5 h-3.5" /></span>
                  )}
                </div>
              </div>

              {/* Manager */}
              <button
                type="button"
                onClick={() => togglePermission(m.id, 'managerAllowed')}
                className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                  m.managerAllowed
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-mono font-semibold">MANAGER</div>
                <div className="mt-1 flex justify-center">
                  {m.managerAllowed ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <X className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* Operator */}
              <button
                type="button"
                onClick={() => togglePermission(m.id, 'operatorAllowed')}
                className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                  m.operatorAllowed
                    ? 'bg-cyan-50 border-cyan-200 text-cyan-700'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-mono font-semibold">OPERATOR</div>
                <div className="mt-1 flex justify-center">
                  {m.operatorAllowed ? <Check className="w-3.5 h-3.5 text-cyan-600" /> : <X className="w-3.5 h-3.5" />}
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
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
          <tbody className="divide-y divide-slate-100 font-sans">
            {modules.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">{m.id}</td>

                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900 text-sm">{m.moduleName}</div>
                  <div className="font-mono text-xs text-indigo-600 mt-0.5">{m.desktopRoute}</div>
                </td>

                <td className="py-3 px-4 text-center">
                  {m.adminAllowed ? (
                    <span className="inline-flex p-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200" title="Admin toàn quyền">
                      <Check className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="inline-flex p-1 rounded-md bg-slate-100 text-slate-400">
                      <X className="w-4 h-4" />
                    </span>
                  )}
                </td>

                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => togglePermission(m.id, 'managerAllowed')}
                    className={`inline-flex p-1 rounded-md border transition-colors cursor-pointer ${
                      m.managerAllowed
                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {m.managerAllowed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                </td>

                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => togglePermission(m.id, 'operatorAllowed')}
                    className={`inline-flex p-1 rounded-md border transition-colors cursor-pointer ${
                      m.operatorAllowed
                        ? 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {m.operatorAllowed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                </td>

                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {m.device.includes('Mobile') ? <Smartphone className="w-3 h-3 text-cyan-600" /> : <Monitor className="w-3 h-3 text-slate-500" />}
                    <span>{m.device}</span>
                  </span>
                </td>

                <td className="py-3 px-4 text-xs text-slate-500 leading-relaxed max-w-xs">{m.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
