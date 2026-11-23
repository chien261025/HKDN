import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  ScanLine,
  RefreshCw,
  Clock,
  Search,
  X,
  Building2,
  Layers,
  ArrowRight,
  Filter,
  Barcode,
} from 'lucide-react';
import { operatorService, InboundOrderDto, ProductDto } from '../../services/operatorService';
import { soundEffects } from '../../utils/soundEffects';
import { ReceiveQcModal } from '../../../inbound/components/ReceiveQcModal';
import { inboundService } from '../../../inbound/services/inboundService';
import { ReceiptLine } from '../../../inbound/types';

interface InboundStagingTabProps {
  onOpenScanner: () => void;
  scannedCode?: string | null;
  onClearScannedCode?: () => void;
  isCompact?: boolean;
}

const normalizeText = (str: string = ''): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

export const InboundStagingTab: React.FC<InboundStagingTabProps> = ({
  onOpenScanner,
  scannedCode,
  onClearScannedCode,
  isCompact,
}) => {
  const [orders, setOrders] = useState<InboundOrderDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [receivingId, setReceivingId] = useState<number | null>(null);
  const [qcOrder, setQcOrder] = useState<InboundOrderDto | null>(null);
  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RECEIVED'>('PENDING');
  const [quickInput, setQuickInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderList, prodList] = await Promise.all([
        operatorService.getInboundOrders(),
        operatorService.getProducts(),
      ]);
      setOrders(orderList);
      setProducts(prodList);
    } catch (err: any) {
      setNotice({ msg: 'Không thể tải danh sách đơn nhập kho: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Xử lý khi có mã vạch được quét từ camera hoặc súng quét PDA
  useEffect(() => {
    if (scannedCode) {
      handleProcessBarcode(scannedCode);
      onClearScannedCode?.();
    }
  }, [scannedCode, onClearScannedCode]);

  const handleProcessBarcode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    // 1. Kiểm tra xem có trùng mã PO không
    const matchedOrder = orders.find(
      (o) => o.orderCode.toLowerCase() === trimmed.toLowerCase()
    );
    if (matchedOrder) {
      soundEffects.playSuccessBeep();
      setNotice({
        msg: `[PDA] Nhận diện đơn PO: ${matchedOrder.orderCode}. Đang mở bảng kiểm đếm...`,
        type: 'success',
      });
      setQcOrder(matchedOrder);
      setQuickInput('');
      return;
    }

    // 2. Kiểm tra xem có trùng sản phẩm nào không
    const matchedProd = products.find(
      (p) => p.barcode === trimmed || p.sku.toLowerCase() === trimmed.toLowerCase()
    );
    if (matchedProd) {
      soundEffects.playSuccessBeep();
      setSearchTerm(matchedProd.sku);
      setNotice({
        msg: `[PDA] Quét kiện hàng: ${matchedProd.name} (${matchedProd.sku})! Đang lọc đơn tương ứng.`,
        type: 'success',
      });
      setQuickInput('');
      return;
    }

    // 3. Khác
    soundEffects.playSuccessBeep();
    setSearchTerm(trimmed);
    setNotice({
      msg: `[PDA] Đã ghi nhận mã: ${trimmed}. Đang lọc đơn phù hợp.`,
      type: 'success',
    });
    setQuickInput('');
  };

  const handleConfirmReceive = async (id: string, lines: ReceiptLine[], notes?: string) => {
    setReceivingId(Number(id));
    setNotice(null);
    try {
      await inboundService.receiveOrder(id, lines, notes);
      soundEffects.playCompleteChime();
      await loadData();
      setNotice({
        msg: `Đã hoàn tất tiếp nhận & kiểm định QC cho đơn ${qcOrder?.orderCode}!`,
        type: 'success',
      });
    } catch (err: any) {
      soundEffects.playErrorBuzz();
      setNotice({ msg: 'Lỗi tiếp nhận đơn: ' + err.message, type: 'error' });
      throw err;
    } finally {
      setReceivingId(null);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const pendingCount = useMemo(() => orders.filter((o) => o.status === 'PENDING' || o.status === 'PARTIALLY_STOCKED').length, [orders]);
  const receivedCount = useMemo(() => orders.filter((o) => o.status === 'RECEIVED').length, [orders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (statusFilter === 'PENDING') return o.status === 'PENDING' || o.status === 'PARTIALLY_STOCKED';
        if (statusFilter === 'RECEIVED') return o.status === 'RECEIVED';
        return true;
      })
      .filter((o) => {
        if (!searchTerm) return true;
        const q = normalizeText(searchTerm);
        const code = normalizeText(o.orderCode);
        const notes = normalizeText(o.notes || '');
        const supplier = normalizeText(o.supplier?.name || (o as any).supplierName || '');
        const hasItem = (o.items || []).some((it) => {
          const p = products.find((prod) => prod.id === it.productId);
          return (
            (p && (normalizeText(p.name).includes(q) || normalizeText(p.sku).includes(q))) ||
            String(it.productId).includes(q)
          );
        });
        return code.includes(q) || notes.includes(q) || supplier.includes(q) || hasItem;
      })
      .sort((a, b) => b.id - a.id);
  }, [orders, products, statusFilter, searchTerm]);

  const modalOrder = useMemo(() => {
    if (!qcOrder) return null;
    return {
      id: String(qcOrder.id),
      poCode: qcOrder.orderCode,
      supplierName: qcOrder.supplier?.name || (qcOrder as any).supplierName || `NCC #${qcOrder.supplierId || ''}`,
      items: (qcOrder.items ?? []).map((i) => {
        const p = products.find((prod) => prod.id === i.productId);
        return {
          ...i,
          id: String(i.id),
          sku: p?.sku ?? String(i.productId),
          productName: p?.name ?? `#${i.productId}`,
          unit: p?.unit ?? 'cái',
          status: 'PENDING' as const,
        };
      }),
    };
  }, [qcOrder, products]);

  return (
    <div className="space-y-3.5 pb-20">
      {modalOrder && (
        <ReceiveQcModal
          onClose={() => setQcOrder(null)}
          onConfirmReceive={handleConfirmReceive}
          order={modalOrder}
        />
      )}

      {/* Header Banner Phân Hệ */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
              Tiếp Nhận Hàng Bến Staging
            </h2>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Làm mới dữ liệu từ máy chủ"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium shadow-2xs animate-in fade-in ${notice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="flex-1">{notice.msg}</span>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-600 text-xs ml-auto"
          >
            ✕
          </button>
        </div>
      )}

      {/* Thanh Nhập & Quét Mã Súng Quét PDA / Camera */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Quét hoặc nhập mã PO / Barcode SKU..."
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && quickInput.trim()) {
                  handleProcessBarcode(quickInput);
                }
              }}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 font-semibold text-slate-800"
            />
          </div>

          <button
            type="button"
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
            title="Bật máy quét Camera"
          >
            <ScanLine className="w-4 h-4" />
            <span className="hidden sm:inline">Camera</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-100">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`flex-1 sm:flex-none px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'PENDING'
                  ? 'bg-white text-amber-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Chờ tiếp nhận ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('RECEIVED')}
              className={`flex-1 sm:flex-none px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'RECEIVED'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Đã vào đệm ({receivedCount})
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 sm:flex-none px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Tất cả ({orders.length})
            </button>
          </div>

          {/* Quick Search Box */}
          <div className="relative flex-1 sm:max-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lọc mã, NCC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách đơn hàng PO */}
      <div>
        <div className="flex items-center justify-between px-1 pb-2 text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            {statusFilter === 'PENDING'
              ? `Đơn PO Chờ Nhận (${filteredOrders.length})`
              : statusFilter === 'RECEIVED'
                ? `Đơn Tại Khu Đệm (${filteredOrders.length})`
                : `Toàn Bộ Đơn PO (${filteredOrders.length})`}
          </span>
          <span className="text-slate-400 text-2xs font-mono">Bến Staging Dock</span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-800">Không có đơn hàng nào khớp với bộ lọc!</p>
            <p className="mt-1 text-slate-400 text-2xs">
              {searchTerm ? `Không tìm thấy kết quả cho từ khóa "${searchTerm}"` : 'Tất cả đơn hàng của trạng thái này đã được xử lý xong.'}
            </p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${isCompact ? '' : 'md:grid-cols-2'} gap-3`}>
            {filteredOrders.map((order) => {
            const isPending = order.status === 'PENDING';
            const isPartiallyStocked = order.status === 'PARTIALLY_STOCKED';
            const totalUnits = (order.items || []).reduce((sum, it) => sum + (it.expectedQty || 0), 0);
            const supplierName = order.supplier?.name || (order as any).supplierName || 'Nhà Cung Cấp Chuẩn';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl p-4 border transition-all space-y-3 shadow-xs ${isPending || isPartiallyStocked
                    ? 'border-slate-200 hover:border-blue-400 hover:shadow-sm'
                    : 'border-blue-200 bg-blue-50/15'
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-slate-900 text-sm tracking-tight">
                        {order.orderCode}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isPartiallyStocked
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : isPending
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                      >
                        {isPartiallyStocked ? 'CẤT 1 PHẦN · GIAO BÙ' : isPending ? 'CHỜ TIẾP NHẬN' : 'TẠI KHU ĐỆM'}
                      </span>
                      {order.warehouseId === 2 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          Bắc Ninh
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-800">{supplierName}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">
                      Ghi chú: {order.notes || 'Xe tải có bửng nâng, giao hàng đúng hẹn.'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-2xs text-slate-400 flex items-center justify-end gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="text-[11px] font-bold text-indigo-700 mt-1 font-mono">
                      {order.items?.length || 0} mặt hàng • {totalUnits} {products.find(p => p.id === order.items?.[0]?.productId)?.unit || 'sản phẩm'}
                    </div>
                  </div>
                </div>

                {/* Chi tiết mặt hàng trong đơn */}
                {order.items && order.items.length > 0 && (
                  <div className="bg-slate-50/80 rounded-xl p-2.5 space-y-1.5 border border-slate-100">
                    {order.items.map((item) => {
                      const prod = products.find((p) => p.id === item.productId);
                      return (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-800 truncate">
                              {prod ? prod.name : `Sản phẩm #${item.productId}`}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-indigo-700 shrink-0">
                            {item.expectedQty} {prod ? prod.unit : 'cái'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Thao tác tiếp nhận */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500 font-semibold">
                    Dock Tiếp Nhận #01
                  </span>

                  {isPending || isPartiallyStocked ? (
                    <button
                      type="button"
                      disabled={receivingId === order.id}
                      onClick={() => setQcOrder(order)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      {receivingId === order.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>{isPartiallyStocked ? 'Tiếp nhận đợt tiếp theo' : 'Kiểm đếm và nhận hàng'}</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã cất tại khu đệm</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};
