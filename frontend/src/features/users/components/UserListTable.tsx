import React, { useEffect, useState } from 'react';
import { Search, Filter, Shield, Lock, Unlock, KeyRound, Pencil, ShieldCheck, Download, Clock, MapPin, CheckSquare, Square, Check, Beaker, X, Eye, Building2 } from 'lucide-react';
import { UserAccount } from '../types';
import { UserMobileCards } from './UserMobileCards';
import { Pagination } from '../../../components/common';
import { UserKpiFilter } from './UsersHeader';

const PAGE_SIZE = 10;
import { getRoleBadge, getStatusBadge } from '../utils/userBadges';

interface UserListTableProps {
  users: UserAccount[];
  onToggleStatus: (user: UserAccount) => void;
  onResetPassword: (user: UserAccount) => void;
  onEditUser: (user: UserAccount) => void;
  onViewSecurityLog: (user: UserAccount) => void;
  onViewDetail: (user: UserAccount) => void;
  onBulkStatus?: (selectedIds: string[], isActive: boolean) => Promise<void>;
  onOpenRbacMatrix?: () => void;
  kpiFilter?: UserKpiFilter;
  onClearKpiFilter?: () => void;
  isAdmin?: boolean;
}

export const UserListTable: React.FC<UserListTableProps> = ({
  users,
  onToggleStatus,
  onResetPassword,
  onEditUser,
  onViewSecurityLog,
  onViewDetail,
  onBulkStatus,
  onOpenRbacMatrix,
  kpiFilter = 'ALL',
  onClearKpiFilter,
  isAdmin = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [hideTestAccounts, setHideTestAccounts] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const testAccountCount = users.filter((u) => u.isTestAccount).length;

  const getKpiFilterName = (filter: UserKpiFilter) => {
    switch (filter) {
      case 'MANAGEMENT':
        return isAdmin ? 'Quản Trị & Điều Hành' : 'Cán Bộ Quản Lý Kho';
      case 'OPERATOR':
        return 'Nhân Viên Vận Hành';
      case 'LOCKED':
        return 'Tài Khoản Tạm Khóa';
      default:
        return 'Tất Cả Nhân Sự';
    }
  };

  const filteredUsers = users.filter((u) => {
    if (hideTestAccounts && u.isTestAccount) {
      return false;
    }

    // KPI Quick Filter from Top Banner
    if (kpiFilter === 'MANAGEMENT') {
      if (isAdmin) {
        if (u.role !== 'ROLE_ADMIN' && u.role !== 'ROLE_WAREHOUSE_MANAGER' && u.role !== 'ROLE_MANAGER') {
          return false;
        }
      } else {
        if (u.role !== 'ROLE_WAREHOUSE_MANAGER' && u.role !== 'ROLE_MANAGER') {
          return false;
        }
      }
    } else if (kpiFilter === 'OPERATOR') {
      if (u.role !== 'ROLE_OPERATOR') {
        return false;
      }
    } else if (kpiFilter === 'LOCKED') {
      if (u.status !== 'LOCKED' && u.status !== 'EXPIRED' && !u.isExpired) {
        return false;
      }
    }

    const normalizeSearchText = (val?: string): string =>
      (val || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .toLowerCase()
        .trim();

    const term = normalizeSearchText(searchTerm);
    const matchSearch =
      !term ||
      normalizeSearchText(u.username).includes(term) ||
      normalizeSearchText(u.fullName).includes(term) ||
      normalizeSearchText(u.email).includes(term) ||
      (u.phone ? u.phone.toLowerCase().includes(term) : false) ||
      normalizeSearchText(u.assignedWarehouse).includes(term) ||
      normalizeSearchText(u.primaryWarehouse).includes(term) ||
      (u.assignedWarehouses ? u.assignedWarehouses.some((w) => normalizeSearchText(w).includes(term)) : false);

    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'EXPIRED'
        ? u.isExpired
        : u.status === statusFilter;

    const whNeedle = normalizeSearchText(warehouseFilter);
    const matchWh =
      warehouseFilter === 'ALL'
        ? true
        : normalizeSearchText(u.primaryWarehouse).includes(whNeedle) ||
          normalizeSearchText(u.assignedWarehouse).includes(whNeedle) ||
          (u.assignedWarehouses && u.assignedWarehouses.some((w) => normalizeSearchText(w).includes(whNeedle)));

    return matchSearch && matchRole && matchStatus && matchWh;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const visibleUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setCurrentPage(1), [searchTerm, roleFilter, statusFilter, warehouseFilter, hideTestAccounts, kpiFilter]);
  useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

  // Tài khoản có thể chọn (loại trừ root admin)
  const selectableUsers = filteredUsers.filter((u) => u.username.toLowerCase() !== 'admin');
  const allSelectableChosen =
    selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.has(u.id));

  const toggleSelectAll = () => {
    if (allSelectableChosen) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableUsers.map((u) => u.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkAction = async (isActive: boolean) => {
    if (selectedIds.size === 0 || !onBulkStatus) return;
    const count = selectedIds.size;
    const actionText = isActive ? 'mở khóa hoạt động' : 'tạm khóa tài khoản & thu hồi phiên làm việc';
    const confirmed = window.confirm(
      `Xác nhận ${actionText} cho ${count} tài khoản nhân sự đã chọn?`
    );
    if (!confirmed) return;

    setIsBulkLoading(true);
    try {
      await onBulkStatus(Array.from(selectedIds), isActive);
      setSelectedIds(new Set());
    } finally {
      setIsBulkLoading(false);
    }
  };

  const [csvNotice, setCsvNotice] = useState<string | null>(null);

  const handleResetAllFilters = () => {
    setSearchTerm('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setWarehouseFilter('ALL');
    onClearKpiFilter?.();
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Tên Đăng Nhập', 'Họ Và Tên', 'Email', 'Số Điện Thoại', 'Vai Trò', 'Kho Phụ Trách', 'Hạn Dùng', 'Trạng Thái', 'Đăng Nhập Cuối', 'IP'];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.username,
      `"${u.fullName.replace(/"/g, '""')}"`,
      u.email,
      u.phone || '',
      u.role,
      `"${(u.primaryWarehouse || u.assignedWarehouse || '').replace(/"/g, '""')}"`,
      u.expiresAt || 'Vô thời hạn',
      u.isExpired ? 'HẾT HẠN' : u.status,
      `"${u.lastLoginAt}"`,
      u.lastLoginIp,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_sach_nhan_su_kho_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCsvNotice(`Đã xuất ${filteredUsers.length} nhân sự ra file CSV`);
    setTimeout(() => setCsvNotice(null), 3500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Active KPI Quick Filter Banner */}
      {kpiFilter && kpiFilter !== 'ALL' && (
        <div className="p-3 bg-blue-50/90 border-b border-blue-200 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-blue-900 font-medium">
              Đang lọc theo thẻ KPI: <strong className="font-bold text-blue-950">{getKpiFilterName(kpiFilter)}</strong> ({filteredUsers.length} tài khoản phù hợp)
            </span>
          </div>
          {onClearKpiFilter && (
            <button
              type="button"
              onClick={onClearKpiFilter}
              className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Bỏ lọc</span>
            </button>
          )}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên đăng nhập, họ tên, email, kho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Hide Test Accounts */}
          {testAccountCount > 0 && (
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 cursor-pointer shadow-2xs hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={hideTestAccounts}
                onChange={(e) => setHideTestAccounts(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Beaker className="w-3.5 h-3.5 text-amber-500" />
                <span>Ẩn Test Lab ({testAccountCount})</span>
              </span>
            </label>
          )}

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ROLE_ADMIN">Quản trị viên hệ thống</option>
              <option value="ROLE_WAREHOUSE_MANAGER">Trưởng kho / Quản lý</option>
              <option value="ROLE_OPERATOR">Thủ kho / Vận hành</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Bị tạm khóa</option>
              <option value="EXPIRED">Đã hết hạn hợp đồng</option>
            </select>
          </div>

          {/* Warehouse Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả chi nhánh kho</option>
              <option value="Tân Bình">Kho Tổng Tân Bình</option>
              <option value="VSIP">Kho VSIP Bắc Ninh</option>
              <option value="Miền Trung">Kho Vận Miền Trung</option>
              <option value="Sóng Thần">Kho Sóng Thần</option>
              <option value="Quy Nhơn">Kho Quy Nhơn</option>
            </select>
          </div>

          {/* RBAC Matrix Button (Chỉ dành cho Quản trị viên IT) */}
          {isAdmin && onOpenRbacMatrix && (
            <button
              onClick={onOpenRbacMatrix}
              title="Mở bảng ma trận phân quyền chi tiết hệ thống"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 transition-colors shadow-2xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ma Trận Phân Quyền</span>
            </button>
          )}

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            title="Xuất dữ liệu nhân sự ra file CSV"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>
          {csvNotice && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
              <Check className="w-3.5 h-3.5" />
              {csvNotice}
            </span>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar (Hiển thị khi Admin chọn ít nhất 1 tài khoản) */}
      {isAdmin && selectedIds.size > 0 && (
        <div className="p-3 bg-indigo-50/90 border-b border-indigo-200 flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-950 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-indigo-600" />
              Đã chọn <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full font-bold">{selectedIds.size}</span> tài khoản
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction(false)}
              disabled={isBulkLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Khóa toàn bộ tài khoản đã chọn"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Khóa Hàng Loạt</span>
            </button>
            <button
              onClick={() => handleBulkAction(true)}
              disabled={isBulkLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Mở khóa toàn bộ tài khoản đã chọn"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Mở Khóa Hàng Loạt</span>
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              disabled={isBulkLoading}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cards View (< md) */}
      <div className="block md:hidden">
        <UserMobileCards
          users={visibleUsers}
          onToggleStatus={onToggleStatus}
          onResetPassword={onResetPassword}
          onEditUser={onEditUser}
          onViewSecurityLog={onViewSecurityLog}
          onViewDetail={onViewDetail}
          isAdmin={isAdmin}
        />
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
            <tr>
              {isAdmin && (
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelectableChosen}
                    onChange={toggleSelectAll}
                    disabled={selectableUsers.length === 0}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="Chọn tất cả nhân sự hiển thị"
                  />
                </th>
              )}
              <th className="py-3 px-4">Tài Khoản & Thông Tin</th>
              <th className="py-3 px-4">Vai Trò</th>
              <th className="py-3 px-4">Kho Phụ Trách</th>
              <th className="py-3 px-4">Đăng Nhập Cuối</th>
              <th className="py-3 px-4 text-center">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="text-center py-10 text-slate-500">
                  <div className="flex flex-col items-center gap-2.5">
                    <span className="italic text-slate-400">
                      Không tìm thấy nhân viên nào khớp với điều kiện lọc.
                    </span>
                    <button
                      type="button"
                      onClick={handleResetAllFilters}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                    >
                      Đặt lại bộ lọc
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              visibleUsers.map((u) => {
                const initials = u.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(-2)
                  .join('');

                const isRootAdmin = u.username.toLowerCase() === 'admin';
                const isSelected = selectedIds.has(u.id);

                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {isAdmin && (
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(u.id)}
                          disabled={isRootAdmin}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                          title={
                            isRootAdmin
                              ? 'Không thể thao tác hàng loạt trên Quản trị viên tối cao'
                              : 'Chọn nhân sự này'
                          }
                        />
                      </td>
                    )}

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onViewDetail(u)}
                          className="w-9 h-9 rounded-xl bg-indigo-50 hover:bg-blue-100 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs transition-colors cursor-pointer"
                          title="Xem chi tiết hồ sơ nhân sự"
                        >
                          {initials}
                        </button>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onViewDetail(u)}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left cursor-pointer"
                              title="Xem chi tiết hồ sơ nhân sự"
                            >
                              {u.fullName}
                            </button>
                            {/* Test account tag */}
                            {u.isTestAccount && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full" title="Tài khoản phục vụ kiểm thử an ninh Brute-force">
                                🧪 Test Lab
                              </span>
                            )}
                            {/* Expiry Badge */}
                            {u.isExpired ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3 text-rose-600" /> Đã hết hạn
                              </span>
                            ) : u.expiresAt ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3 text-amber-600" /> Hạn: {u.expiresAt}
                              </span>
                            ) : null}
                          </div>
                          <div className="font-mono text-xs text-slate-500">
                            @{u.username} • {u.email}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">SĐT: {u.phone}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                    {/* Warehouse Access Scoping */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{u.primaryWarehouse || u.assignedWarehouse}</span>
                      </div>
                      {u.assignedWarehouses && u.assignedWarehouses.length > 1 && (
                        <div className="mt-1 flex items-center gap-1">
                          {u.assignedWarehouses.length >= 4 ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-md">
                              Toàn quốc (4 kho)
                            </span>
                          ) : (
                            <span
                              className="px-2 py-0.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md"
                              title={u.assignedWarehouses.join('\n')}
                            >
                              +{u.assignedWarehouses.length - 1} kho phụ
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Tạo: {u.createdAt}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        <span>{u.lastLoginAt}</span>
                      </div>
                      <div className="text-slate-400 mt-0.5">IP: {u.lastLoginIp}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getStatusBadge(u.status)}
                        {u.status === 'LOCKED' && u.lockReason && (
                          <button
                            type="button"
                            onClick={() => onViewDetail(u)}
                            className="text-[11px] text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 max-w-[150px] truncate block cursor-pointer transition-colors text-center"
                            title={`Lý do khóa: ${u.lockReason}\n(Bấm để xem chi tiết hồ sơ)`}
                          >
                            Lý do: {u.lockReason}
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewDetail(u)}
                          title="Xem chi tiết hồ sơ nhân sự & phân công kho"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200 text-xs font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>
                        <button
                          onClick={() => onViewSecurityLog(u)}
                          title="Xem phiên thiết bị PDA & kiểm toán an ninh"
                          className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors border border-sky-200 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => onEditUser(u)}
                              title="Chỉnh sửa thông tin nhân viên, vai trò & phân quyền kho"
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors border border-indigo-200 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {isRootAdmin ? (
                              <span
                                title="Quản trị viên đổi mật khẩu tại trang Hồ sơ cá nhân"
                                className="p-1.5 bg-slate-100 text-slate-400 rounded-lg border border-slate-200 cursor-not-allowed inline-flex"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <button
                                onClick={() => onResetPassword(u)}
                                title="Cấp lại mật khẩu mặc định (123456)"
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors border border-amber-200 cursor-pointer"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isRootAdmin ? (
                              <span
                                title="Tài khoản Quản trị viên tối cao (Bảo vệ không thể khóa)"
                                className="p-1.5 bg-slate-100 text-slate-400 rounded-lg border border-slate-200 cursor-not-allowed inline-flex"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <button
                                onClick={() => onToggleStatus(u)}
                                title={u.status === 'ACTIVE' ? 'Khóa tài khoản nhân sự' : 'Mở khóa hoạt động'}
                                className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                                  u.status === 'ACTIVE'
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {u.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalItems={filteredUsers.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />

      {/* Footer */}
      <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between font-mono">
        <div>
          Hiển thị <span className="text-slate-900 font-bold">{filteredUsers.length}</span> / {users.length} tài khoản
          {hideTestAccounts && testAccountCount > 0 && (
            <span className="text-slate-400 ml-2">(đã ẩn {testAccountCount} tài khoản test lab)</span>
          )}
        </div>
        {selectedIds.size > 0 && (
          <div className="text-indigo-600 font-bold">
            Đang chọn {selectedIds.size} tài khoản
          </div>
        )}
      </div>
    </div>
  );
};
