import React from 'react';
import { Printer, X, FileText, CheckCircle2, Building2, Truck, ShieldCheck, MapPin, Calendar, User, Package } from 'lucide-react';
import { OutboundOrder } from '../types';
import { printHtmlDocument } from '../../../services/printService';
import { getWarehouseDisplayName, getWarehouseDisplayAddress } from '../../masterdata/services/warehouseService';

interface OutboundVoucherModalProps {
  order: OutboundOrder;
  onClose: () => void;
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

const getEstimatedPrice = (sku?: string): number => {
  if (!sku) return 150000;
  if (sku.includes('SAMS') || sku.includes('PHONE')) return 22900000;
  if (sku.includes('MILK') || sku.includes('YOGURT')) return 320000;
  if (sku.includes('COCA') || sku.includes('BEER')) return 195000;
  if (sku.includes('WATER') || sku.includes('LAVIE')) return 92000;
  if (sku.includes('G7') || sku.includes('COFFEE')) return 58000;
  return 150000;
};

export const OutboundVoucherModal: React.FC<OutboundVoucherModalProps> = ({ order, onClose }) => {
  const totalRequested = order.items.reduce((sum, it) => sum + it.requestedQty, 0);
  const totalAllocated = order.items.reduce((sum, it) => sum + (it.allocatedQty || 0), 0);
  const totalPicked = order.items.reduce((sum, it) => sum + (it.pickedQty || it.allocatedQty || 0), 0);

  const warehouseName = getWarehouseDisplayName(order.warehouseId);
  const warehouseAddress = getWarehouseDisplayAddress(order.warehouseId) || 'Khu công nghiệp logistics tập trung';

  // Tính tổng giá trị ước tính
  const totalValue = order.items.reduce((sum, it) => {
    const price = getEstimatedPrice(it.sku);
    return sum + (it.allocatedQty || it.requestedQty) * price;
  }, 0);

  const handlePrintGIN = () => {
    const rowsHtml = order.items.map((item, idx) => {
      const unit = getOrderUnitLabel(item.sku, item.productName);
      const alloc = (item.allocations && item.allocations[0]) || {
        batchNumber: 'LOT-2026-X1',
        expiryDate: '2027-12-31',
        locationBarcode: 'WH01-ZA-A01-R01-S01-B01',
      };
      const qty = item.allocatedQty || item.requestedQty;
      const price = getEstimatedPrice(item.sku);
      const subtotal = qty * price;

      return `
        <tr>
          <td class="text-center font-mono font-bold" style="color: #4338ca;">${idx + 1}</td>
          <td class="font-mono font-bold">${item.sku}</td>
          <td class="font-bold">${item.productName}</td>
          <td class="text-center">${unit}</td>
          <td class="font-mono" style="font-size: 10px;">${alloc.batchNumber} (${alloc.expiryDate})</td>
          <td class="font-mono text-center" style="font-size: 10px;">${alloc.locationBarcode}</td>
          <td class="text-right font-mono font-bold" style="color: #047857;">${qty.toLocaleString('vi-VN')}</td>
          <td class="text-right font-mono">${price.toLocaleString('vi-VN')} đ</td>
          <td class="text-right font-mono font-bold">${subtotal.toLocaleString('vi-VN')} đ</td>
        </tr>
      `;
    }).join('');

    const bodyHtml = `
      <div style="text-align: center; margin-bottom: 16px; border-bottom: 2px solid #0f172a; padding-bottom: 12px;">
        <div style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div style="font-size: 10px; font-style: italic; color: #64748b; margin-bottom: 4px;">Độc lập - Tự do - Hạnh phúc</div>
        <div style="font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase;">HỆ THỐNG QUẢN LÝ KHO THÔNG MINH - SMART WMS LOGISTICS ENTERPRISE</div>
        <div style="font-size: 20px; font-weight: 900; text-transform: uppercase; margin-top: 4px; color: #0f172a;">PHIẾU XUẤT KHO KIÊM BIÊN BẢN BÀN GIAO VẬN TẢI</div>
        <div style="font-size: 11px; font-style: italic; color: #64748b;">(GOODS ISSUE NOTE & DELIVERY RECEIPT - GIN)</div>
        <div style="font-size: 11px; color: #334155; margin-top: 4px;">
          Số Phiếu: <strong style="font-family: monospace; color: #1d4ed8;">GIN-${order.soCode}</strong> • Ngày lập: <strong>${new Date().toLocaleDateString('vi-VN')}</strong>
        </div>
      </div>

      <div class="meta-grid">
        <div>
          <div class="meta-item"><span class="meta-label">Đơn vị xuất kho:</span> <span class="meta-value">${warehouseName}</span></div>
          <div class="meta-item"><span class="meta-label">Địa chỉ kho:</span> <span class="meta-value">${warehouseAddress}</span></div>
          <div class="meta-item"><span class="meta-label">Thủ kho phụ trách:</span> <span class="meta-value">Nguyễn Văn Tuấn (Mã NV: WH-88)</span></div>
          <div class="meta-item"><span class="meta-label">Căn cứ đơn hàng:</span> <span class="meta-value" style="font-family: monospace; color: #4338ca;">SO Code: ${order.soCode}</span></div>
        </div>
        <div>
          <div class="meta-item"><span class="meta-label">Đơn vị nhận hàng:</span> <span class="meta-value">${order.customerName}</span></div>
          <div class="meta-item"><span class="meta-label">Địa chỉ giao:</span> <span class="meta-value">${order.shippingAddress || 'Kho Phân Phối Trung Tâm'}</span></div>
          <div class="meta-item"><span class="meta-label">Đơn vị vận chuyển:</span> <span class="meta-value">${order.dispatchCarrier || 'Đội xe nội bộ WMS Logistics'}</span></div>
          <div class="meta-item"><span class="meta-label">Thời gian xuất kho:</span> <span class="meta-value">${order.requiredDate || '2026-11-30 18:00'}</span></div>
        </div>
      </div>

      <div class="section-title">
        <span>Danh Sách Hàng Hóa Xuất Kho & Bàn Giao Xe Vận Tải</span>
        <span style="font-weight: normal; font-style: italic; font-size: 10px; color: #64748b;">* Đã kiểm định QC & quét mã vạch niêm phong</span>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 35px;">STT</th>
            <th>Mã SKU</th>
            <th>Tên Sản Phẩm</th>
            <th class="text-center" style="width: 50px;">ĐVT</th>
            <th>Số Lô (Hạn Dùng)</th>
            <th class="text-center">Vị Trí Ô Kệ</th>
            <th class="text-right" style="width: 65px;">SL Xuất</th>
            <th class="text-right" style="width: 90px;">Đơn Giá</th>
            <th class="text-right" style="width: 100px;">Thành Tiền</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="background-color: #f8fafc; font-weight: 800;">
            <td colspan="6" class="text-right">TỔNG CỘNG HÀNG XUẤT:</td>
            <td class="text-right font-mono" style="color: #047857;">${(totalAllocated || totalRequested).toLocaleString('vi-VN')}</td>
            <td></td>
            <td class="text-right font-mono" style="color: #b45309; font-size: 12px;">${totalValue.toLocaleString('vi-VN')} đ</td>
          </tr>
        </tbody>
      </table>

      <div class="notice-box">
        <div style="font-weight: 700; color: #1e293b; margin-bottom: 2px;">Ghi chú & Cam kết trách nhiệm giao nhận:</div>
        <div>- Hàng hóa xuất kho nguyên đai nguyên kiện, tem niêm phong đạt chuẩn kiểm định QC, đúng hạn sử dụng (FEFO).</div>
        <div>- Đại diện lái xe và khách hàng có trách nhiệm đồng kiểm số lượng thực tế trước khi xe rời bãi xuất hàng.</div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; text-align: center; margin-top: 24px; page-break-inside: avoid;">
        <div>
          <div class="sign-title">Người Lập Phiếu</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sign-space"></div>
        </div>
        <div>
          <div class="sign-title">Thủ Kho Xuất</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sign-space"></div>
        </div>
        <div>
          <div class="sign-title">Lái Xe Vận Chuyển</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sign-space"></div>
        </div>
        <div>
          <div class="sign-title">Đại Diện Khách Hàng</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sign-space"></div>
        </div>
      </div>
    `;

    printHtmlDocument(`Phieu-Xuat-Kho-GIN-${order.soCode}`, bodyHtml);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900 relative max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                Phiếu Xuất Kho & Biên Bản Bàn Giao Vận Tải (GIN)
              </h3>
              <p className="text-xs text-slate-500">
                Mã SO: <strong className="font-mono text-blue-700">{order.soCode}</strong> • {warehouseName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintGIN}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
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
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto grow print:max-h-none print:overflow-visible">
          {/* Header Tiêu Ngữ Chuẩn Doanh Nghiệp */}
          <div className="text-center space-y-1 pb-4 border-b border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="text-[10px] font-medium text-slate-500 italic pb-1">
              Độc lập - Tự do - Hạnh phúc
            </div>
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              HỆ THỐNG QUẢN LÝ KHO THÔNG MINH - SMART WMS LOGISTICS ENTERPRISE
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase pt-1">
              PHIẾU XUẤT KHO KIÊM BIÊN BẢN BÀN GIAO VẬN TẢI
            </h1>
            <div className="text-xs text-slate-500 italic">
              (GOODS ISSUE NOTE & DELIVERY RECEIPT - GIN)
            </div>
            <div className="text-xs text-slate-700 font-medium pt-1">
              Số chứng từ: <strong className="font-mono text-blue-800">GIN-{order.soCode}</strong> • Ngày lập: {order.orderDate || new Date().toLocaleDateString('vi-VN')}
            </div>
          </div>

          {/* Thông tin đơn vị xuất và nhận */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-blue-800 font-bold uppercase tracking-wider text-[11px]">
                <Building2 className="w-3.5 h-3.5" />
                <span>ĐƠN VỊ XUẤT KHO:</span>
              </div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">{warehouseName}</div>
              <div className="text-slate-600">Địa chỉ: {warehouseAddress}</div>
              <div className="text-slate-600 font-mono text-[11px]">
                Mã định danh kho: <strong>WH-0{order.warehouseId || 1}</strong>
              </div>
            </div>

            <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
              <div className="flex items-center gap-1.5 text-blue-800 font-bold uppercase tracking-wider text-[11px]">
                <Truck className="w-3.5 h-3.5" />
                <span>ĐƠN VỊ TIẾP NHẬN & VẬN TẢI:</span>
              </div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">{order.customerName}</div>
              <div className="text-slate-600">Địa chỉ nhận: {order.shippingAddress || 'Kho Phân Phối Chuỗi Hệ Thống'}</div>
              <div className="text-slate-600 flex items-center gap-3">
                <span>Đội xe: <strong>{order.dispatchCarrier || 'WMS Express Logistics'}</strong></span>
                <span>Biển số: <strong className="font-mono text-slate-900">51C-892.44</strong></span>
              </div>
            </div>
          </div>

          {/* Bảng Chi Tiết Mặt Hàng Xuất Kho */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">STT</th>
                  <th className="py-2.5 px-3">Mã SKU</th>
                  <th className="py-2.5 px-3">Tên Hàng Hóa</th>
                  <th className="py-2.5 px-3 text-center">ĐVT</th>
                  <th className="py-2.5 px-3">Mã Lô (Batch)</th>
                  <th className="py-2.5 px-3">Hạn Dùng (FEFO)</th>
                  <th className="py-2.5 px-3 text-center">Vị Trí Lấy (Bin)</th>
                  <th className="py-2.5 px-3 text-right">SL Y/C</th>
                  <th className="py-2.5 px-3 text-right">SL Thực Xuất</th>
                  <th className="py-2.5 px-3 text-right">Đơn Giá (đ)</th>
                  <th className="py-2.5 px-3 text-right">Thành Tiền (đ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => {
                  const unit = getOrderUnitLabel(item.sku, item.productName);
                  const price = getEstimatedPrice(item.sku);
                  const qty = item.allocatedQty || item.requestedQty;
                  const itemTotal = qty * price;
                  const batchText = (item.allocations && item.allocations.length > 0)
                    ? item.allocations.map(a => a.batchNumber).join(', ')
                    : 'BATCH-DEFAULT';
                  const expiryText = (item.allocations && item.allocations.length > 0)
                    ? item.allocations[0].expiryDate
                    : '2027-12-31';
                  const binText = (item.allocations && item.allocations.length > 0)
                    ? item.allocations[0].locationBarcode
                    : 'LOC-DEFAULT';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-600 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                        {item.sku}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {item.productName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                        {unit}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 font-bold">
                        {batchText}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                        {expiryText}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[10px] text-slate-600">
                        {binText}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {item.requestedQty.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                        {qty.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {price.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {itemTotal.toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-xs border-t-2 border-slate-200">
                <tr>
                  <td colSpan={7} className="py-2.5 px-3 text-right uppercase text-slate-700">
                    Tổng cộng giá trị hàng xuất:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    {totalRequested.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700 text-sm font-black">
                    {(totalPicked || totalAllocated || totalRequested).toLocaleString('vi-VN')}
                  </td>
                  <td></td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-900 text-sm font-black">
                    {totalValue.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Điều khoản & Cam kết chất lượng vận chuyển */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Biên bản kiểm tra tình trạng hàng hóa bàn giao:</span>
            </div>
            <p>
              1. Hàng hóa được bàn giao nguyên đai, nguyên kiện, có tem niêm phong và mã vạch định danh đầy đủ.
            </p>
            <p>
              2. Bên nhận đã kiểm đếm đúng số lượng, đúng mã số lô hàng và hạn sử dụng theo chuẩn FEFO.
            </p>
            <p>
              3. Mọi khiếu nại về số lượng thực tế cần được lập biên bản đồng kiểm trong vòng 24 giờ kể từ khi ký nhận.
            </p>
          </div>

          {/* 4 Chữ Ký Chuẩn Doanh Nghiệp */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-center text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-900 uppercase">Người Lập Phiếu</p>
              <p className="text-[10px] text-slate-500 italic">(Ký, ghi rõ họ tên)</p>
              <div className="h-16 flex items-end justify-center font-semibold text-slate-800 text-[11px]">
                Nguyễn Văn A
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-slate-900 uppercase">Thủ Kho Xuất</p>
              <p className="text-[10px] text-slate-500 italic">(Ký, ghi rõ họ tên)</p>
              <div className="h-16 flex items-end justify-center font-semibold text-slate-800 text-[11px]">
                Trần Thị B
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-slate-900 uppercase">Lái Xe / Vận Chuyển</p>
              <p className="text-[10px] text-slate-500 italic">(Ký, ghi rõ họ tên)</p>
              <div className="h-16 flex items-end justify-center font-semibold text-slate-800 text-[11px]">
                Phạm Văn C
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-slate-900 uppercase">Đại Diện Khách Hàng</p>
              <p className="text-[10px] text-slate-500 italic">(Ký, đóng dấu nếu có)</p>
              <div className="h-16 flex items-end justify-center font-semibold text-slate-800 text-[11px]">
                Đại diện nhận hàng
              </div>
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

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-200 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Phiếu Xuất Kho (A4)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

