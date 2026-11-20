import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield, AlertTriangle, Building2, Phone, Mail, User, Loader2, Clock } from 'lucide-react';
import { UserAccount, UserRole, UpdateUserPayload } from '../types';
import { warehouseService, DEFAULT_WAREHOUSES } from '../../masterdata/services/warehouseService';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onUpdateUser: (userId: string, payload: UpdateUserPayload) => Promise<void>;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('ROLE_OPERATOR');
  const [warehouseList, setWarehouseList] = useState<{ id: number; code: string; name: string; desc: string }[]>(
    DEFAULT_WAREHOUSES.map((w) => ({
      id: Number(w.id),
      code: w.code,
      name: w.name,
      desc: w.address || w.shortName || 'Chi nhánh kho',
    }))
  );
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<number[]>([1]);
  const [primaryWarehouseId, setPrimaryWarehouseId] = useState<number>(1);
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      warehouseService
        .getWarehouses()
        .then((whs) => {
          if (whs && whs.length > 0) {
            setWarehouseList(
              whs.map((w) => ({
                id: Number(w.id),
                code: w.code,
                name: w.name,
                desc: w.address || w.shortName || 'Chi nhánh kho',
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.fullName);
      setEmail(user.email);
      setPhone(user.phone || '');
      setRole(user.role);
      setExpiresAt(user.rawExpiresAt ? user.rawExpiresAt.slice(0, 10) : '');
      setErrorMsg(null);

      // Map assigned warehouses to IDs
      if (user.assignedWarehouses && user.assignedWarehouses.length > 0) {
        const ids: number[] = [];
        user.assignedWarehouses.forEach((whName) => {
          const match = warehouseList.find((w) => whName.includes(w.name) || whName.includes(w.code) || w.name.includes(whName));
          if (match && !ids.includes(match.id)) ids.push(match.id);
        });
        setSelectedWarehouseIds(ids.length > 0 ? ids : (warehouseList[0] ? [warehouseList[0].id] : [1]));

        const primaryMatch = warehouseList.find((w) =>
          user.primaryWarehouse ? user.primaryWarehouse.includes(w.name) : false
        );
        setPrimaryWarehouseId(primaryMatch ? primaryMatch.id : (ids[0] || (warehouseList[0] ? warehouseList[0].id : 1)));
      } else {
        const defaultId = warehouseList[0] ? warehouseList[0].id : 1;
        setSelectedWarehouseIds([defaultId]);
        setPrimaryWarehouseId(defaultId);
      }
    }
  }, [user, isOpen, warehouseList]);

  if (!isOpen || !user) return null;

  const isRootAdmin = user.username.toLowerCase() === 'admin';

  const toggleWarehouse = (id: number) => {
    let next: number[];
    if (selectedWarehouseIds.includes(id)) {
      if (selectedWarehouseIds.length === 1) return; // Luôn giữ ít nhất 1 kho
      next = selectedWarehouseIds.filter((wId) => wId !== id);
      if (primaryWarehouseId === id) {
        setPrimaryWarehouseId(next[0]);
      }
    } else {
      next = [...selectedWarehouseIds, id];
    }
    setSelectedWarehouseIds(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Họ tên và Email không được để trống!');
      return;
    }

    if (selectedWarehouseIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một kho hàng phân quyền truy cập!');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const primaryWh = warehouseList.find((w) => w.id === primaryWarehouseId)?.name || (primaryWarehouseId ? `Kho #${primaryWarehouseId}` : 'Chưa gán kho');

      await onUpdateUser(user.id, {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role: isRootAdmin ? 'ROLE_ADMIN' : role,
        assignedWarehouse: primaryWh,
        assignedWarehouseIds: selectedWarehouseIds,
        primaryWarehouseId: primaryWarehouseId,
        expiresAt: isRootAdmin ? null : (expiresAt ? new Date(expiresAt + 'T23:59:59Z').toISOString() : null),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi cập nhật thông tin người dùng!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Chỉnh Sửa Thông Tin, Vai Trò & Phân Quyền Kho
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Tài khoản: @{user.username} (ID #{user.id})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              <span>Họ Và Tên:</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên đầy đủ..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>Email Liên Hệ:</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@smartwms.vn"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>Số Điện Thoại:</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-mono"
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Vai Trò Hệ Thống:</span>
              </span>
              {isRootAdmin && (
                <span className="text-2xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Quản Trị Viên Gốc
                </span>
              )}
            </label>
            <select
              value={role}
              disabled={isRootAdmin}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium disabled:bg-slate-100 cursor-pointer"
            >
              <option value="ROLE_OPERATOR">Thủ kho (Vận hành thực địa PDA)</option>
              <option value="ROLE_WAREHOUSE_MANAGER">Quản lý trưởng kho (Điều hành chi nhánh)</option>
              <option value="ROLE_ADMIN">Quản trị viên (Toàn quyền hệ thống)</option>
            </select>
          </div>

          {/* Multi-Warehouse Access Selector */}
          <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-slate-800 font-bold flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Phân Quyền Chi Nhánh Kho Hàng:</span>
              </label>
              <span className="text-2xs text-slate-500 font-medium">
                Đã chọn <span className="font-bold text-indigo-600">{selectedWarehouseIds.length}</span> kho
              </span>
            </div>

            <div className="space-y-1.5">
              {warehouseList.map((wh) => {
                const isChecked = selectedWarehouseIds.includes(wh.id);
                const isPrimary = primaryWarehouseId === wh.id;

                return (
                  <div
                    key={wh.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                      isChecked ? 'bg-white border-indigo-200 shadow-2xs' : 'bg-slate-100/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleWarehouse(wh.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                          <span>{wh.name}</span>
                          <span className="font-mono text-2xs text-slate-400">({wh.code})</span>
                        </div>
                        <div className="text-2xs text-slate-500">{wh.desc}</div>
                      </div>
                    </label>

                    {isChecked && (
                      <button
                        type="button"
                        onClick={() => setPrimaryWarehouseId(wh.id)}
                        className={`px-2 py-0.5 rounded-lg text-2xs font-semibold border transition-all cursor-pointer ${
                          isPrimary
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                        }`}
                      >
                        {isPrimary ? 'Kho Mặc Định' : 'Đặt Mặc Định'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expiry Date */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Ngày Hết Hạn Tài Khoản:</span>
              </label>
              {isRootAdmin ? (
                <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Vĩnh viễn
                </span>
              ) : expiresAt ? (
                <button
                  type="button"
                  onClick={() => setExpiresAt('')}
                  className="text-2xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Không đặt hạn
                </button>
              ) : null}
            </div>
            {isRootAdmin ? (
              <input
                type="text"
                disabled
                value="Vĩnh viễn (Tài khoản Quản trị viên tối cao)"
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl font-medium text-xs cursor-not-allowed select-none"
              />
            ) : (
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-mono text-xs cursor-pointer"
              />
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
