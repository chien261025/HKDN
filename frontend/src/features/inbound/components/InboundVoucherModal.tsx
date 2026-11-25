import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, FileText, CheckCircle2, Building2, Truck, ShieldCheck, AlertOctagon } from 'lucide-react';
import { InboundOrder } from '../types';
import { getWarehouseDisplayName } from '../../masterdata/services/warehouseService';

interface InboundVoucherModalProps {
  order: InboundOrder;
  onClose: () => void;
}

export const InboundVoucherModal: React.FC<InboundVoucherModalProps> = ({ order, onClose }) => {
  useEffect(() => {
    document.body.classList.add('has-printable-voucher');
    return () => {
      document.body.classList.remove('has-printable-voucher');
    };
  }, []);

  const totalExpected = order.items.reduce((sum, it) => sum + it.expectedQty, 0);
  const totalReceived = order.items.reduce((sum, it) => sum + (it.receivedQty || 0), 0);
  const totalRejected = order.items.reduce((sum, it) => sum + (it.rejectedQty || 0), 0);
  const totalStocked = order.items.reduce((sum, it) => sum + (it.stockedQty || 0), 0);
  const totalVal = order.totalValue || order.items.reduce((sum, it) => {
    const billableQty = (it.stockedQty || 0) > 0 ? it.stockedQty : Math.max(0, (it.receivedQty || 0) - (it.rejectedQty || 0));
    return sum + (billableQty * (it.unitPrice || 0));
  }, 0);

  const warehouseName = getWarehouseDisplayName(order.warehouseId);

  return createPortal(
    <div className="printable-voucher-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 print:bg-white print:p-0 print:static print:block">
      <div className="printable-voucher bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900 relative print:border-none print:shadow-none print:max-w-none print:w-full">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                Phiếu Nhập Kho & Biên Bản Tiếp Nhận (GRN)
              </h3>
              <p className="text-xs text-slate-500">
                Mã PO: <strong className="font-mono text-blue-700">{order.poCode}</strong> • {warehouseName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Phiếu A4</span>
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
        <div className="modal-body-scroll p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:space-y-3">
          {/* Header Tiêu Ngữ Chuẩn Doanh Nghiệp */}
          <div className="text-center space-y-1 pb-3 border-b-2 border-slate-900 print:pb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest print:text-[10px]">
              TỔNG KHO VẬN SMART LOGISTICS VIỆT NAM - SMART WMS ENTERPRISE
            </div>
            <h1 className="text-xl sm:text-2xl print:text-base font-black text-slate-900 tracking-tight uppercase">
              PHIẾU NHẬP KHO KIÊM BIÊN BẢN TIẾP NHẬN (GRN)
            </h1>
            <div className="text-xs text-slate-600 font-medium print:text-[10px]">
              Số: <strong className="font-mono text-slate-900">{order.poCode}</strong> • Ngày lập: {order.createdAt || order.expectedDeliveryDate}
            </div>
          </div>

          {/* Thông tin đơn nhập kho */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Nhà Cung Cấp:</span>
              <strong className="text-slate-900 text-xs sm:text-sm block mt-0.5">{order.supplierName}</strong>
              <span className="text-slate-500 font-mono text-[10px]">{order.supplierCode}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Chi Nhánh Kho Nhận:</span>
              <strong className="text-blue-800 text-xs sm:text-sm block mt-0.5">{warehouseName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Ngày Hẹn Giao:</span>
              <strong className="text-slate-900 font-mono text-xs block mt-0.5">{order.expectedDeliveryDate}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Trạng Thái Hiện Tại:</span>
              <span className="inline-block mt-0.5 font-bold text-xs uppercase px-2 py-0.5 rounded bg-white border border-slate-200">
                {order.status === 'STOCKED'
                  ? 'Đã Cất Kệ Xong'
                  : order.status === 'SHORT_CLOSED'
                  ? 'Đóng Đơn Sớm (Chốt Số Thực Nhận)'
                  : order.status === 'CLOSED_NO_STOCK'
                  ? 'Từ Chối Cổng & Trả Hàng (Zero Stock)'
                  : order.status === 'PARTIALLY_STOCKED'
                  ? 'Đã Cất Kệ 1 Phần'
                  : order.status === 'RECEIVED'
                  ? 'Đã Kiểm Đếm (Khu Đệm)'
                  : 'Chờ Xe Tải Đến'}
              </span>
            </div>
          </div>

          {/* Bảng Chi Tiết Mặt Hàng */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Chi Tiết Hàng Hóa Tiếp Nhận ({order.items.length} mặt hàng)</span>
              </h4>
              <span className="text-xs text-slate-500">Đơn vị tiền: VNĐ</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center whitespace-nowrap">STT</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Mặt Hàng & SKU</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">ĐVT</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Số Lượng Đặt</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Giao Tại Cổng</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Từ Chối / Trả Xe</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Thực Nhập Kho</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[110px]">Đơn Giá Nhập</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[125px]">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {order.items.map((it, idx) => {
                    const billableQty = (it.stockedQty || 0) > 0 ? it.stockedQty : Math.max(0, (it.receivedQty || 0) - (it.rejectedQty || 0));
                    const itemTotal = billableQty * (it.unitPrice || 0);
                    return (
                      <tr key={it.id || idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 text-center text-slate-500 font-mono whitespace-nowrap">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{it.productName}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            SKU: {it.sku}
                            {it.batchNumber && <span> • Lô: <strong>{it.batchNumber}</strong></span>}
                            {it.expiryDate && <span> • HSD: {it.expiryDate}</span>}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 whitespace-nowrap">{it.unit}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 tabular-nums whitespace-nowrap">
                          {it.expectedQty}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-700 tabular-nums whitespace-nowrap">
                          {it.receivedQty || 0}
                        </td>
                        <td className="py-2.5 px-3 text-center tabular-nums whitespace-nowrap">
                          {(it.rejectedQty || 0) > 0 ? (
                            <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200" title="Từ chối nhận tại cổng trả lại xe">
                              {it.rejectedQty}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                          {it.stockedQty || 0}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 tabular-nums whitespace-nowrap">
                          {(it.unitPrice || 0).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                          {itemTotal.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-xs text-slate-900">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider whitespace-nowrap">Tổng cộng:</td>
                    <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">{totalExpected}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-blue-700 whitespace-nowrap">{totalReceived}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-rose-700 whitespace-nowrap">{totalRejected}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-700 whitespace-nowrap">{totalStocked}</td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-sm whitespace-nowrap font-bold">
                      {totalVal.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Ghi chú & Đánh giá kiểm định */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <strong className="text-slate-700 block">Ghi chú đơn hàng:</strong>
              <p className="text-slate-600 leading-relaxed">{order.notes || 'Không có ghi chú bổ sung.'}</p>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1">
              <strong className="text-blue-900 block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Kết luận kiểm định chất lượng (QC Conclusion):</span>
              </strong>
              <p className="text-blue-950 leading-relaxed">
                {order.status === 'CLOSED_NO_STOCK' || (totalRejected === totalReceived && totalReceived > 0)
                  ? `Toàn bộ ${totalRejected} kiện hàng không đạt tiêu chuẩn tiếp nhận (ẩm mốc, hư hỏng vật lý hoặc sai lệch hợp đồng). Bộ phận QC đã lập biên bản từ chối tiếp nhận toàn bộ (Zero Stock) và bàn giao trả lại xe cho tài xế chở về NCC. Đơn hàng kết thúc đóng, không phát sinh công nợ (0 VNĐ).`
                  : order.status === 'SHORT_CLOSED'
                  ? `Nhà cung cấp xác nhận không giao bù phần còn thiếu. Kho đã chốt đóng đơn sớm theo số lượng thực nhập ${totalStocked} sản phẩm.`
                  : totalRejected > 0
                  ? order.notes && (order.notes.includes('VUOT_DUNG_SAI_PO') || order.notes.includes('vượt dung sai') || order.notes.includes('Vượt dung sai'))
                    ? `Phát hiện ${totalRejected} sản phẩm vượt dung sai hợp đồng PO (+10%). Kho đã lập biên bản từ chối tiếp nhận và bàn giao trả lại xe cho tài xế chở về ngay tại cổng kiểm soát. Số lượng đạt chuẩn ${totalStocked || (totalReceived - totalRejected)} sản phẩm được chấp thuận nhập kho.`
                    : `Phát hiện ${totalRejected} sản phẩm không đạt chuẩn chất lượng / bao bì móp méo. Đã lập biên bản giữ lại tại khu cách ly kiểm định hoặc trả về nhà cung cấp.`
                  : totalReceived === totalExpected && totalExpected > 0
                  ? 'Hàng hóa nguyên đai nguyên kiện, tem nhãn đầy đủ, đạt 100% tiêu chuẩn nhập kho an toàn.'
                  : 'Đang theo dõi tiếp nhận theo kế hoạch giao hàng.'}
              </p>
            </div>
          </div>

          {/* Chữ ký 4 bên chuẩn mực */}
          <div className="pt-4 border-t-2 border-slate-900 print:pt-2 print:mt-2">
            <div className="grid grid-cols-4 gap-3 text-center text-xs print:text-[10px]">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 block">Đại Diện Giao Hàng (Lái Xe)</span>
                <span className="text-[10px] text-slate-400 block italic">(Ký nhận đủ / nhận hàng trả về)</span>
                <div className="h-12 print:h-12 flex items-end justify-center">
                  <span className="font-bold text-slate-800 border-t border-dashed border-slate-400 pt-1 w-28 text-[10px]">
                    Nguyễn Văn Lái Xe
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 block">Nhân Viên QC</span>
                <span className="text-[10px] text-slate-400 block italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-12 print:h-12 flex items-end justify-center">
                  <span className="font-bold text-slate-900 border-t border-dashed border-slate-400 pt-1 w-24 text-[10px]">
                    Lê Kiểm Định
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 block">Thủ Kho Nhận Hàng</span>
                <span className="text-[10px] text-slate-400 block italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-12 print:h-12 flex items-end justify-center">
                  <span className="font-bold text-slate-900 border-t border-dashed border-slate-400 pt-1 w-24 text-[10px]">
                    Trần Trưởng Kho
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 block">Kế Toán / Quản Lý Kho</span>
                <span className="text-[10px] text-slate-400 block italic">(Ký, đóng dấu)</span>
                <div className="h-12 print:h-12 flex items-end justify-center">
                  <span className="font-bold text-slate-900 border-t border-dashed border-slate-400 pt-1 w-24 text-[10px]">
                    Đã Phê Duyệt
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center mt-3 pt-2 border-t border-slate-200 text-[10px] print:text-[8.5px] text-slate-500 italic">
              Chứng từ điện tử trích xuất từ Hệ thống Quản trị Kho SMART WMS • Thời gian in: {new Date().toLocaleString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>In Bản Cứng</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng Lại
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

