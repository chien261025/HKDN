import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Clock,
  SunMedium,
  Sun,
  Moon,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  Send,
  Building2,
  Calendar,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  warehouseShiftService,
  WarehouseShift,
  ShiftHandoverEntry,
  DEFAULT_WAREHOUSE_SHIFTS,
} from '../services/warehouseShiftService';
import { authService } from '../../auth/services/authService';

interface WarehouseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWarehouseName?: string;
  activeWarehouseId?: string;
}

export const WarehouseShiftModal: React.FC<WarehouseShiftModalProps> = ({
  isOpen,
  onClose,
  activeWarehouseName = 'Kho Trung Chuyển Sóng Thần - Bình Dương',
  activeWarehouseId = 'WH04',
}) => {
  const [activeTab, setActiveTab] = useState<'CURRENT' | 'HANDOVER' | 'CONFIG'>('CURRENT');
  const [currentShift, setCurrentShift] = useState<WarehouseShift>(warehouseShiftService.getCurrentShift());
  const [handoverLogs, setHandoverLogs] = useState<ShiftHandoverEntry[]>([]);
  const [isCreatingHandover, setIsCreatingHandover] = useState(false);

  // Form bàn giao ca
  const session = authService.getCurrentSession();
  const [handoverNotes, setHandoverNotes] = useState('');
  const [pendingTasks, setPendingTasks] = useState('');
  const [inboundCompleted, setInboundCompleted] = useState<number>(3);
  const [outboundCompleted, setOutboundCompleted] = useState<number>(5);
  const [openIssues, setOpenIssues] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentShift(warehouseShiftService.getCurrentShift());
      setHandoverLogs(warehouseShiftService.getHandoverLogs(activeWarehouseId));
    }
  }, [isOpen, activeWarehouseId]);

  if (!isOpen) return null;

  const handleSaveHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverNotes.trim()) {
      alert('Vui lòng điền nội dung tổng kết bàn giao ca!');
      return;
    }

    warehouseShiftService.saveHandoverEntry({
      shiftCode: currentShift.code,
      shiftName: `${currentShift.name} (${currentShift.startTime} - ${currentShift.endTime})`,
      warehouseId: activeWarehouseId,
      warehouseName: activeWarehouseName,
      leaderName: session?.fullName || 'Trần Trưởng Kho',
      leaderRole: session?.role === 'ROLE_OPERATOR' ? 'Nhân Viên Trực Ca' : 'Trưởng Ca Trực',
      inboundCompleted,
      outboundCompleted,
      openIssues,
      handoverNotes: handoverNotes.trim(),
      pendingTasks: pendingTasks.trim(),
    });

    setHandoverLogs(warehouseShiftService.getHandoverLogs(activeWarehouseId));
    setIsCreatingHandover(false);
    setHandoverNotes('');
    setPendingTasks('');
    setToastMessage('Đã lập biên bản giao ban ca trực thành công!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getShiftIcon = (code: string) => {
    switch (code) {
      case 'CA_SANG':
        return <SunMedium className="w-5 h-5 text-emerald-600" />;
      case 'CA_CHIEU':
        return <Sun className="w-5 h-5 text-amber-600" />;
      case 'CA_DEM':
      default:
        return <Moon className="w-5 h-5 text-indigo-600" />;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200 ring-4 ring-blue-50">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Quản Lý Ca Làm Việc & Bàn Giao Ca Kho</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  <Building2 className="w-3 h-3" />
                  {activeWarehouseName}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Quy trình 3 ca chuẩn logistics: Ghi nhận chứng từ theo ca trực và sổ giao ban đối soát hàng hóa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 border-b border-slate-200 bg-white flex gap-2 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('CURRENT')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'CURRENT'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Ca Trực Hiện Tại</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>
          <button
            data-testid="tab-handover"
            onClick={() => setActiveTab('HANDOVER')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'HANDOVER'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Sổ Bàn Giao Ca ({handoverLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('CONFIG')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'CONFIG'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Định Nghĩa 3 Ca Kho</span>
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {/* TAB 1: CA TRỰC HIỆN TẠI */}
          {activeTab === 'CURRENT' && (
            <div className="space-y-6">
              {/* Highlight Active Shift Card */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>HỆ THỐNG ĐANG TRONG CA HOẠT ĐỘNG</span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                      {currentShift.name} ({currentShift.startTime} - {currentShift.endTime})
                    </h3>
                    <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
                      {currentShift.description}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center shrink-0">
                    <span className="text-[11px] text-blue-200 uppercase font-semibold block">Trưởng ca trực</span>
                    <span className="text-base font-bold text-white block mt-0.5">
                      {session?.fullName || 'Trần Trưởng Kho'}
                    </span>
                    <span className="text-[10px] text-emerald-300 font-medium block">Đang online tại kho</span>
                  </div>
                </div>

                {/* Live Shift Metrics */}
                <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/20">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <span className="text-xs text-blue-100 font-medium block">Đơn Nhập Trong Ca</span>
                    <span className="text-xl font-extrabold text-white font-mono mt-0.5 block">4 Đơn PO</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <span className="text-xs text-blue-100 font-medium block">Đơn Xuất Đã Lấy Hàng</span>
                    <span className="text-xl font-extrabold text-white font-mono mt-0.5 block">6 Đơn SO</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <span className="text-xs text-blue-100 font-medium block">Thiết Bị PDA Đang Quét</span>
                    <span className="text-xl font-extrabold text-emerald-300 font-mono mt-0.5 block">3 Máy Active</span>
                  </div>
                </div>
              </div>

              {/* 3 Shifts Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Lịch 3 Ca Vận Hành Trong Ngày
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {DEFAULT_WAREHOUSE_SHIFTS.map((shift) => {
                    const isActive = shift.code === currentShift.code;
                    return (
                      <div
                        key={shift.id}
                        className={`rounded-2xl p-4 border transition-all ${
                          isActive
                            ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-100'
                            : 'bg-white/80 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getShiftIcon(shift.code)}
                            <span className="font-bold text-slate-900 text-sm">{shift.name}</span>
                          </div>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                              Hiện tại
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-sm font-extrabold text-slate-700">
                          {shift.startTime} — {shift.endTime}
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          {shift.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setActiveTab('HANDOVER');
                    setIsCreatingHandover(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-200 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Lập Biên Bản Bàn Giao Ca Trực</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SỔ BÀN GIAO CA */}
          {activeTab === 'HANDOVER' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Sổ Giao Ban Ca Trực & Đối Soát Kho</h3>
                  <p className="text-xs text-slate-500">
                    Lưu vết trách nhiệm giữa các ca: khối lượng hàng đã xử lý, tồn đọng và lưu ý cho ca kế tiếp
                  </p>
                </div>
                {!isCreatingHandover && (
                  <button
                    onClick={() => setIsCreatingHandover(true)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lập Biên Bản Ca Mới</span>
                  </button>
                )}
              </div>

              {/* Form Lập Biên Bản Ca Mới */}
              {isCreatingHandover && (
                <form
                  onSubmit={handleSaveHandover}
                  className="bg-white rounded-2xl p-5 border-2 border-blue-200 shadow-md space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h4 className="font-bold text-slate-900 text-sm">
                        Biên Bản Bàn Giao: {currentShift.name} ({currentShift.startTime} - {currentShift.endTime})
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreatingHandover(false)}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                    >
                      Hủy bỏ
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Số Đơn Nhập Đã Hoàn Tất
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={inboundCompleted}
                        onChange={(e) => setInboundCompleted(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Số Đơn Xuất Đã Lấy Hàng
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={outboundCompleted}
                        onChange={(e) => setOutboundCompleted(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Sự Cố Kho / Lỗi Phát Sinh
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={openIssues}
                        onChange={(e) => setOpenIssues(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-amber-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Tổng Kết Công Việc Trong Ca *
                    </label>
                    <textarea
                      rows={2}
                      value={handoverNotes}
                      onChange={(e) => setHandoverNotes(e.target.value)}
                      placeholder="VD: Đã hoàn tất tiếp nhận 2 xe tải Vinamilk, các pallet đã được cất kệ an toàn vào Zone B..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Lưu Ý & Nhiệm Vụ Bàn Giao Cho Ca Tiếp Theo
                    </label>
                    <textarea
                      rows={2}
                      value={pendingTasks}
                      onChange={(e) => setPendingTasks(e.target.value)}
                      placeholder="VD: Ca chiều lưu ý có 1 đơn xuất gấp 150 thùng sữa TH True Milk đi Đà Nẵng lúc 15:30..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-blue-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingHandover(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ký Biên Bản & Gửi Bàn Giao</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Danh Sách Lịch Sử Biên Bản Giao Ban */}
              <div className="space-y-3">
                {handoverLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-slate-900 text-sm">{log.shiftName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          {log.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{log.timestamp}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">{log.leaderName} ({log.leaderRole})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-3">
                      <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2 text-center">
                        <span className="text-[10px] font-semibold text-emerald-800 block">Đơn Nhập Hoàn Tất</span>
                        <span className="text-sm font-bold text-emerald-700 font-mono">{log.inboundCompleted}</span>
                      </div>
                      <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-2 text-center">
                        <span className="text-[10px] font-semibold text-blue-800 block">Đơn Xuất Đã Lấy Hàng</span>
                        <span className="text-sm font-bold text-blue-700 font-mono">{log.outboundCompleted}</span>
                      </div>
                      <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2 text-center">
                        <span className="text-[10px] font-semibold text-amber-800 block">Sự Cố Ghi Nhận</span>
                        <span className="text-sm font-bold text-amber-700 font-mono">{log.openIssues}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="font-bold text-slate-700">Tổng kết: </span>
                        <span className="text-slate-600">{log.handoverNotes}</span>
                      </div>
                      {log.pendingTasks && (
                        <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-100">
                          <span className="font-bold text-amber-800">⚠️ Bàn giao ca sau: </span>
                          <span className="text-amber-900">{log.pendingTasks}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ĐỊNH NGHĨA 3 CA KHO */}
          {activeTab === 'CONFIG' && (
            <div className="space-y-4">
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80 text-xs text-blue-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  Quy định phân ca vận hành tiêu chuẩn ngành kho vận:
                </div>
                <p>
                  Mọi chứng từ phát sinh trong thời gian ca trực (Đơn nhập xe tải, Lệnh lấy hàng Picking, Biên bản kiểm kê) 
                  sẽ tự động gắn kèm mã ca và tài khoản nhân sự đang phụ trách.
                </p>
              </div>

              <div className="space-y-3">
                {DEFAULT_WAREHOUSE_SHIFTS.map((shift, idx) => (
                  <div key={shift.id} className="bg-white rounded-xl p-4 border border-slate-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{shift.name}</span>
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          {shift.startTime} - {shift.endTime}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{shift.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Trực ca tự động theo giờ hệ thống (Việt Nam UTC+7)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

