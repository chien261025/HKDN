import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Shield,
  Loader2,
  AlertCircle,
  Clock,
  Building2,
  Check,
  CheckCircle2,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  User,
  MapPin,
  QrCode,
  Laptop,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { userService } from '../services/userService';
import { warehouseService, DEFAULT_WAREHOUSES } from '../../masterdata/services/warehouseService';
import { TempPasswordGenerator } from './TempPasswordGenerator';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: UserAccount) => void;
  existingUsers?: UserAccount[];
  isAdmin?: boolean;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onAddUser,
  existingUsers,
  isAdmin = true,
}) => {
  // Wizard Step (1: Thông tin & Vai trò, 2: Phân quyền kho & Bảo mật giá, 3: Thiết bị PDA & Mật khẩu)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Account Info & Role
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('ROLE_OPERATOR');

  // Check duplication against loaded users list
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  const isUsernameDuplicate = Boolean(
    cleanUsername && existingUsers?.some((u) => u.username.toLowerCase() === cleanUsername)
  );
  const isEmailDuplicate = Boolean(
    cleanEmail && existingUsers?.some((u) => u.email.toLowerCase() === cleanEmail)
  );

  // Step 2: Warehouse Access & Cost Price Security
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
  const [canViewCostPrice, setCanViewCostPrice] = useState(false);
  const [allowPdaAccess, setAllowPdaAccess] = useState(true);
  const [canApproveOrders, setCanApproveOrders] = useState(false);

  // Step 3: Device Trust, Time Tracking & Password
  const [enableGps, setEnableGps] = useState(true);
  const [enableQr, setEnableQr] = useState(true);
  const [enablePdaScanner, setEnablePdaScanner] = useState(true);
  const [requireDeviceApproval, setRequireDeviceApproval] = useState(true);
  const [maxDevices, setMaxDevices] = useState('2');
  const [expiresAt, setExpiresAt] = useState('');
  const [tempPassword, setTempPassword] = useState('123456');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync role defaults when role changes
  const handleRoleChange = (newRole: UserRole) => {
    if (!isAdmin && newRole !== 'ROLE_OPERATOR') {
      return;
    }
    setRole(newRole);
    if (newRole === 'ROLE_ADMIN') {
      setCanViewCostPrice(true);
      setAllowPdaAccess(true);
      setCanApproveOrders(true);
    } else if (newRole === 'ROLE_WAREHOUSE_MANAGER') {
      setCanViewCostPrice(true);
      setAllowPdaAccess(true);
      setCanApproveOrders(true);
    } else {
      // Operator: By default hide cost price for security
      setCanViewCostPrice(false);
      setAllowPdaAccess(true);
      setCanApproveOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      warehouseService
        .getWarehouses()
        .then((whs) => {
          if (whs && whs.length > 0) {
            const mapped = whs.map((w) => ({
              id: Number(w.id),
              code: w.code,
              name: w.name,
              desc: w.address || w.shortName || 'Chi nhánh kho',
            }));
            setWarehouseList(mapped);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setCurrentStep(1);
    setUsername('');
    setFullName('');
    setEmail('');
    setPhone('');
    setRole('ROLE_OPERATOR');
    setSelectedWarehouseIds([1]);
    setPrimaryWarehouseId(1);
    setCanViewCostPrice(false);
    setAllowPdaAccess(true);
    setCanApproveOrders(false);
    setEnableGps(true);
    setEnableQr(true);
    setEnablePdaScanner(true);
    setRequireDeviceApproval(true);
    setMaxDevices('2');
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

  const validateStep1 = () => {
    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập Tên đăng nhập cho nhân viên!');
      return false;
    }
    if (isUsernameDuplicate) {
      setErrorMessage(`Tên đăng nhập '${cleanUsername}' đã tồn tại trong hệ thống! Vui lòng chọn tên khác.`);
      return false;
    }
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập Họ và tên nhân viên!');
      return false;
    }
    if (isEmailDuplicate) {
      setErrorMessage(`Địa chỉ email '${cleanEmail}' đã được sử dụng bởi tài khoản khác! Vui lòng nhập email khác.`);
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const validateStep2 = () => {
    if (selectedWarehouseIds.length === 0) {
      setErrorMessage('Vui lòng phân quyền ít nhất một chi nhánh kho làm việc!');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) return;

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
    } catch (err: any) {
      console.error('Lỗi khởi tạo tài khoản:', err);
      // Lấy thông điệp lỗi chuẩn từ server (tránh hiển thị "Request failed with status code 400")
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể khởi tạo tài khoản. Vui lòng thử lại!';

      const cleanMsg = serverMsg.includes('status code')
        ? 'Dữ liệu không hợp lệ hoặc thông tin tài khoản (Tên đăng nhập / Email) đã tồn tại trong hệ thống!'
        : serverMsg;

      setErrorMessage(cleanMsg);

      // Tự động chuyển về Bước 1 nếu lỗi liên quan đến Tên đăng nhập hoặc Email
      if (
        cleanMsg.toLowerCase().includes('tên đăng nhập') ||
        cleanMsg.toLowerCase().includes('username') ||
        cleanMsg.toLowerCase().includes('email') ||
        cleanMsg.toLowerCase().includes('tồn tại') ||
        cleanMsg.toLowerCase().includes('đã được sử dụng')
      ) {
        setCurrentStep(1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200 ring-4 ring-blue-50 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {isAdmin ? 'Thêm Nhân Sự & Cấp Quyền Làm Việc' : 'Đề Xuất Tiếp Nhận Nhân Viên Kho Vận'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {isAdmin ? 'Quy trình 3 bước' : 'Gửi IT Phê Duyệt'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Khởi tạo thông tin, thiết lập chính sách giá vốn và kiểm soát thiết bị tin cậy'
                  : 'Đăng ký thông tin thủ kho / nhân viên vận hành chi nhánh gửi Ban Quản Trị IT cấp tài khoản'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Indicator Pills */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 text-xs font-bold py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              currentStep === 1
                ? 'bg-blue-600 text-white shadow-xs'
                : currentStep > 1
                ? 'bg-blue-100 text-blue-800'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold bg-white/20">
              {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
            </div>
            <span>Thông tin & Vai trò</span>
          </button>

          <div className="h-0.5 flex-1 bg-slate-200 mx-1"></div>

          <button
            type="button"
            onClick={() => {
              if (validateStep1()) setCurrentStep(2);
            }}
            className={`flex items-center gap-2 text-xs font-bold py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              currentStep === 2
                ? 'bg-blue-600 text-white shadow-xs'
                : currentStep > 2
                ? 'bg-blue-100 text-blue-800'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold bg-white/20">
              {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
            </div>
            <span>Kho & Bảo mật giá</span>
          </button>

          <div className="h-0.5 flex-1 bg-slate-200 mx-1"></div>

          <button
            type="button"
            onClick={() => {
              if (validateStep1() && validateStep2()) setCurrentStep(3);
            }}
            className={`flex items-center gap-2 text-xs font-bold py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              currentStep === 3
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold bg-white/20">
              3
            </div>
            <span>Thiết bị PDA & Mật khẩu</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ================= STEP 1: THÔNG TIN & VAI TRÒ ================= */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Tên Đăng Nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: operator_pda2"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 transition-all ${
                      isUsernameDuplicate
                        ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20 bg-rose-50/20'
                        : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                    disabled={isSubmitting}
                    autoFocus
                  />
                  {isUsernameDuplicate ? (
                    <span className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Tên đăng nhập &apos;{cleanUsername}&apos; đã tồn tại! Vui lòng chọn tên khác.
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Dùng để đăng nhập hệ thống và đồng bộ trên thiết bị PDA
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Họ và Tên Nhân Viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Nguyễn Văn Vận Hành"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    disabled={isSubmitting}
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Tên hiển thị trên chứng từ kho và nhật ký ca</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Địa Chỉ Email</label>
                  <input
                    type="email"
                    placeholder="VD: pda2@smartwms.vn"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                      isEmailDuplicate
                        ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20 bg-rose-50/20'
                        : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                    disabled={isSubmitting}
                  />
                  {isEmailDuplicate ? (
                    <span className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Địa chỉ email &apos;{cleanEmail}&apos; đã được sử dụng bởi một tài khoản khác!
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 mt-1 block">Dùng để nhận thông báo và khôi phục tài khoản</span>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    placeholder="VD: 0988 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Role Quick Selector Pills (Chuẩn phong cách vkho.vn & Enterprise SoD) */}
              <div>
                <label className="block text-slate-800 font-bold mb-2">
                  Chọn Vai Trò Tác Nghiệp: <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('ROLE_OPERATOR')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      role === 'ROLE_OPERATOR'
                        ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">Thủ Kho / Vận Hành</span>
                      {role === 'ROLE_OPERATOR' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Tác nghiệp hiện trường trên máy PDA, quét nhận & xuất hàng
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => handleRoleChange('ROLE_WAREHOUSE_MANAGER')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      !isAdmin
                        ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                        : role === 'ROLE_WAREHOUSE_MANAGER'
                        ? 'bg-purple-50/80 border-purple-600 ring-2 ring-purple-600/20 shadow-xs cursor-pointer'
                        : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                    }`}
                    title={!isAdmin ? 'Chỉ Quản trị viên IT mới có quyền bổ nhiệm Trưởng kho' : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                        {!isAdmin && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                        <span>Trưởng Kho</span>
                      </span>
                      {role === 'ROLE_WAREHOUSE_MANAGER' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {!isAdmin ? '🔒 Thẩm quyền thuộc Quản Trị Viên Hệ Thống' : 'Điều hành chi nhánh, duyệt đơn nhập xuất, xem giá vốn'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => handleRoleChange('ROLE_ADMIN')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      !isAdmin
                        ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                        : role === 'ROLE_ADMIN'
                        ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-600/20 shadow-xs cursor-pointer'
                        : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                    }`}
                    title={!isAdmin ? 'Chỉ Quản trị viên mới có quyền cấp quyền này' : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                        {!isAdmin && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                        <span>Quản Trị Viên Hệ Thống</span>
                      </span>
                      {role === 'ROLE_ADMIN' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {!isAdmin ? '🔒 Thẩm quyền thuộc Quản Trị Viên Hệ Thống' : 'Toàn quyền hệ thống, bảo mật tài khoản & phân quyền'}
                    </span>
                  </button>
                </div>

                {!isAdmin && (
                  <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Theo nguyên tắc phân quyền, Quản lý kho chỉ được tiếp nhận Thủ kho / Nhân viên vận hành. Cấp quyền Trưởng kho và Quản trị viên do Quản trị hệ thống phê duyệt.</span>
                  </div>
                )}
              </div>

              {/* Visual Permissions Callout Box (Giống giao diện trực quan vkho.vn) */}
              <div className="p-4 rounded-2xl border border-blue-200/80 bg-blue-50/40 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-bold text-slate-900 text-xs">
                    Tóm tắt quyền hạn của vai trò{' '}
                    <span className="text-blue-700">
                      {role === 'ROLE_OPERATOR'
                        ? 'Thủ Kho / Vận Hành Thực Địa'
                        : role === 'ROLE_WAREHOUSE_MANAGER'
                        ? 'Trưởng Kho / Quản Lý Chi Nhánh'
                        : 'Quản Trị Viên Hệ Thống'}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Được phép */}
                  <div className="p-3 bg-white rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Được phép thực hiện:
                    </span>
                    <ul className="space-y-1 text-slate-600 text-[11px]">
                      {role === 'ROLE_OPERATOR' ? (
                        <>
                          <li>• Quét mã vạch tiếp nhận hàng tại khu kiểm hàng</li>
                          <li>• Cất hàng vào vị trí ô kệ theo chỉ dẫn gợi ý</li>
                          <li>• Quét nhặt hàng đơn xuất kho & gom kiện</li>
                          <li>• Đếm hàng thực địa đợt kiểm kê bằng máy quét PDA</li>
                        </>
                      ) : role === 'ROLE_WAREHOUSE_MANAGER' ? (
                        <>
                          <li>• Quản lý toàn bộ đơn nhập và đơn xuất kho</li>
                          <li>• Điều phối phân bổ ô kệ, tối ưu sức chứa chi nhánh</li>
                          <li>• Xem thông tin giá vốn hàng hóa và giá trị tổng kho</li>
                          <li>• Tạo và duyệt phiếu cân đối chênh lệch kiểm kê</li>
                          <li>• Giám sát ca làm việc và thiết bị PDA nhân viên</li>
                        </>
                      ) : (
                        <>
                          <li>• Toàn quyền quản trị tài khoản, phân quyền và mật khẩu</li>
                          <li>• Cấu hình sơ đồ kho, chi nhánh và danh mục sản phẩm</li>
                          <li>• Phục hồi dữ liệu, xem toàn bộ nhật ký an ninh hệ thống</li>
                        </>
                      )}
                    </ul>
                  </div>

                  {/* Hạn chế bảo mật */}
                  <div className="p-3 bg-white rounded-xl border border-rose-200">
                    <span className="font-bold text-rose-800 flex items-center gap-1.5 mb-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                      Chính sách an ninh bảo mật:
                    </span>
                    <ul className="space-y-1 text-slate-600 text-[11px]">
                      {role === 'ROLE_OPERATOR' ? (
                        <>
                          <li>• Che giấu toàn bộ giá vốn hàng hóa (hiển thị `***`)</li>
                          <li>• Không xem doanh thu, lợi nhuận hoặc báo cáo tài chính</li>
                          <li>• Không xoá phiếu chứng từ hoặc thay đổi sơ đồ kho</li>
                          <li>• Không tự ý điều chỉnh số dư tồn kho bất thường</li>
                        </>
                      ) : role === 'ROLE_WAREHOUSE_MANAGER' ? (
                        <>
                          <li>• Giới hạn thao tác trong các kho được phân công</li>
                          <li>• Không chỉnh sửa tài khoản Quản trị viên cấp cao</li>
                        </>
                      ) : (
                        <>
                          <li>• Tài khoản cấp cao nhất: Mọi thao tác đều ghi nhật ký</li>
                          <li>• Khuyến nghị bật xác thực thiết bị tin cậy</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: PHÂN QUYỀN KHO & BẢO MẬT GIÁ ================= */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Multi-Warehouse Access Selector */}
              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Phân Quyền Chi Nhánh Kho Hàng:</span>
                  </label>
                  <span className="text-2xs text-slate-500 font-medium">
                    Đã chọn <span className="font-bold text-blue-600">{selectedWarehouseIds.length}</span> kho
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
                          isChecked ? 'bg-white border-blue-200 shadow-2xs' : 'bg-slate-100/60 border-slate-200 opacity-60'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleWarehouse(wh.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                                ? 'bg-blue-600 text-white border-blue-600'
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

              {/* Enterprise Security Policies & Price Masking */}
              <div className="space-y-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="text-slate-800 font-bold flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Chính Sách Bảo Mật Dữ Liệu Doanh Nghiệp:</span>
                </label>

                {/* Price Masking Toggle */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 mt-0.5">
                      {canViewCostPrice ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Cho phép xem giá vốn & giá bán hàng hóa</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {canViewCostPrice
                          ? 'Tài khoản được xem giá nhập thực tế và giá trị hàng hóa trên chứng từ.'
                          : 'Hệ thống tự động che toàn bộ giá vốn bằng dấu *** khi tài khoản này đăng nhập.'}
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={canViewCostPrice}
                      onChange={(e) => setCanViewCostPrice(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* PDA Scanner Access */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 mt-0.5">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Cho phép tác nghiệp trên thiết bị cầm tay PDA</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Cấp quyền đăng nhập vào cổng vận hành thực địa quét mã vạch (/operator).
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={allowPdaAccess}
                      onChange={(e) => setAllowPdaAccess(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Order Approval Privilege */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 mt-0.5">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Quyền duyệt hoàn tất đơn nhập / xuất kho</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Cho phép ký duyệt đơn hàng để ghi nhận vào sổ cái thẻ kho bất biến.
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={canApproveOrders}
                      onChange={(e) => setCanApproveOrders(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: THIẾT BỊ PDA & MẬT KHẨU ================= */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Phương thức chấm công & Thiết bị (Chuẩn vkho.vn) */}
              <div className="space-y-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="text-slate-800 font-bold flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Phương Thức Điểm Danh & Chấm Công Thực Địa:</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-slate-800 text-xs">Định vị GPS</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableGps}
                      onChange={(e) => setEnableGps(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-slate-800 text-xs">Quét mã QR</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableQr}
                      onChange={(e) => setEnableQr(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-slate-800 text-xs">Máy quét PDA</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enablePdaScanner}
                      onChange={(e) => setEnablePdaScanner(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Trusted Device Approval Toggle */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 mt-2">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Yêu cầu duyệt thiết bị khi đăng nhập lần đầu</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Thiết bị PDA mới cần Quản trị viên duyệt tại tab "Máy Quét PDA & Thiết Bị Tin Cậy"
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={requireDeviceApproval}
                      onChange={(e) => setRequireDeviceApproval(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Max Devices Allowed */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-700 font-semibold text-xs">Số thiết bị tối đa cho phép:</span>
                  <select
                    value={maxDevices}
                    onChange={(e) => setMaxDevices(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="1">1 thiết bị</option>
                    <option value="2">2 thiết bị (Khuyến nghị)</option>
                    <option value="3">3 thiết bị</option>
                  </select>
                </div>
              </div>

              {/* Expiry Date for Seasonal Accounts */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Ngày Hết Hạn Hợp Đồng / Tài Khoản Mùa Vụ</span>
                  </label>
                  {expiresAt && (
                    <button
                      type="button"
                      onClick={() => setExpiresAt('')}
                      className="text-2xs text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    >
                      Không đặt hạn
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
                  disabled={isSubmitting}
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Khi đến ngày hết hạn, tài khoản sẽ tự động chuyển sang trạng thái tạm khóa để bảo vệ dữ liệu
                </span>
              </div>

              {/* Temporary Password Component */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <TempPasswordGenerator
                  value={tempPassword}
                  onChange={setTempPassword}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* Footer Navigation Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 shrink-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-semibold text-xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-semibold text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
            )}

            <div className="flex items-center gap-2">
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm shadow-blue-200 transition-all active:scale-95 text-xs cursor-pointer"
                >
                  <span>Tiếp tục</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isAdmin ? 'Đang Khởi Tạo...' : 'Đang Gửi Đề Xuất...'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>{isAdmin ? 'Xác Nhận Tạo Nhân Sự' : 'Gửi Đề Xuất Duyệt Cấp Tài Khoản'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
