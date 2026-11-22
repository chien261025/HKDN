import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Building2,
  MapPin,
  Phone,
  Boxes,
  Layers,
  Thermometer,
  Truck,
  CheckCircle2,
  AlertCircle,
  User,
  ShieldCheck,
  Maximize2,
  UserCheck,
  UserPlus,
  Mail,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { WarehouseItem, WarehouseType, WarehouseRegion } from '../../types';
import { UserAccount } from '../../../users/types';

interface CreateWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWarehouse: (
    warehouse: Partial<WarehouseItem> & {
      newManagerAccount?: {
        username: string;
        fullName: string;
        email: string;
        phone: string;
        password?: string;
      };
    }
  ) => Promise<void>;
  editingWarehouse?: WarehouseItem | null;
  existingWarehouses: WarehouseItem[];
  availableUsers?: UserAccount[];
}

export const generateUsernameFromName = (name: string): string => {
  if (!name.trim()) return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

export const CreateWarehouseModal: React.FC<CreateWarehouseModalProps> = ({
  isOpen,
  onClose,
  onSaveWarehouse,
  editingWarehouse,
  existingWarehouses,
  availableUsers = [],
}) => {
  const isEditing = !!editingWarehouse;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [region, setRegion] = useState<WarehouseRegion>('SOUTH');
  const [type, setType] = useState<WarehouseType>('DISTRIBUTION');

  // Manager appointment mode: Only 2 enterprise modes: SYSTEM_USER or PROVISION_NEW
  const [managerMode, setManagerMode] = useState<'SYSTEM_USER' | 'PROVISION_NEW'>('SYSTEM_USER');

  // Selected system user
  const [selectedUserId, setSelectedUserId] = useState<string>('2');
  const [managerId, setManagerId] = useState<string | number | undefined>(2);
  const [managerUsername, setManagerUsername] = useState<string | undefined>('manager01');
  const [managerName, setManagerName] = useState('Trần Trưởng Kho');

  // New Manager provisioning fields
  const [newManagerFullName, setNewManagerFullName] = useState('');
  const [newManagerUsername, setNewManagerUsername] = useState('');
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [newManagerPhone, setNewManagerPhone] = useState('');
  const [isUsernameCustomized, setIsUsernameCustomized] = useState(false);
  const [isEmailCustomized, setIsEmailCustomized] = useState(false);

  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('028 3811 2233');
  const [capacityPallets, setCapacityPallets] = useState(3000);
  const [areaM2, setAreaM2] = useState(7500);
  const [dockCount, setDockCount] = useState(6);
  const [totalZones, setTotalZones] = useState(3);
  const [temperatureRange, setTemperatureRange] = useState('18°C - 25°C (Kho Tiêu Chuẩn)');
  const [isActive, setIsActive] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Eligible Managers from User Directory (Only ROLE_WAREHOUSE_MANAGER or ROLE_ADMIN)
  const eligibleManagers = useMemo(() => {
    const list = availableUsers.filter(
      (u) =>
        u.status === 'ACTIVE' &&
        (u.role === 'ROLE_WAREHOUSE_MANAGER' ||
          u.role === 'ROLE_MANAGER' ||
          u.role === 'ROLE_ADMIN' ||
          (u.role as string) === 'WAREHOUSE_MANAGER' ||
          (u.role as string) === 'ADMIN')
    );
    if (list.length > 0) return list;

    // Default enterprise managers fallback if users not loaded
    return [
      {
        id: '2',
        username: 'manager01',
        fullName: 'Trần Trưởng Kho',
        phone: '0900000002',
        email: 'manager@smartwms.vn',
        role: 'ROLE_WAREHOUSE_MANAGER' as any,
        status: 'ACTIVE' as any,
        isTestAccount: false,
        createdAt: '17/11/2026',
        lastLoginAt: '22/11/2026 12:35',
        lastLoginIp: '192.168.1.102',
      },
      {
        id: '1',
        username: 'admin',
        fullName: 'Nguyễn Quản Trị',
        phone: '0900000001',
        email: 'admin@smartwms.vn',
        role: 'ROLE_ADMIN' as any,
        status: 'ACTIVE' as any,
        isTestAccount: false,
        createdAt: '17/11/2026',
        lastLoginAt: '22/11/2026 12:35',
        lastLoginIp: '192.168.1.100',
      },
      {
        id: '4',
        username: 'admin1',
        fullName: 'Quản Trị Viên 1',
        phone: '0900000004',
        email: 'admin1@smartwms.vn',
        role: 'ROLE_ADMIN' as any,
        status: 'ACTIVE' as any,
        isTestAccount: false,
        createdAt: '17/11/2026',
        lastLoginAt: '20/11/2026 16:23',
        lastLoginIp: '192.168.1.104',
      },
    ];
  }, [availableUsers]);

  // Auto-fill suggested username & email when typing new manager's full name
  const handleNewManagerNameChange = (nameInput: string) => {
    setNewManagerFullName(nameInput);
    const suggested = generateUsernameFromName(nameInput);
    if (!isUsernameCustomized) {
      setNewManagerUsername(suggested);
    }
    if (!isEmailCustomized) {
      setNewManagerEmail(suggested ? `${suggested}@smartwms.vn` : '');
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (editingWarehouse) {
        setCode(editingWarehouse.code);
        setName(editingWarehouse.name);
        setRegion(editingWarehouse.region || 'SOUTH');
        setType(editingWarehouse.type || 'DISTRIBUTION');

        // Check if existing manager matches a system user
        const matchedUser = eligibleManagers.find(
          (m) =>
            (editingWarehouse.managerId && String(m.id) === String(editingWarehouse.managerId)) ||
            (editingWarehouse.managerUsername && m.username === editingWarehouse.managerUsername) ||
            m.fullName === editingWarehouse.managerName
        );

        if (matchedUser) {
          setManagerMode('SYSTEM_USER');
          setSelectedUserId(String(matchedUser.id));
          setManagerId(matchedUser.id);
          setManagerUsername(matchedUser.username);
          setManagerName(matchedUser.fullName);
        } else {
          // If not matching an existing user, show PROVISION_NEW with their current details
          setManagerMode('PROVISION_NEW');
          setNewManagerFullName(editingWarehouse.managerName || '');
          const suggested = generateUsernameFromName(editingWarehouse.managerName || '');
          setNewManagerUsername(editingWarehouse.managerUsername || suggested);
          setNewManagerEmail(`${editingWarehouse.managerUsername || suggested}@smartwms.vn`);
          setNewManagerPhone(editingWarehouse.contactPhone || editingWarehouse.managerPhone || '');
        }

        setAddress(editingWarehouse.address || '');
        setContactPhone(editingWarehouse.contactPhone || editingWarehouse.managerPhone || '028 3811 2233');
        setCapacityPallets(editingWarehouse.capacityPallets || 3000);
        setAreaM2(editingWarehouse.areaM2 || 7500);
        setDockCount(editingWarehouse.dockCount || 6);
        setTotalZones(editingWarehouse.totalZones || 3);
        setTemperatureRange(editingWarehouse.temperatureRange || '18°C - 25°C (Kho Tiêu Chuẩn)');
        setIsActive(editingWarehouse.isActive !== false);
      } else {
        const nextNum = existingWarehouses.length + 1;
        setCode(`WH0${nextNum}`);
        setName('');
        setRegion('SOUTH');
        setType('DISTRIBUTION');

        // Default to first eligible manager
        const defaultManager = eligibleManagers[0];
        setManagerMode('SYSTEM_USER');
        if (defaultManager) {
          setSelectedUserId(String(defaultManager.id));
          setManagerId(defaultManager.id);
          setManagerUsername(defaultManager.username);
          setManagerName(defaultManager.fullName);
          setContactPhone(defaultManager.phone || '028 3811 2233');
        } else {
          setManagerName('Trần Trưởng Kho');
          setContactPhone('028 3811 2233');
        }

        setNewManagerFullName('');
        setNewManagerUsername('');
        setNewManagerEmail('');
        setNewManagerPhone('');
        setIsUsernameCustomized(false);
        setIsEmailCustomized(false);

        setAddress('');
        setCapacityPallets(3000);
        setAreaM2(6500);
        setDockCount(6);
        setTotalZones(3);
        setTemperatureRange('18°C - 25°C (Kho Tiêu Chuẩn)');
        setIsActive(true);
      }
      setErrorMsg(null);
    }
  }, [isOpen, editingWarehouse, existingWarehouses.length, eligibleManagers]);

  if (!isOpen) return null;

  // Real-time duplicate check for warehouse code
  const isDuplicateCode = !isEditing && existingWarehouses.some(
    (w) => w.code.toUpperCase() === code.trim().toUpperCase()
  );

  const handleSelectManager = (userIdStr: string) => {
    setSelectedUserId(userIdStr);
    const target = eligibleManagers.find((m) => String(m.id) === userIdStr);
    if (target) {
      setManagerId(target.id);
      setManagerUsername(target.username);
      setManagerName(target.fullName);
      if (target.phone) {
        setContactPhone(target.phone);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setErrorMsg('Vui lòng nhập Mã Chi Nhánh Kho!');
      return;
    }

    if (isDuplicateCode) {
      setErrorMsg(`Mã kho '${code.trim().toUpperCase()}' đã tồn tại trong hệ thống! Vui lòng chọn mã khác.`);
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập Tên Chi Nhánh Kho!');
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Vui lòng nhập Địa Chỉ Chi Tiết của kho!');
      return;
    }

    let finalManagerName = managerName.trim();
    let finalManagerUsername = managerUsername;
    let finalManagerId = managerId;
    let newManagerAccountPayload: any = undefined;

    if (managerMode === 'PROVISION_NEW') {
      if (!newManagerFullName.trim()) {
        setErrorMsg('Vui lòng nhập Họ Tên Trưởng Kho được bổ nhiệm!');
        return;
      }
      
      const autoUsername = (newManagerUsername.trim() || generateUsernameFromName(newManagerFullName) || 'manager').toLowerCase();
      const autoEmail = (newManagerEmail.trim() || `${autoUsername}@smartwms.vn`).toLowerCase();
      const autoPhone = (newManagerPhone.trim() || contactPhone.trim() || '0908000001');

      finalManagerName = newManagerFullName.trim();
      finalManagerUsername = autoUsername;
      finalManagerId = undefined; // Will be assigned upon user creation

      newManagerAccountPayload = {
        username: finalManagerUsername,
        fullName: finalManagerName,
        email: autoEmail,
        phone: autoPhone,
        password: '123456',
      };
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: Partial<WarehouseItem> & { newManagerAccount?: any } = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        shortName: name.trim().split('-')[0].trim(),
        region,
        type,
        managerId: finalManagerId,
        managerUsername: finalManagerUsername,
        managerName: finalManagerName,
        managerPhone: (managerMode === 'PROVISION_NEW' ? newManagerPhone : contactPhone).trim(),
        address: address.trim(),
        contactPhone: contactPhone.trim(),
        capacityPallets: Number(capacityPallets) || 3000,
        areaM2: Number(areaM2) || 6000,
        dockCount: Number(dockCount) || 4,
        totalZones: Number(totalZones) || 3,
        temperatureRange,
        isActive,
        newManagerAccount: newManagerAccountPayload,
      };

      if (isEditing && editingWarehouse) {
        payload.id = editingWarehouse.id;
      }

      await onSaveWarehouse(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu thông tin chi nhánh kho!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedManagerUser = eligibleManagers.find((m) => String(m.id) === selectedUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col my-4 max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-200 ring-4 ring-blue-50">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {isEditing ? 'Chỉnh Sửa Hồ Sơ Chi Nhánh Kho' : 'Khai Báo Chi Nhánh Kho Mới'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditing
                  ? `Cập nhật thông tin năng lực lưu trữ và bổ nhiệm nhân sự điều hành chi nhánh @${editingWarehouse.code}`
                  : 'Mở rộng mạng lưới chi nhánh kho hàng trong chuỗi cung ứng doanh nghiệp'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Row 1: Mã Kho & Loại Hình & Vùng Miền */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mã Chi Nhánh Kho <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: WH05"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-bold uppercase focus:bg-white focus:outline-none focus:ring-2 ${
                  isDuplicateCode
                    ? 'border-rose-400 text-rose-700 focus:ring-rose-200'
                    : 'border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-blue-100'
                } disabled:bg-slate-100 disabled:text-slate-500`}
              />
              {isDuplicateCode && (
                <span className="text-[11px] text-rose-600 mt-0.5 block font-medium">Mã kho này đã tồn tại!</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Loại Hình Kho Hàng</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as WarehouseType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                <option value="DISTRIBUTION">Kho Phân Phối Vùng</option>
                <option value="CENTRAL">Kho Tổng Trung Tâm</option>
                <option value="HUB">Kho Trung Chuyển Liên Vùng</option>
                <option value="COLD_STORAGE">Kho Lạnh Chuyên Dụng</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Khu Vực Địa Lý</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as WarehouseRegion)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                <option value="SOUTH">Khu Vực Miền Nam</option>
                <option value="NORTH">Khu Vực Miền Bắc</option>
                <option value="CENTRAL_VN">Khu Vực Miền Trung</option>
                <option value="MEKONG">Khu Vực Tây Nam Bộ</option>
              </select>
            </div>
          </div>

          {/* Row 2: Tên Chi Nhánh Kho */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên Chi Nhánh Kho <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Kho Quy Nhơn - Miền Trung"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Row 3: BỔ NHIỆM TRƯỞNG KHO QUẢN LÝ (Chuẩn logic RBAC: 2 Chế độ thực tế duy nhất) */}
          <div className="p-4 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200/80 pb-2.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Trưởng Kho Quản Lý Phụ Trách (Bổ Nhiệm Nhân Sự) <span className="text-rose-500">*</span></span>
              </span>

              {/* 2-Option Mode Switch */}
              <div className="flex items-center bg-slate-200/70 p-0.5 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setManagerMode('SYSTEM_USER')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    managerMode === 'SYSTEM_USER'
                      ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nhân Sự Có Sẵn ({eligibleManagers.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManagerMode('PROVISION_NEW')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    managerMode === 'PROVISION_NEW'
                      ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Bổ Nhiệm Mới & Cấp Tài Khoản</span>
                </button>
              </div>
            </div>

            {/* Chế độ 1: Chọn từ danh sách tài khoản quản trị có sẵn */}
            {managerMode === 'SYSTEM_USER' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Chọn Nhân Sự Quản Lý Từ Danh Mục Hệ Thống
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => handleSelectManager(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer shadow-2xs"
                  >
                    {eligibleManagers.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.fullName} (@{m.username}) — {m.role === 'ROLE_ADMIN' || (m.role as string) === 'ADMIN' ? 'Quản Trị Viên' : 'Trưởng Kho Quản Lý'} — SĐT: {m.phone || '0900 000 002'}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedManagerUser && (
                  <div className="flex items-center justify-between text-[11px] text-emerald-900 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Nhân sự được gán: <strong className="font-bold">{selectedManagerUser.fullName}</strong> (@{selectedManagerUser.username})</span>
                    </span>
                    <span className="font-mono text-emerald-800 font-semibold">SĐT: {selectedManagerUser.phone || '0900 000 002'}</span>
                  </div>
                )}
              </div>
            )}

            {/* Chế độ 2: Bổ nhiệm Trưởng kho mới & Tự động sinh tài khoản */}
            {managerMode === 'PROVISION_NEW' && (
              <div className="space-y-3 bg-white p-3.5 rounded-xl border border-blue-200 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Khai Báo Trưởng Kho Mới (Tự động khởi tạo tài khoản đăng nhập)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Họ Và Tên Trưởng Kho <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={newManagerFullName}
                        onChange={(e) => handleNewManagerNameChange(e.target.value)}
                        placeholder="VD: Khánh Kelvin"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tên Đăng Nhập (@username) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold">@</span>
                      <input
                        type="text"
                        value={newManagerUsername}
                        onChange={(e) => {
                          setNewManagerUsername(e.target.value.toLowerCase());
                          setIsUsernameCustomized(true);
                        }}
                        placeholder="khanhkelvin"
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-700 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Email Doanh Nghiệp <span className="text-slate-400 font-normal">(Tự động theo tên)</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={newManagerEmail}
                        onChange={(e) => {
                          setNewManagerEmail(e.target.value);
                          setIsEmailCustomized(true);
                        }}
                        placeholder="khanhkelvin@smartwms.vn"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Hotline / Số Điện Thoại <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={newManagerPhone}
                        onChange={(e) => {
                          setNewManagerPhone(e.target.value);
                          setContactPhone(e.target.value);
                        }}
                        placeholder="0908000001"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mật khẩu mặc định: <strong className="font-mono font-bold">123456</strong> (Yêu cầu đổi khi đăng nhập lần đầu)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-blue-200 text-blue-800">
                    Vai trò: Quản Lý Kho
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Row 4: Địa Chỉ Chi Tiết & Hotline Kho */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa Chỉ Chi Tiết Thực Địa <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="VD: Số 111, TP. Quy Nhơn, Bình Định"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hotline Điều Phối Kho</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="0908000001"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Chỉ số mặt bằng & Năng lực */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Boxes className="w-4 h-4 text-blue-600" />
              <span>Chỉ Số Năng Lực Mặt Bằng & Lưu Trữ Thiết Kế</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sức Chứa (Pallet)</label>
                <input
                  type="number"
                  min={500}
                  step={100}
                  value={capacityPallets}
                  onChange={(e) => setCapacityPallets(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Diện Tích (m²)</label>
                <input
                  type="number"
                  min={500}
                  step={100}
                  value={areaM2}
                  onChange={(e) => setAreaM2(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cửa Tiếp Vận (Dock)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={dockCount}
                  onChange={(e) => setDockCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Số Phân Khu (Zones)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={totalZones}
                  onChange={(e) => setTotalZones(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Row 6: Nhiệt độ bảo quản & Trạng thái */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu Chuẩn Nhiệt Độ Bảo Quản</label>
              <select
                value={temperatureRange}
                onChange={(e) => setTemperatureRange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                <option value="18°C - 25°C (Kho Tiêu Chuẩn)">18°C - 25°C (Kho Thường Tiêu Chuẩn)</option>
                <option value="10°C - 15°C (Kho Mát Thực Phẩm / Thuốc)">10°C - 15°C (Kho Mát Bảo Quản Thực Phẩm)</option>
                <option value="-18°C - 0°C (Kho Đông Lạnh Sâu)">-18°C - 0°C (Kho Đông Lạnh Sâu)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Trạng Thái Vận Hành</label>
              <select
                value={isActive ? 'ACTIVE' : 'INACTIVE'}
                onChange={(e) => setIsActive(e.target.value === 'ACTIVE')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                <option value="ACTIVE">✓ Đang Hoạt Động (Mở Cửa Xuất Nhập)</option>
                <option value="INACTIVE">⏸️ Tạm Dừng Bảo Trì / Nâng Cấp Kỹ Thuật</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Sau khi lưu, chi nhánh sẽ lập tức đồng bộ trong bộ chọn kho trên thanh công cụ và toàn bộ giao diện quản trị WMS.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isDuplicateCode}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-blue-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Lưu Thay Đổi' : 'Xác Nhận Thêm Kho'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
