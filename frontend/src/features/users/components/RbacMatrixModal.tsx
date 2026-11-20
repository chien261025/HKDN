import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Check, Search, Save, RotateCcw, AlertCircle, CheckCircle2, Lock, Info, Loader2 } from 'lucide-react';
import { RbacMatrixItem } from '../types';
import { userService } from '../services/userService';

interface RbacMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RbacMatrixModal: React.FC<RbacMatrixModalProps> = ({ isOpen, onClose }) => {
  const [matrix, setMatrix] = useState<RbacMatrixItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadMatrix = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await userService.getRbacMatrix();
      setMatrix(data);
    } catch (err: any) {
      console.error('Lỗi tải RBAC matrix:', err);
      setFeedback({ type: 'error', message: err.message || 'Không thể tải ma trận phân quyền!' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMatrix();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePermission = (permissionCode: string, role: 'manager' | 'operator') => {
    setMatrix((prev) =>
      prev.map((item) => {
        if (item.code !== permissionCode) return item;
        if (role === 'manager') {
          return { ...item, managerAllowed: !item.managerAllowed };
        } else {
          return { ...item, operatorAllowed: !item.operatorAllowed };
        }
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const managerCodes = matrix.filter((m) => m.managerAllowed).map((m) => m.code);
      const operatorCodes = matrix.filter((m) => m.operatorAllowed).map((m) => m.code);

      await userService.updateRbacMatrix('ROLE_WAREHOUSE_MANAGER', managerCodes);
      await userService.updateRbacMatrix('ROLE_OPERATOR', operatorCodes);

      setFeedback({ type: 'success', message: 'Đã lưu cấu hình ma trận phân quyền thành công!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error('Lỗi lưu ma trận quyền:', err);
      setFeedback({ type: 'error', message: err.message || 'Không thể lưu thay đổi phân quyền!' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    loadMatrix();
  };

  const modules = ['ALL', ...Array.from(new Set(matrix.map((m) => m.module)))];

  const filteredMatrix = matrix.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === 'ALL' || item.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  const getModuleBadge = (mod: string) => {
    switch (mod) {
      case 'INBOUND':
        return <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Nhập Kho (PO)</span>;
      case 'OUTBOUND':
        return <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Xuất Kho (SO)</span>;
      case 'INVENTORY':
        return <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Tồn Kho & Sổ Cái</span>;
      case 'AUDIT':
        return <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Kiểm Kê Kho</span>;
      case 'REPORT':
        return <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-sky-50 text-sky-700 border border-sky-200">Báo Cáo KPI</span>;
      case 'IDENTITY':
        return <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Tài Khoản & An Ninh</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-2xs font-medium bg-slate-100 text-slate-700">{mod}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>Ma Trận Phân Quyền Chi Tiết (Role-Based Access Control)</span>
                <span className="px-2 py-0.5 text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  Enterprise Security Matrix
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Kiểm soát quyền hạn theo từng vai trò theo nguyên tắc quyền tối thiểu (Least Privilege)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 shrink-0">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên quyền, mã quyền hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Lọc phân hệ:</span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m === 'ALL' ? 'Tất cả phân hệ' : m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> Đang tải ma trận phân quyền...
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-2xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-3">Phân Hệ</th>
                  <th className="py-3 px-3">Quyền Hạn & Mã Kỹ Thuật</th>
                  <th className="py-3 px-3 text-center w-32">
                    <div className="flex items-center justify-center gap-1 text-purple-700 font-extrabold">
                      <Lock className="w-3 h-3" />
                      <span>Admin</span>
                    </div>
                    <div className="text-[10px] text-purple-500 lowercase font-normal">(toàn quyền)</div>
                  </th>
                  <th className="py-3 px-3 text-center w-36">
                    <div className="text-indigo-700 font-extrabold">Quản Lý Kho</div>
                    <div className="text-[10px] text-indigo-500 lowercase font-normal">(manager)</div>
                  </th>
                  <th className="py-3 px-3 text-center w-36">
                    <div className="text-emerald-700 font-extrabold">Thủ Kho</div>
                    <div className="text-[10px] text-emerald-500 lowercase font-normal">(operator pda)</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      Không tìm thấy quyền nào khớp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((item) => (
                    <tr key={item.permissionId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        {getModuleBadge(item.module)}
                      </td>

                      <td className="py-3 px-3 align-top">
                        <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                        <div className="font-mono text-2xs text-indigo-600 mt-0.5">{item.code}</div>
                        <div className="text-slate-500 text-2xs mt-1">{item.description}</div>
                      </td>

                      {/* Admin Column: Always enabled & locked */}
                      <td className="py-3 px-3 align-middle text-center bg-purple-50/20">
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-purple-100 text-purple-700 border border-purple-200">
                          <Check className="w-4 h-4" />
                        </div>
                      </td>

                      {/* Manager Column: Toggleable */}
                      <td className="py-3 px-3 align-middle text-center">
                        <button
                          type="button"
                          onClick={() => togglePermission(item.code, 'manager')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                            item.managerAllowed
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-400 border border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {item.managerAllowed && <Check className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Operator Column: Toggleable */}
                      <td className="py-3 px-3 align-middle text-center">
                        <button
                          type="button"
                          onClick={() => togglePermission(item.code, 'operator')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                            item.operatorAllowed
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-400 border border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {item.operatorAllowed && <Check className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Note & Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-2xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Quản trị viên (Admin) luôn giữ toàn quyền hệ thống theo nguyên tắc phòng vệ an ninh gốc.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleResetDefaults}
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Lưu Cấu Hình RBAC</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

