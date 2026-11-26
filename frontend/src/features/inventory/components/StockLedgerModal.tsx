import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, FileText, CheckCircle2, ArrowRightLeft, ShieldCheck, RefreshCw } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { LedgerEntryData } from '../../labels/types';

export type { LedgerEntryData };

interface StockLedgerModalProps {
  entry: LedgerEntryData;
  onClose: () => void;
}

const getUom = (item: LedgerEntryData) => {
  const name = (item.productName || '').toLowerCase();
  const sku = (item.productSku || '').toLowerCase();
  if (name.includes('sữa') || sku.includes('milk')) return 'Hộp';
  if (name.includes('bia') || sku.includes('beer')) return 'Thùng';
  if (name.includes('omo') || name.includes('nước giặt') || sku.includes('omo')) return 'Túi';
  if (name.includes('điện thoại') || sku.includes('sams') || sku.includes('phone')) return 'Chiếc';
  if (name.includes('dầu ăn')) return 'Chai';
  if (name.includes('bánh')) return 'Gói';
  return 'SP';
};

export const StockLedgerModal: React.FC<StockLedgerModalProps> = ({ entry, onClose }) => {
  const [transferLegs, setTransferLegs] = useState<LedgerEntryData[]>([]);
  const [loadingLegs, setLoadingLegs] = useState(false);

  // Lắng nghe phím ESC để đóng modal thuận tiện
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Kích hoạt chế độ in chứng từ cách ly: chỉ in duy nhất phiếu này, ẩn toàn bộ trang nền
  useEffect(() => {
    document.body.classList.add('has-printable-voucher');
    return () => {
      document.body.classList.remove('has-printable-voucher');
    };
  }, []);

  useEffect(() => {
    if (entry.transactionType === 'TRANSFER' && entry.referenceCode) {
      setLoadingLegs(true);
      inventoryService.getLedgerByReference(entry.referenceCode)
        .then((legs) => {
          if (legs && legs.length > 0) {
            setTransferLegs(legs);
          } else {
            setTransferLegs([entry]);
          }
        })
        .catch(() => setTransferLegs([entry]))
        .finally(() => setLoadingLegs(false));
    } else {
      setTransferLegs([entry]);
    }
  }, [entry]);

  const getVoucherTitle = () => {
    switch (entry.transactionType) {
      case 'OUTBOUND':
        return 'PHIẾU XUẤT KHO';
      case 'INBOUND':
        return 'PHIẾU NHẬP KHO';
      case 'ADJUSTMENT':
        return 'BIÊN BẢN CÂN ĐỐI TỒN KHO';
      case 'INITIAL_BALANCE':
        return 'PHIẾU XÁC NHẬN SỐ DƯ ĐẦU KỲ';
      case 'TRANSFER':
        return 'PHIẾU ĐIỀU CHUYỂN NỘI BỘ';
      default:
        return 'CHỨNG TỪ THẺ KHO BIẾN ĐỘNG';
    }
  };

  const isTransfer = entry.transactionType === 'TRANSFER';
  const isSnapshot = entry.transactionType === 'INITIAL_BALANCE';
  const displayItems = isTransfer && transferLegs.length > 0 ? transferLegs : [entry];

  return createPortal(
    <div className="printable-voucher-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200 print:bg-white print:p-0 print:static print:block">
      <div className="printable-voucher bg-white rounded-2xl max-w-4xl lg:max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900 relative print:border-none print:shadow-none print:max-w-none print:w-full">
        
        {/* Enterprise Official Print Header (Chỉ hiển thị khi in ra giấy / PDF) */}
        <div className="hidden print:block mb-2 pb-1.5 border-b-2 border-slate-900">
          <div className="flex justify-between items-start text-xs leading-tight">
            <div>
              <p className="font-extrabold text-xs uppercase tracking-wide text-slate-900">
                TỔNG KHO VẬN SMART LOGISTICS VIỆT NAM
              </p>
              <p className="text-slate-600 text-[10px]">Kho Tổng Tân Bình - Lô A4, KCN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM</p>
              <p className="text-slate-600 text-[10px]">Hotline: 1900-8899 • Bộ phận Vận hành & Quản trị Kho WMS</p>
            </div>
            <div className="text-right font-mono">
              <p className="font-extrabold text-slate-900 text-xs">MẪU SỐ: 01-VT/WMS</p>
              <p className="text-slate-500 text-[9px]">(Ban hành theo TT 200/2014/TT-BTC)</p>
              <p className="text-indigo-800 font-bold text-[11px]">Mã GD: #{entry.id}</p>
            </div>
          </div>
          <div className="text-center mt-1.5">
            <h1 className="text-base font-black uppercase tracking-tight text-slate-900">
              {getVoucherTitle()}
            </h1>
            <p className="text-[10px] text-slate-600 italic">
              (Liên 1: Lưu hồ sơ sổ cái WMS • Liên 2: Giao người vận chuyển & thủ kho)
            </p>
          </div>
        </div>

        {/* Modal Header (Hiển thị trên màn hình máy tính) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/90 print:hidden">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl text-white flex items-center justify-center shadow-md ${
              isSnapshot ? 'bg-sky-600 shadow-sky-200' : isTransfer ? 'bg-blue-600 shadow-blue-200' : 'bg-slate-700 shadow-slate-200'
            }`}>
              {isTransfer ? <ArrowRightLeft className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
                  {getVoucherTitle()}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${
                    entry.transactionType === 'OUTBOUND'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : entry.transactionType === 'INBOUND'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : entry.transactionType === 'TRANSFER'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : entry.transactionType === 'INITIAL_BALANCE'
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {entry.transactionType === 'OUTBOUND'
                    ? 'Xuất Kho'
                    : entry.transactionType === 'INBOUND'
                    ? 'Nhập Kho'
                    : entry.transactionType === 'TRANSFER'
                    ? 'Điều Chuyển Ô Kệ'
                    : entry.transactionType === 'INITIAL_BALANCE'
                    ? 'Số Dư Ban Đầu'
                    : 'Cân Đối Kiểm Kê'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                Mã chứng từ: <strong className="text-blue-700 font-mono font-bold">#{entry.id}</strong> • Mã tham chiếu: <strong className="font-mono text-slate-900">{entry.referenceCode}</strong> • Thời gian: {entry.timestamp}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors border border-slate-200 print:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body-scroll p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          {/* Thông tin chung */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 print:bg-white p-3 rounded-xl border border-slate-200 print:border-slate-300 text-xs shadow-xs">
            <div>
              <span className="text-slate-500 block text-xs font-medium">Bút toán gốc:</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">#{entry.id}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">Mã Tham Chiếu:</span>
              <span className="font-mono font-bold text-blue-700 print:text-slate-900 text-sm mt-0.5 block">{entry.referenceCode}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">Người Thực Hiện:</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{entry.performedBy}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">Thời Gian Ghi Sổ:</span>
              <span className="font-mono font-medium text-slate-700 mt-0.5 block">{entry.timestamp}</span>
            </div>
          </div>

          {/* Bảng Chi Tiết Mặt Hàng & Các Vế Giao Dịch */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 print:bg-slate-900"></span>
                <span>Chi Tiết Bút Toán Sổ Cái ({displayItems.length} vế)</span>
              </span>
              {loadingLegs && (
                <span className="text-xs text-slate-500 flex items-center gap-1 print:hidden">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Đang tải vế đối ứng...
                </span>
              )}
            </h4>
            <div className="rounded-xl border border-slate-200 print:border-slate-400 overflow-x-auto shadow-xs print:overflow-visible">
              <table className="w-full text-left text-xs min-w-[720px] sm:min-w-0 print:min-w-0 border-collapse">
                <thead className="bg-slate-50/80 print:bg-slate-100 text-xs text-slate-600 font-semibold border-b border-slate-200 print:border-slate-400 uppercase tracking-wider print:text-[10px]">
                  <tr>
                    <th className="py-2 px-2.5 print:py-1 print:px-1.5 w-8 text-center print:border-r print:border-slate-300">STT</th>
                    <th className="py-2 px-2.5 print:py-1 print:px-1.5 min-w-[170px] print:min-w-0 print:border-r print:border-slate-300">Sản Phẩm & SKU</th>
                    <th className="py-2 px-2.5 print:py-1 print:px-1.5 min-w-[120px] print:min-w-0 whitespace-nowrap print:whitespace-normal print:border-r print:border-slate-300">Lô & HSD</th>
                    <th className="py-2 px-2.5 print:py-1 print:px-1.5 min-w-[130px] print:min-w-0 whitespace-nowrap print:whitespace-normal print:border-r print:border-slate-300">Vị Trí Ô Kệ</th>
                    <th className="py-2 px-2.5 print:py-1 print:px-1.5 text-center min-w-[90px] print:min-w-0 whitespace-nowrap print:whitespace-normal print:border-r print:border-slate-300">Biến Động (SL)</th>
                    <th className="py-2 px-2.5 print:py-1 print:px-1.5 text-center min-w-[85px] print:min-w-0 whitespace-nowrap print:whitespace-normal print:border-r print:border-slate-300">Tồn Trước</th>
                    <th className="py-2 px-2.5 print:py-1 print:px-1.5 text-center min-w-[85px] print:min-w-0 whitespace-nowrap print:whitespace-normal">Tồn Sau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-300 bg-white font-sans text-slate-800 print:text-[10.5px]">
                  {displayItems.map((item, idx) => {
                    const isMinus = item.qtyChange < 0;
                    const uom = getUom(item);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-2.5 print:py-1 print:px-1.5 text-center text-slate-500 font-mono text-xs print:text-[10px] print:border-r print:border-slate-300">{idx + 1}</td>
                        <td className="py-2 px-2.5 print:py-1 print:px-1.5 print:border-r print:border-slate-300">
                          <div className="font-semibold text-slate-900 text-xs print:text-[11px]">{item.productName}</div>
                          <div className="text-slate-500 font-mono text-[11px] print:text-[9px]">{item.productSku}</div>
                        </td>
                        <td className="py-2 px-2.5 print:py-1 print:px-1.5 font-mono text-xs print:text-[10px] whitespace-nowrap print:whitespace-normal print:border-r print:border-slate-300">
                          <div className="font-bold text-slate-800">{item.batchNumber}</div>
                          <div className="text-slate-500 text-[11px] print:text-[9px]">HSD: {item.expiryDate}</div>
                        </td>
                        <td className="py-2 px-2.5 print:py-1 print:px-1.5 font-mono text-xs print:text-[10px] whitespace-nowrap print:whitespace-normal print:border-r print:border-slate-300">
                          <span className="bg-slate-100 print:bg-transparent px-2 py-0.5 print:p-0 rounded-md border border-slate-200 print:border-none text-slate-800 font-bold text-[11px] print:text-[10px]">
                            {item.locationBarcode}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 print:py-1 print:px-1.5 text-center whitespace-nowrap print:whitespace-normal font-mono font-bold print:border-r print:border-slate-300 text-xs print:text-[10.5px]">
                          {isSnapshot ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] print:text-[10px] bg-sky-50 print:bg-transparent text-sky-700 print:text-slate-900 border border-sky-200 print:border-none">
                              0 {uom} (Xác nhận)
                            </span>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] print:text-[10px] print:border-none print:bg-transparent ${
                                isMinus
                                  ? 'bg-rose-50 text-rose-700 print:text-slate-900'
                                  : 'bg-emerald-50 text-emerald-700 print:text-slate-900'
                              }`}
                            >
                              {item.qtyChange > 0 ? `+${item.qtyChange}` : item.qtyChange} {uom}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 print:py-1 print:px-1.5 text-center font-mono text-slate-600 tabular-nums print:border-r print:border-slate-300 text-xs print:text-[10px]">
                          {item.balanceBefore.toLocaleString('vi-VN')} {uom}
                        </td>
                        <td className="py-2 px-2.5 print:py-1 print:px-1.5 text-center font-mono font-bold text-slate-900 tabular-nums text-xs print:text-[10px]">
                          {item.balanceAfter.toLocaleString('vi-VN')} {uom}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ghi chú */}
          <div className="p-2.5 rounded-xl bg-slate-50 print:bg-white border border-slate-200 print:border-slate-300 text-xs">
            <span className="text-slate-700 font-bold block text-[11px]">Ghi chú nghiệp vụ:</span>
            <p className="text-slate-800 mt-0.5 font-medium leading-relaxed">{entry.notes || 'Bút toán tự động ghi nhận vào sổ cái theo nguyên tắc Append-Only.'}</p>
          </div>

          {/* Dấu vết Bảo mật Bất biến & Chữ ký SHA-256 */}
          <div className="p-2.5 rounded-xl bg-emerald-50/70 print:bg-white border border-emerald-200 print:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-900">Sổ Cái Bất Biến (Append-Only Immutable Ledger)</span>
                <span className="block text-[11px] text-emerald-700">Chỉ đọc (Read-Only) — Nghiêm cấm chỉnh sửa hoặc xóa bỏ lịch sử</span>
              </div>
            </div>
            <div className="font-mono text-[11px] bg-white px-2.5 py-1 rounded-lg border border-emerald-200 text-slate-700 select-all">
              {entry.hashSignature || `SHA256:WMS-${entry.id}-${entry.referenceCode || 'LEDGER'}`}
            </div>
          </div>

          {/* Chữ Ký 3 Bên Hợp Chuẩn Vận Hành (Chỉ hiển thị khi in ra giấy / PDF) */}
          <div className="hidden print:block pt-3 border-t-2 border-slate-900 print:pt-2 print:mt-2">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-900 block uppercase tracking-wide">Người Lập Phiếu</span>
                <span className="text-[9px] text-slate-500 block italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-12 print:h-12 flex items-end justify-center">
                  <span className="text-[11px] font-bold text-slate-900 border-t border-dashed border-slate-400 pt-1 w-32 sm:w-36">
                    {entry.performedBy}
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-900 block uppercase tracking-wide">Thủ Kho / Giám Sát</span>
                <span className="text-[9px] text-slate-500 block italic">(Ký, đóng dấu, ghi rõ họ tên)</span>
                <div className="h-12 print:h-12 flex items-end justify-center">
                  <span className="text-[11px] font-bold text-slate-900 border-t border-dashed border-slate-400 pt-1 w-32 sm:w-36">
                    Quản Lý Kho WMS
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-900 block uppercase tracking-wide">Người Nhận / Vận Chuyển</span>
                <span className="text-[9px] text-slate-500 block italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-12 print:h-12 flex items-end justify-center">
                  <span className="text-[11px] font-medium text-slate-400 border-t border-dashed border-slate-400 pt-1 w-32 sm:w-36">
                    (Ký nhận)
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden print:block text-center mt-2 pt-1 border-t border-slate-200 text-[8.5px] text-slate-500 italic">
              Chứng từ điện tử trích xuất từ Hệ thống Quản trị Kho SMART WMS • Thời gian in: {new Date().toLocaleString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-bold border border-slate-300 transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>In Chứng Từ Này</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md shadow-blue-200"
          >
            Đóng Lại
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
