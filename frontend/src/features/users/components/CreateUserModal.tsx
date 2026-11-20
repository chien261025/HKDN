import React, { useState } from 'react';
import { X, Plus, Shield, Loader2, AlertCircle, Clock, Building2, Check } from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { userService } from '../services/userService';
import { TempPasswordGenerator } from './TempPasswordGenerator';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: UserAccount) => void;
}

const WAREHOUSES_LIST = [
  { id: 1, code: 'WH01', name: 'Kho Tổng Tân Bình - TP.HCM', desc: 'Trụ sở chính (Zone A, B, Cold)' },
  { id: 2, code: 'WH02', name: 'Kho Phân Phối VSIP Bắc Ninh', desc: 'Hub miền Bắc' },
  { id: 3, code: 'WH03', name: 'Kho Vận Miền Trung - Đà Nẵng', desc: 'Hub miền Trung' },
  { id: 4, code: 'WH04', name: 'Kho Trung Chuyển Sóng Thần - Bình Dương', desc: 'Kho chuyển tiếp & Cross-dock' },
];

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onAddUser,
}) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('ROLE_OPERATOR');
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<number[]>([1]);
  const [primaryWarehouseId, setPrimaryWarehouseId] = useState<number>(1);
  const [expiresAt, setExpiresAt] = useState('');
  const [tempPassword, setTempPassword] = useState('123456');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setUsername('');
    setFullName('');
    setEmail('');
    setPhone('');
    setRole('ROLE_OPERATOR');
    setSelectedWarehouseIds([1]);
    setPrimaryWarehouseId(1);
    setExpiresAt('');
    setTempPassword('123456');
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
    if (!username.trim() || !fullName.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ Tên đăng nhập và Họ tên!');
      return;
    }

    if (selectedWarehouseIds.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một kho hàng phân quyền truy cập!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const createdUser = await userService.createUser({
        username: username.trim().toLowerCase(),
        password: tempPassword || '123456',
        fullName: fullName.trim(),
        email: email.trim() || `${username.trim().toLowerCase()}@smartwms.vn`,
        role: role,
        assignedWarehouseIds: selectedWarehouseIds,
        primaryWarehouseId: primaryWarehouseId,
        expiresAt: expiresAt ? new Date(expiresAt + 'T23:59:59Z').toISOString() : undefined,
      });

      if (phone.trim()) {
        createdUser.phone = phone.trim();
      }

      onAddUser(createdUser);
      handleClose();
    } catch (err: unknown) {
      console.error('Lỗi khởi tạo tài khoản:', err);
      const msg = err instanceof Error ? err.message : 'Không thể khởi tạo tài khoản. Vui lòng thử lại!';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Thêm Tài Khoản Người Dùng Mới</h2>
              <p className="text-xs text-slate-500">Khởi tạo nhân sự, gán vai trò RBAC và phạm vi chi nhánh kho</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tên Đăng Nhập <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: operator_pda2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Họ và Tên Nhân Viên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn Vận Hành"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Địa Chỉ Email</label>
              <input
                type="email"
                placeholder="VD: pda2@smartwms.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Số Điện Thoại</label>
              <input
                type="text"
                placeholder="VD: 0988 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Vai Trò Hệ Thống (RBAC)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer transition-all"
              disabled={isSubmitting}
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
              {WAREHOUSES_LIST.map((wh) => {
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
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Ngày Hết Hạn Hợp Đồng / Tài Khoản Thời Vụ</span>
              </label>
              {expiresAt && (
                <button
                  type="button"
                  onClick={() => setExpiresAt('')}
                  className="text-2xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Không đặt hạn
                </button>
              )}
            </div>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
              disabled={isSubmitting}
            />
          </div>

          {/* Temporary Password Component */}
          <TempPasswordGenerator
            value={tempPassword}
            onChange={setTempPassword}
            disabled={isSubmitting}
          />

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-semibold text-xs cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Khởi Tạo...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Khởi Tạo Tài Khoản</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
