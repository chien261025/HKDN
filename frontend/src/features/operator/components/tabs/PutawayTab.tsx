import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle2, ScanLine, ArrowRight, MapPin, Scale, AlertCircle, RefreshCw } from 'lucide-react';
import { operatorService, LocationDto, ProductDto } from '../../services/operatorService';

interface PutawayTabProps {
  onOpenScanner: () => void;
  scannedCode?: string | null;
  onClearScannedCode?: () => void;
}

interface ActivePutawayTask {
  id: string;
  sku: string;
  productName: string;
  weightKg: number;
  qty: number;
  preferredZone: string;
  suggestedLocation?: LocationDto;
  status: 'PENDING' | 'SUGGESTED' | 'COMPLETED';
}

export const PutawayTab: React.FC<PutawayTabProps> = ({
  onOpenScanner,
  scannedCode,
  onClearScannedCode,
}) => {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<ActivePutawayTask | null>(null);
  const [scannedBin, setScannedBin] = useState('');
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Danh sách kiện hàng mẫu chờ cất từ khu đệm Staging
  const [stagingQueue, setStagingQueue] = useState<ActivePutawayTask[]>([
    {
      id: 'put-01',
      sku: 'SKU-OMO-MATIC',
      productName: 'Nước giặt OMO Matic 3.6kg',
      weightKg: 150.0,
      qty: 40,
      preferredZone: 'ZONE_A',
      status: 'PENDING',
    },
    {
      id: 'put-02',
      sku: 'SKU-MILK-100',
      productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
      weightKg: 30.0,
      qty: 30,
      preferredZone: 'ZONE_B',
      status: 'PENDING',
    },
    {
      id: 'put-03',
      sku: 'SKU-SAMS-S24',
      productName: 'Điện thoại Samsung Galaxy S24 Ultra',
      weightKg: 5.0,
      qty: 10,
      preferredZone: 'ZONE_A',
      status: 'PENDING',
    },
  ]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [prods, locs] = await Promise.all([
          operatorService.getProducts(),
          operatorService.getLocations(),
        ]);
        setProducts(prods);
        setLocations(locs);
      } catch (err: any) {
        setFeedback({ msg: 'Không thể tải sơ đồ vị trí: ' + err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Xử lý khi quét mã vạch từ máy quét hoặc camera
  useEffect(() => {
    if (scannedCode) {
      setScannedBin(scannedCode);
      setFeedback({ msg: `[PDA] Đã ghi nhận mã ô kệ: ${scannedCode}`, type: 'success' });
      onClearScannedCode?.();
    }
  }, [scannedCode, onClearScannedCode]);

  // Kích hoạt thuật toán Backend gợi ý vị trí cất hàng tối ưu
  const handleRequestSuggestion = async (task: ActivePutawayTask) => {
    setLoading(true);
    setFeedback(null);
    try {
      const suggested = await operatorService.suggestPutawayLocation(
        task.preferredZone,
        task.weightKg
      );

      const updatedTask: ActivePutawayTask = {
        ...task,
        suggestedLocation: suggested,
        status: 'SUGGESTED',
      };

      setActiveTask(updatedTask);
      setFeedback({
        msg: `Thuật toán gợi ý vị trí: ${suggested.binBarcode} (Tầng ${suggested.shelf}, Tải trọng tối đa: ${suggested.maxWeightKg}kg)`,
        type: 'success',
      });
    } catch (err: any) {
      setFeedback({ msg: 'Lỗi chạy thuật toán cất hàng: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Xác nhận cất hàng vào ô kệ
  const handleConfirmPlacement = () => {
    if (!activeTask || !activeTask.suggestedLocation) return;

    const targetBarcode = activeTask.suggestedLocation.binBarcode;

    // Kiểm tra đối soát mã vạch ô kệ
    if (scannedBin.trim() && scannedBin.trim() !== targetBarcode) {
      setFeedback({
        msg: `Cảnh báo: Bạn đang quét ô ${scannedBin}, trong khi thuật toán chỉ định ô ${targetBarcode}!`,
        type: 'error',
      });
      return;
    }

    // Hoàn tất cất hàng
    setStagingQueue((prev) =>
      prev.map((t) => (t.id === activeTask.id ? { ...t, status: 'COMPLETED' } : t))
    );
    setFeedback({
      msg: `Thành công: Đã cất ${activeTask.qty} cái ${activeTask.productName} vào ô ${targetBarcode} an toàn!`,
      type: 'success',
    });
    setActiveTask(null);
    setScannedBin('');
    setTimeout(() => setFeedback(null), 4000);
  };

  const pendingQueue = stagingQueue.filter((t) => t.status !== 'COMPLETED');
  const completedQueue = stagingQueue.filter((t) => t.status === 'COMPLETED');

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Cất Hàng Lên Ô Kệ (Put-Away)
            </h2>
            <p className="text-xs text-slate-500 font-medium">Thuật toán phân tích tải trọng & Zone tự động</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
          {pendingQueue.length} KIỆN CHỜ
        </span>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium shadow-2xs animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Nhiệm vụ đang thực hiện (Active Putaway Task) */}
      {activeTask && activeTask.suggestedLocation && (
        <div className="bg-white rounded-2xl p-5 border-2 border-indigo-500 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-black text-indigo-900 uppercase">Đang Thực Hiện Cất Hàng</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 font-mono">
              THUẬT TOÁN CHỈ ĐỊNH
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 font-medium">Mặt hàng:</span>
            <div className="font-bold text-slate-900 text-sm">{activeTask.productName}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 font-mono">
              <span>SKU: {activeTask.sku}</span>
              <span>Số lượng: {activeTask.qty} cái</span>
              <span>Tổng nặng: {activeTask.weightKg}kg</span>
            </div>
          </div>

          {/* Vị trí gợi ý từ Backend */}
          <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-indigo-900">Vị Trí Ô Kệ Chỉ Định:</div>
              <div className="font-mono font-black text-indigo-700 text-base mt-0.5">
                {activeTask.suggestedLocation.binBarcode}
              </div>
              <div className="text-xs text-indigo-600 mt-0.5">
                Phân khu {activeTask.suggestedLocation.zoneCode} • Tầng đáy {activeTask.suggestedLocation.shelf}
              </div>
            </div>
            <MapPin className="w-6 h-6 text-indigo-600" />
          </div>

          {/* Ô nhập / Quét mã vạch vị trí */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Xác Nhận Quét Mã Ô Kệ:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="VD: WH01-ZA-A01-R01-S01-B01"
                value={scannedBin}
                onChange={(e) => setScannedBin(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold"
              />
              <button
                type="button"
                onClick={onOpenScanner}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ScanLine className="w-4 h-4" />
                <span>Quét</span>
              </button>
            </div>
          </div>

          {/* Nút bấm xác nhận */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTask(null)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirmPlacement}
              className="flex-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận Đã Đặt Vào Kệ</span>
            </button>
          </div>
        </div>
      )}

      {/* Danh sách kiện hàng chờ cất */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Hàng Chờ Cất Tại Khu Đệm ({pendingQueue.length})
          </span>
          <span className="text-xs text-slate-500 font-mono">Thuật toán Directed Put-away</span>
        </div>

        {pendingQueue.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-bold text-slate-900 text-sm">{task.productName}</span>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
                  <span>SKU: {task.sku}</span>
                  <span>•</span>
                  <span>{task.qty} cái</span>
                  <span>•</span>
                  <span className="text-indigo-700 font-bold">{task.weightKg}kg</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {task.preferredZone}
              </span>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleRequestSuggestion(task)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Gợi Ý Vị Trí Cất Tối Ưu</span>
              </button>
            </div>
          </div>
        ))}

        {/* Kiện hàng đã hoàn tất cất */}
        {completedQueue.length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
              Đã Cất Xong ({completedQueue.length})
            </span>
            <div className="mt-2 space-y-2">
              {completedQueue.map((cq) => (
                <div key={cq.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800">{cq.productName}</span>
                  </div>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ĐÃ LÊN KỆ AN TOÀN
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
