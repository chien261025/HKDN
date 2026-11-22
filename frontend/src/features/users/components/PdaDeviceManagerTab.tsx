import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BatteryCharging,
  Wifi,
  Trash2,
  Building2,
  Radio,
} from 'lucide-react';
import { pdaDeviceService, PdaDevice, PdaStatus } from '../services/pdaDeviceService';
import { DEFAULT_WAREHOUSES } from '../../masterdata/services/warehouseService';

export const PdaDeviceManagerTab: React.FC = () => {
  const [devices, setDevices] = useState<PdaDevice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PdaStatus>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal tạo thiết bị mới
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [deviceCode, setDeviceCode] = useState('');
  const [deviceType, setDeviceType] = useState<'PDA_HANDHELD' | 'DESKTOP_SCANNER' | 'MOBILE_APP'>('PDA_HANDHELD');
  const [targetWarehouseId, setTargetWarehouseId] = useState('WH04');
  const [assignedOperator, setAssignedOperator] = useState('');

  const loadDevices = () => {
    setDevices(pdaDeviceService.getAllDevices());
  };

  useEffect(() => {
    loadDevices();
    const handler = () => loadDevices();
    window.addEventListener('smart_wms_pda_devices_changed', handler);
    return () => window.removeEventListener('smart_wms_pda_devices_changed', handler);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprove = (id: string, name: string) => {
    pdaDeviceService.approveDevice(id);
    showToast(`Đã phê duyệt cấp quyền quét mã kho cho thiết bị: ${name}`);
  };

  const handleLock = (id: string, name: string) => {
    pdaDeviceService.lockDevice(id);
    showToast(`Đã thu hồi quyền truy cập quét mã của thiết bị: ${name}`);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa thiết bị ${name} khỏi danh sách tin cậy?`)) {
      pdaDeviceService.deleteDevice(id);
      showToast(`Đã xóa thiết bị: ${name}`);
    }
  };

  const handleCreateDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) {
      alert('Vui lòng nhập tên thiết bị!');
      return;
    }

    const wh = DEFAULT_WAREHOUSES.find((w) => w.code === targetWarehouseId);

    pdaDeviceService.createDevice({
      deviceName: deviceName.trim(),
      deviceCode: deviceCode.trim() || `PDA-${Math.floor(100 + Math.random() * 900)}`,
      deviceType,
      warehouseId: targetWarehouseId,
      warehouseName: wh ? wh.name : 'Kho Trung Chuyển Sóng Thần - Bình Dương',
      assignedOperator: assignedOperator.trim() || 'Chưa gán',
    });

    setIsCreateOpen(false);
    setDeviceName('');
    setDeviceCode('');
    setAssignedOperator('');
    showToast('Đã đăng ký thiết bị quét mã mới thành công!');
  };

  // Filter list
  const filteredDevices = devices.filter((d) => {
    const matchSearch =
      d.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.deviceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.assignedOperator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.ipAddress.includes(searchTerm);
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchWh = warehouseFilter === 'ALL' || d.warehouseId === warehouseFilter;
    return matchSearch && matchStatus && matchWh;
  });

  const totalCount = devices.length;
  const approvedCount = devices.filter((d) => d.status === 'APPROVED').length;
  const pendingCount = devices.filter((d) => d.status === 'PENDING').length;
  const lockedCount = devices.filter((d) => d.status === 'LOCKED').length;

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Tổng Thiết Bị PDA</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{totalCount}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Máy quét trong toàn hệ thống</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Đã Phê Duyệt</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">{approvedCount}</div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">Được phép quét mã vạch</span>
        </div>
        <div className={`rounded-2xl p-4 border shadow-xs transition-all ${
          pendingCount > 0 ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">Chờ Quản Lý Duyệt</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800 font-mono mt-1">{pendingCount}</div>
          <span className="text-[11px] text-amber-700 mt-0.5 block">
            {pendingCount > 0 ? 'Cần Quản lý duyệt trước khi quét' : 'Không có yêu cầu chờ'}
          </span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-red-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider block">Đã Khóa Truy Cập</span>
            <Lock className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-red-600 font-mono mt-1">{lockedCount}</div>
          <span className="text-[11px] text-red-500 mt-0.5 block">Chặn quét mã chống gian lận</span>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter & Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã PDA, tên máy, người cầm, IP..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="APPROVED">Đã phê duyệt</option>
            <option value="PENDING">Chờ phê duyệt</option>
            <option value="LOCKED">Đã khóa</option>
          </select>

          {/* Warehouse Filter */}
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Tất cả chi nhánh kho</option>
            {DEFAULT_WAREHOUSES.map((w) => (
              <option key={w.code} value={w.code}>
                {w.shortName || w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Device Button */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Đăng Ký Thiết Bị Mới</span>
        </button>
      </div>

      {/* Device Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Thiết Bị & Mã Máy</th>
                <th className="py-3 px-3">Chi Nhánh Kho & Người Phụ Trách</th>
                <th className="py-3 px-3">Địa Chỉ IP & MAC</th>
                <th className="py-3 px-3 text-center">Pin & Hoạt Động</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Không tìm thấy thiết bị quét mã nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => {
                  return (
                    <tr key={device.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Cột 1: Mã & Tên máy */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            device.deviceType === 'PDA_HANDHELD'
                              ? 'bg-blue-100 text-blue-700'
                              : device.deviceType === 'DESKTOP_SCANNER'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{device.deviceName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                                {device.deviceCode}
                              </span>
                              <span className="text-[10px] text-slate-400">• Đăng ký: {device.registeredAt}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Chi nhánh & Người phụ trách */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-800 block text-xs">{device.warehouseName}</span>
                        <span className="text-slate-500 text-[11px] block mt-0.5">
                          Cầm máy: <strong className="text-slate-700">{device.assignedOperator}</strong>
                        </span>
                      </td>

                      {/* Cột 3: IP & MAC */}
                      <td className="py-3.5 px-3 font-mono text-[11px]">
                        <div className="text-slate-800 font-bold">{device.ipAddress}</div>
                        <div className="text-slate-400 text-[10px]">{device.macAddress}</div>
                      </td>

                      {/* Cột 4: Pin & Hoạt động */}
                      <td className="py-3.5 px-3 text-center">
                        {device.batteryPercent !== undefined && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 font-mono">
                            <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{device.batteryPercent}%</span>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 block mt-0.5">{device.lastActive}</span>
                      </td>

                      {/* Cột 5: Trạng thái */}
                      <td className="py-3.5 px-3 text-center">
                        {device.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã Phê Duyệt
                          </span>
                        )}
                        {device.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Chờ Duyệt
                          </span>
                        )}
                        {device.status === 'LOCKED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                            <Lock className="w-3 h-3" />
                            Đã Khóa
                          </span>
                        )}
                      </td>

                      {/* Cột 6: Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {device.status === 'PENDING' && (
                            <button
                              data-testid="btn-approve-pda"
                              onClick={() => handleApprove(device.id, device.deviceName)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                              title="Phê duyệt cho phép quét mã"
                            >
                              Phê Duyệt
                            </button>
                          )}
                          {device.status === 'APPROVED' && (
                            <button
                              onClick={() => handleLock(device.id, device.deviceName)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Tạm khóa quyền quét mã"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}
                          {device.status === 'LOCKED' && (
                            <button
                              onClick={() => handleApprove(device.id, device.deviceName)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Mở khóa thiết bị"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(device.id, device.deviceName)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa thiết bị"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Đăng Ký Thiết Bị Mới */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleCreateDevice}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Đăng Ký Thiết Bị Quét Mã PDA Tin Cậy</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên Model / Thiết Bị *</label>
                <input
                  type="text"
                  required
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="VD: Honeywell ScanPal EDA52 hoặc Zebra TC21..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mã Thiết Bị (Device Code)</label>
                  <input
                    type="text"
                    value={deviceCode}
                    onChange={(e) => setDeviceCode(e.target.value)}
                    placeholder="VD: PDA-ST-03"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Loại Thiết Bị</label>
                  <select
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="PDA_HANDHELD">Máy PDA Cầm Tay Chuyên Dụng</option>
                    <option value="DESKTOP_SCANNER">Đầu Đọc Quét Để Bàn (Bàn Tiếp Nhận)</option>
                    <option value="MOBILE_APP">Điện Thoại Quét Mã Camera (App)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Chi Nhánh Kho Trực Thuộc</label>
                <select
                  value={targetWarehouseId}
                  onChange={(e) => setTargetWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {DEFAULT_WAREHOUSES.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nhân Sự Phụ Trách Cầm Máy</label>
                <input
                  type="text"
                  value={assignedOperator}
                  onChange={(e) => setAssignedOperator(e.target.value)}
                  placeholder="VD: Lê Thủ Kho (@operator01)..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Xác Nhận Đăng Ký
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

