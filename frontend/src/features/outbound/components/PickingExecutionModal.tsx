import React, { useState, useMemo } from 'react';
import {
  X,
  PackageCheck,
  CheckCircle2,
  Printer,
  Navigation,
  Barcode,
  Layers,
  MapPin,
  Calendar,
  AlertCircle,
  Truck,
  ArrowRight,
  ShieldCheck,
  Check,
  User,
  UserCheck,
  Lock,
} from 'lucide-react';
import { OutboundOrder } from '../types';
import { printHtmlDocument } from '../../../services/printService';
import { getWarehouseDisplayName } from '../../masterdata/services/warehouseService';

interface PickingExecutionModalProps {
  order: OutboundOrder;
  onClose: () => void;
  onConfirmPicking: (orderId: string, payload?: any) => Promise<void>;
  onOpenPickPath?: (order: OutboundOrder) => void;
  isReadOnly?: boolean;
}

interface FlattenedPickLine {
  id: string;
  itemId: string;
  stepNumber: number;
  productId: number;
  productSku: string;
  productName: string;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  locationBarcode: string;
  qtyAllocated: number;
  qtyPicked: number;
  isCompleted: boolean;
}

const getOrderUnitLabel = (sku?: string, name?: string): string => {
  const text = `${sku || ''} ${name || ''}`.toLowerCase();
  if (text.includes('sữa') || text.includes('milk') || text.includes('yogurt')) return 'Hộp';
  if (text.includes('coca') || text.includes('bia') || text.includes('nước ngọt')) return 'Lon';
  if (text.includes('lavie') || text.includes('nước khoáng')) return 'Thùng';
  if (text.includes('samsung') || text.includes('điện thoại') || text.includes('laptop')) return 'Chiếc';
  if (text.includes('cà phê') || text.includes('g7')) return 'Hộp';
  return 'Thùng';
};

export const PickingExecutionModal: React.FC<PickingExecutionModalProps> = ({
  order,
  onClose,
  onConfirmPicking,
  onOpenPickPath,
  isReadOnly = false,
}) => {
  // Chuẩn bị danh sách dòng lấy hàng phẳng từ allocations
  const initialLines = useMemo<FlattenedPickLine[]>(() => {
    const list: FlattenedPickLine[] = [];
    let step = 1;

    (order.items || []).forEach((item) => {
      const unit = getOrderUnitLabel(item.sku, item.productName);
      if (item.allocations && item.allocations.length > 0) {
        item.allocations.forEach((alloc, aIdx) => {
          list.push({
            id: `${item.id}-${aIdx}`,
            itemId: item.id,
            stepNumber: step++,
            productId: item.productId,
            productSku: item.sku,
            productName: item.productName,
            unit,
            batchNumber: alloc.batchNumber,
            expiryDate: alloc.expiryDate,
            locationBarcode: alloc.locationBarcode,
            qtyAllocated: alloc.qtyAllocated,
            qtyPicked: item.pickedQty > 0 ? alloc.qtyAllocated : alloc.qtyAllocated,
            isCompleted: order.status === 'PICKING' || order.status === 'DISPATCHED',
          });
        });
      } else {
        // Fallback nếu chưa có allocations chi tiết
        list.push({
          id: `${item.id}-0`,
          itemId: item.id,
          stepNumber: step++,
          productId: item.productId,
          productSku: item.sku,
          productName: item.productName,
          unit,
          batchNumber: 'BATCH-DEFAULT',
          expiryDate: '2027-12-31',
          locationBarcode: 'WH01-ZA-A01-R01-S01-B01',
          qtyAllocated: item.requestedQty,
          qtyPicked: item.requestedQty,
          isCompleted: order.status === 'PICKING' || order.status === 'DISPATCHED',
        });
      }
    });

    return list;
  }, [order]);

  // Lấy thông tin tài khoản đang đăng nhập từ session để ràng buộc danh tính người nhặt
  const sessionUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('smart_wms_session');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }, []);

  const isOperator = sessionUser?.role === 'ROLE_OPERATOR';
  const isManager = sessionUser?.role === 'ROLE_WAREHOUSE_MANAGER' || sessionUser?.role === 'ROLE_ADMIN';

  // Danh mục nhân sự kho khả dụng khi Quản lý phân công điều phối
  const availablePickers = [
    { id: 'operator01', name: 'Lê Thủ Kho (Mã NV: OP-01, Trực ca PDA)' },
    { id: 'op_tuan', name: 'Nguyễn Văn Tuấn (Mã NV: WH-88, Kỹ thuật viên Kho)' },
    { id: 'op_hai', name: 'Nguyễn Văn Hải (Mã NV: OP-02, Xe nâng Reach Truck)' },
    { id: 'manager01', name: 'Trần Trưởng Kho (Mã NV: MGR-01, Điều phối trực tiếp)' },
  ];

  const defaultPicker = useMemo(() => {
    if (sessionUser?.fullName) {
      const roleLabel = isOperator ? 'Thủ kho quét mã' : 'Trưởng kho điều phối';
      const userCode = (sessionUser.username || 'WH').toUpperCase();
      return `${sessionUser.fullName} (Mã NV: ${userCode} - ${roleLabel})`;
    }
    return 'Lê Thủ Kho (Mã NV: OP-01, Trực ca PDA)';
  }, [sessionUser, isOperator]);

  const [lines, setLines] = useState<FlattenedPickLine[]>(initialLines);
  const [pickerName, setPickerName] = useState(defaultPicker);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalAllocated = lines.reduce((sum, l) => sum + l.qtyAllocated, 0);
  const totalPicked = lines.reduce((sum, l) => sum + (l.isCompleted ? l.qtyPicked : 0), 0);
  const progressPercent = totalAllocated > 0 ? Math.round((totalPicked / totalAllocated) * 100) : 0;
  const allPicked = lines.length > 0 && lines.every((l) => l.isCompleted);

  const handleToggleLine = (lineId: string) => {
    if (isReadOnly) return;
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, isCompleted: !l.isCompleted } : l))
    );
  };

  const handleQuickPickAll = () => {
    if (isReadOnly) return;
    setLines((prev) => prev.map((l) => ({ ...l, isCompleted: true, qtyPicked: l.qtyAllocated })));
  };

  const handleQuantityChange = (lineId: string, val: number) => {
    if (isReadOnly) return;
    setLines((prev) =>
      prev.map((l) => {
        if (l.id === lineId) {
          const clamped = Math.max(0, Math.min(l.qtyAllocated, val));
          return { ...l, qtyPicked: clamped, isCompleted: clamped === l.qtyAllocated };
        }
        return l;
      })
    );
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirmPicking(order.id, {
        pickerName,
        notes,
        items: lines.map((l) => ({
          orderItemId: parseInt(l.itemId, 10),
          pickedQty: l.qtyPicked,
        })),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const warehouseName = getWarehouseDisplayName(order.warehouseId);

  const handlePrintPickSlip = () => {
    const rowsHtml = lines.map((l, idx) => `
      <tr>
        <td class="text-center font-mono font-bold" style="color: #4338ca;">#${idx + 1}</td>
        <td class="font-mono font-bold">${l.locationBarcode}</td>
        <td class="font-mono" style="font-size: 10px;">${l.batchNumber}<br/><span style="color: #64748b;">HSD: ${l.expiryDate}</span></td>
        <td>
          <div class="font-bold">${l.productName}</div>
          <div class="font-mono" style="font-size: 10px; color: #64748b;">SKU: ${l.productSku}</div>
        </td>
        <td class="text-center">${l.unit}</td>
        <td class="text-right font-mono font-bold">${l.qtyAllocated.toLocaleString('vi-VN')}</td>
        <td class="text-right font-mono font-bold" style="color: #047857;">${l.qtyPicked.toLocaleString('vi-VN')}</td>
        <td class="text-center font-mono" style="font-size: 13px; color: #64748b;">${l.isCompleted ? '☑' : '[ &nbsp;&nbsp; ]'}</td>
      </tr>
    `).join('');

    const bodyHtml = `
      <div class="header">
        <div>
          <div class="header-sub">HỆ THỐNG QUẢN LÝ KHO THÔNG MINH - SMART WMS LOGISTICS</div>
          <div class="header-title">BẢNG KÊ LẤY HÀNG CHI TIẾT (PICK LIST)</div>
          <div class="header-date">${warehouseName} • Ngày lập: ${new Date().toLocaleString('vi-VN')}</div>
        </div>
        <div class="header-code-box">
          <div class="header-code-label">MÃ ĐƠN XUẤT (SO)</div>
          <div class="header-code-val">${order.soCode}</div>
          <div style="margin-top: 4px;">
            <span class="badge">TIÊU CHUẨN FEFO</span>
          </div>
        </div>
      </div>

      <div class="meta-grid">
        <div>
          <div class="meta-item"><span class="meta-label">Khách hàng nhận:</span> <span class="meta-value">${order.customerName}</span></div>
          <div class="meta-item"><span class="meta-label">Kho phụ trách:</span> <span class="meta-value">${warehouseName}</span></div>
          <div class="meta-item"><span class="meta-label">Nhân viên lấy hàng:</span> <span class="meta-value">${pickerName}</span></div>
        </div>
        <div>
          <div class="meta-item"><span class="meta-label">Tổng mặt hàng cần nhặt:</span> <span class="meta-value">${lines.length} mặt hàng</span></div>
          <div class="meta-item"><span class="meta-label">Tổng số lượng cấp phát:</span> <span class="meta-value" style="color: #4338ca;">${totalAllocated} đơn vị</span></div>
          <div class="meta-item"><span class="meta-label">Ghi chú vận chuyển:</span> <span class="meta-value">${notes || 'Đã đóng gói pallet chuẩn'}</span></div>
        </div>
      </div>

      <div class="section-title">
        <span>Danh Sách Vị Trí Ô Kệ & Hàng Hóa Cần Lấy (Theo Lộ Trình FEFO)</span>
        <span style="font-weight: normal; font-style: italic; font-size: 10px; color: #64748b;">* Quét Barcode ô kệ & mã sản phẩm trước khi bốc hàng</span>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 35px;">Bước</th>
            <th>Vị Trí Ô Kệ (Location Barcode)</th>
            <th>Số Lô (Hạn Dùng FEFO)</th>
            <th>Mặt Hàng & Mã SKU</th>
            <th class="text-center" style="width: 45px;">ĐVT</th>
            <th class="text-right" style="width: 65px;">SL Yêu Cầu</th>
            <th class="text-right" style="width: 65px;">SL Đã Nhặt</th>
            <th class="text-center" style="width: 65px;">Xác Nhận</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="background-color: #f8fafc; font-weight: 800;">
            <td colspan="5" class="text-right">TỔNG CỘNG SỐ LƯỢNG:</td>
            <td class="text-right font-mono" style="color: #4338ca;">${totalAllocated}</td>
            <td class="text-right font-mono" style="color: #047857;">${totalPicked}</td>
            <td class="text-center font-mono">${progressPercent}%</td>
          </tr>
        </tbody>
      </table>

      <div class="notice-box">
        <div style="font-weight: 700; color: #1e293b; margin-bottom: 2px;">Quy định đối với nhân viên lấy hàng:</div>
        <div>1. Phải quét đúng Location Barcode và kiểm tra hạn sử dụng in trên thùng trước khi bốc hàng.</div>
        <div>2. Khi hoàn tất toàn bộ danh sách, di chuyển pallet về Bàn QC để kiểm định và bàn giao xe vận chuyển.</div>
      </div>

      <div class="signatures">
        <div>
          <div class="sign-title">Người Lập Phiếu</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sign-space"></div>
        </div>
        <div>
          <div class="sign-title">Nhân Viên Lấy Hàng</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sign-space"></div>
        </div>
        <div>
          <div class="sign-title">Thủ Kho Xuất Hàng</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sign-space"></div>
        </div>
      </div>
    `;

    printHtmlDocument(`Bang-Ke-Lay-Hang-${order.soCode}`, bodyHtml);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900 relative max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Phiếu Lấy Hàng Theo Lộ Trình
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {order.soCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Khách hàng: <strong className="text-slate-800">{order.customerName}</strong> • {warehouseName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPickSlip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer"
              title="In phiếu nhặt hàng A4 cho nhân viên kho"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Phiếu Nhặt A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors border border-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto grow">
          {/* Print Only Header (Visible only when printing) */}
          <div className="hidden print:block text-center space-y-1 pb-4 border-b border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              HỆ THỐNG QUẢN LÝ KHO THÔNG MINH - SMART WMS LOGISTICS
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              BẢNG KÊ LẤY HÀNG CHI TIẾT (PICK LIST)
            </h1>
            <div className="text-xs text-slate-600 font-medium">
              Đơn xuất: <strong className="font-mono text-slate-900">{order.soCode}</strong> • Kho:{' '}
              {warehouseName} • Khách hàng: {order.customerName}
            </div>
          </div>

          {/* KPI Summary / Progress Bar */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="text-center sm:text-left">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Tiến Độ Lấy Hàng
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-amber-900 font-mono tabular-nums">
                    {totalPicked} / {totalAllocated}
                  </span>
                  <span className="text-xs font-bold text-amber-700">mặt hàng đã nhặt ({progressPercent}%)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {!isReadOnly && !allPicked && (
                <button
                  type="button"
                  onClick={handleQuickPickAll}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Nhặt Đủ Tất Cả</span>
                </button>
              )}
              {onOpenPickPath && (
                <button
                  type="button"
                  onClick={() => onOpenPickPath(order)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sơ Đồ Bản Đồ Lộ Trình</span>
                </button>
              )}
            </div>
          </div>

          {/* Instruction Note */}
          <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Hệ thống đã tự động cấp phát lô hàng cận hạn nhất theo <strong>thuật toán FEFO</strong> và
              sắp xếp lộ trình lấy hàng tối ưu từ tầng trệt đến tầng cao. Nhân viên kho vui lòng kiểm đếm
              đúng mã lô và quét vị trí ô kệ trước khi gom hàng về khu vực xuất.
            </p>
          </div>

          {/* Pick Lines Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">Bước</th>
                  <th className="py-2.5 px-3">Vị Trí Ô Kệ (Bin Barcode)</th>
                  <th className="py-2.5 px-3">Mặt Hàng (SKU)</th>
                  <th className="py-2.5 px-3">Lô Hàng & Hạn Dùng</th>
                  <th className="py-2.5 px-3 text-right">SL Cần Lấy</th>
                  <th className="py-2.5 px-3 text-center w-28">SL Thực Lấy</th>
                  <th className="py-2.5 px-3 text-center w-24">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((line) => (
                  <tr
                    key={line.id}
                    onClick={() => handleToggleLine(line.id)}
                    className={`transition-colors cursor-pointer select-none ${
                      line.isCompleted
                        ? 'bg-emerald-50/50 hover:bg-emerald-50/80'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3 text-center font-bold font-mono text-slate-700">
                      #{line.stepNumber}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {line.locationBarcode}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{line.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        SKU: {line.productSku} • ĐVT: {line.unit}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-800">{line.batchNumber}</div>
                      <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>HSD: {line.expiryDate}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                      {line.qtyAllocated}{' '}
                      <span className="text-[10px] font-normal text-slate-500">{line.unit}</span>
                    </td>

                    <td
                      className="py-3 px-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={line.qtyAllocated}
                          value={line.qtyPicked}
                          disabled={isReadOnly}
                          onChange={(e) =>
                            handleQuantityChange(line.id, parseInt(e.target.value || '0', 10))
                          }
                          className="w-16 px-2 py-1 text-center font-mono font-bold text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                        />
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => handleToggleLine(line.id)}
                          className={`p-1 rounded-lg border transition-all cursor-pointer ${
                            line.isCompleted
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-100 text-slate-400 border-slate-300 hover:text-emerald-600'
                          }`}
                          title="Đánh dấu đã nhặt đủ"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {line.isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Đã nhặt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Chờ nhặt
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Form Thông Tin Người Lấy Hàng & Ghi Chú */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 print:hidden">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nhân viên lấy hàng:</span>
                </label>
                {isOperator ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Đã xác thực danh tính PDA
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    <UserCheck className="w-3 h-3 text-indigo-600" />
                    Trưởng kho điều phối
                  </span>
                )}
              </div>

              {isOperator ? (
                // Nếu là Thủ kho (Operator): KHÓA CỨNG, tự động gắn tên phiên làm việc, chống gian lận KPI
                <div className="relative">
                  <input
                    type="text"
                    value={pickerName}
                    readOnly
                    disabled
                    aria-label="Nhân viên nhặt hàng"
                    className="w-full text-xs font-bold text-slate-800 bg-slate-100/90 px-3 py-2.5 rounded-xl border border-slate-300 cursor-not-allowed select-none shadow-2xs"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center gap-1 text-[10px] font-semibold">
                    <Lock className="w-3 h-3" />
                    <span>Ràng buộc phiên</span>
                  </div>
                </div>
              ) : (
                // Nếu là Quản lý (Manager/Admin): Cho phép chọn phân công đích danh nhân sự trong ca trực
                <select
                  value={pickerName}
                  onChange={(e) => setPickerName(e.target.value)}
                  disabled={isReadOnly || submitting}
                  aria-label="Nhân viên nhặt hàng"
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                >
                  <option value={defaultPicker}>★ Mặc định: {defaultPicker}</option>
                  {availablePickers.map((p) => (
                    <option key={p.id} value={p.name}>
                      👤 {p.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[10px] text-slate-500 mt-1">
                {isOperator
                  ? 'Tự động gắn với tài khoản đang đăng nhập.'
                  : 'Chọn nhân viên kho thực hiện lấy hàng cho đơn này.'}
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Ghi chú tình trạng gom hàng (Pallet / Seal):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Đã gom đủ vào pallet xuất số 02, tem niêm phong đạt chuẩn"
                disabled={isReadOnly || submitting}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
              <p className="text-[10px] text-slate-500 mt-1 italic">
                * Ghi chú mã pallet trung chuyển hoặc ghi chú niêm phong trước khi xuất ra cửa giao nhận.
              </p>
            </div>
          </div>

          {/* Chữ ký khi in (Visible only on Print) */}
          <div className="hidden print:grid grid-cols-3 gap-6 pt-12 text-center text-xs">
            <div>
              <p className="font-bold text-slate-900 uppercase">Người Lập Phiếu</p>
              <p className="text-[10px] text-slate-500 italic mt-1">(Ký, ghi rõ họ tên)</p>
            </div>
            <div>
              <p className="font-bold text-slate-900 uppercase">Nhân Viên Lấy Hàng</p>
              <p className="text-[10px] text-slate-500 italic mt-1">(Ký, ghi rõ họ tên)</p>
            </div>
            <div>
              <p className="font-bold text-slate-900 uppercase">Thủ Kho Xuất</p>
              <p className="text-[10px] text-slate-500 italic mt-1">(Ký, ghi rõ họ tên)</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between gap-3 print:hidden shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <button
                type="button"
                disabled={submitting || totalPicked === 0}
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-amber-200 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'Đang cập nhật...'
                    : allPicked
                    ? 'Xác Nhận Hoàn Tất Lấy Hàng'
                    : `Xác Nhận Gom Hàng (${totalPicked}/${totalAllocated})`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

