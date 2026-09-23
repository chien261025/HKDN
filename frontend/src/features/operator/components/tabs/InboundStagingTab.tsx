import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle2, ScanLine, ArrowRight, RefreshCw, Clock, Layers } from 'lucide-react';
import { operatorService, InboundOrderDto, ProductDto } from '../../services/operatorService';

interface InboundStagingTabProps {
  onOpenScanner: () => void;
  scannedCode?: string | null;
  onClearScannedCode?: () => void;
}

export const InboundStagingTab: React.FC<InboundStagingTabProps> = ({
  onOpenScanner,
  scannedCode,
  onClearScannedCode,
}) => {
  const [orders, setOrders] = useState<InboundOrderDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [receivingId, setReceivingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

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

  // Xử lý khi có mã vạch được quét từ camera hoặc máy quét PDA
  useEffect(() => {
    if (scannedCode) {
      const matchedProd = products.find((p) => p.barcode === scannedCode || p.sku === scannedCode);
      if (matchedProd) {
        setNotice({
          msg: `[PDA] Đã nhận diện kiện hàng: ${matchedProd.name} (${matchedProd.sku})!`,
          type: 'success',
        });
      } else {
        setNotice({
          msg: `[PDA] Đã quét mã: ${scannedCode}. Vui lòng chọn đơn PO tương ứng.`,
          type: 'success',
        });
      }
      onClearScannedCode?.();
    }
  }, [scannedCode, products, onClearScannedCode]);

  const handleConfirmReceive = async (order: InboundOrderDto) => {
    setReceivingId(order.id);
    setNotice(null);
    try {
      await operatorService.confirmReceiveInboundOrder(order.id);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'RECEIVED' } : o))
      );
      setNotice({
        msg: `Thành công: Đã tiếp nhận toàn bộ kiện hàng của đơn ${order.orderCode} vào Khu Đệm (STAGING)!`,
        type: 'success',
      });
    } catch (err: any) {
      setNotice({ msg: 'Lỗi tiếp nhận đơn: ' + err.message, type: 'error' });
    } finally {
      setReceivingId(null);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const receivedOrders = orders.filter((o) => o.status === 'RECEIVED');

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Nhận Hàng Tại Khu Đệm (Staging)
            </h2>
            <p className="text-xs text-slate-500 font-medium">Kiểm tra thực tế từ xe tải giao hàng</p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          title="Làm mới danh sách"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium shadow-2xs animate-in fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{notice.msg}</span>
        </div>
      )}

      {/* Quét Mã Vạch Barcode Nhanh */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase">Quét Thùng Hàng Thực Tế</span>
          <p className="text-xs text-slate-500 mt-0.5">Sử dụng Camera hoặc máy quét mã vạch chuyên dụng</p>
        </div>
        <button
          type="button"
          onClick={onOpenScanner}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
        >
          <ScanLine className="w-4 h-4" />
          <span>Bật Quét Mã</span>
        </button>
      </div>

      {/* Danh sách đơn hàng PO đang chờ nhận */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Đơn PO Chờ Nhận ({pendingOrders.length})
          </span>
          <span className="text-xs text-slate-500 font-mono">Dữ liệu PostgreSQL</span>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-800">Không có đơn hàng nào đang chờ nhận tại bến!</p>
            <p className="mt-1">Tất cả kiện hàng từ xe tải đã được tiếp nhận đầy đủ vào kho.</p>
          </div>
        ) : (
          pendingOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-cyan-400 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 text-sm">{order.orderCode}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      CHỜ TIẾP NHẬN
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ghi chú: {order.notes || 'Đơn nhập hàng tiêu chuẩn'}
                  </p>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              {/* Chi tiết mặt hàng trong đơn */}
              {order.items && order.items.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
                  {order.items.map((item) => {
                    const prod = products.find((p) => p.id === item.productId);
                    return (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-800">
                            {prod ? prod.name : `Sản phẩm #${item.productId}`}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-indigo-700">
                          {item.expectedQty} {prod ? prod.unit : 'cái'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Nút tiếp nhận đơn vào kho */}
              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  disabled={receivingId === order.id}
                  onClick={() => handleConfirmReceive(order)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-200 transition-all cursor-pointer"
                >
                  {receivingId === order.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Xác Nhận Nhập Kho Staging</span>
                </button>
              </div>
            </div>
          ))
        )}

        {/* Đơn hàng đã nhận gần đây */}
        {receivedOrders.length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
              Đơn Đã Nhận Gần Đây ({receivedOrders.slice(0, 3).length})
            </span>
            <div className="mt-2 space-y-2">
              {receivedOrders.slice(0, 3).map((ro) => (
                <div key={ro.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-mono font-bold text-slate-800">{ro.orderCode}</span>
                  </div>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ĐÃ VÀO KHU ĐỆM
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
