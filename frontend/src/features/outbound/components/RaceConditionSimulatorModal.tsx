import React, { useState } from 'react';
import {
  X,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Clock,
  Layers,
  Cpu,
  CheckCircle2,
  XCircle,
  Database,
  Lock,
} from 'lucide-react';
import { apiClient } from '../../../services/api';

interface ThreadLog {
  threadId: number;
  threadName: string;
  success: boolean;
  requestedQty: number;
  status: string;
  message: string;
  durationMicros: number;
}

interface SimulationResponse {
  testName: string;
  productId: number;
  productSku: string;
  productName: string;
  initialAvailableQty: number;
  totalThreads: number;
  requestedQtyPerThread: number;
  successfulReservations: number;
  blockedReservations: number;
  finalAvailableQty: number;
  executionTimeMs: number;
  isNegativeStockPrevented: boolean;
  lockingMechanism: string;
  conclusion: string;
  threadLogs: ThreadLog[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RaceConditionSimulatorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [threadCount, setThreadCount] = useState<number>(20);
  const [qtyPerThread, setQtyPerThread] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleRunSimulation = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/inventory/simulate-concurrency', {
        threadCount,
        requestedQtyPerThread: qtyPerThread,
      });
      if (res.data?.data) {
        setResult(res.data.data);
      } else {
        throw new Error('Không nhận được dữ liệu kết quả từ server.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Không thể khởi chạy kịch bản thử nghiệm tranh chấp luồng. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900 relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-inner">
              <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Thử Nghiệm Tranh Chấp Tồn Kho & Khóa Bi Quan (Pessimistic Locking)
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  ACID CONCURRENCY
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Mô phỏng 20 luồng Java chạy song song cùng nano-giây tranh chấp tồn cuối cùng • Chống âm kho tuyệt đối
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors border border-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto grow">
          {/* Explanation Alert */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-indigo-950">
            <Database className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-indigo-900">
                Cơ chế kiểm soát đồng thời (Concurrency Control):
              </p>
              <p className="text-indigo-800">
                Sử dụng mệnh đề <strong>`SELECT ... FOR UPDATE`</strong> của MySQL InnoDB kết hợp Transaction Isolation Level
                của Spring Boot. Khi nhiều nhân viên hoặc webhook thương mại điện tử cùng đặt mua 1 mặt hàng, các dòng dữ liệu
                sẽ được khóa độc quyền tuần tự theo hàng đợi Database. Bất kỳ luồng nào đến sau khi hết hàng sẽ bị chặn an toàn,
                đảm bảo <strong>Available Stock không bao giờ bị âm</strong>.
              </p>
            </div>
          </div>

          {/* Test Controls */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap w-full sm:w-auto">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Số luồng song song (Threads):
                </label>
                <select
                  value={threadCount}
                  onChange={(e) => setThreadCount(parseInt(e.target.value, 10))}
                  disabled={loading}
                  className="text-xs font-bold font-mono px-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={10}>10 Luồng đồng thời</option>
                  <option value={20}>20 Luồng đồng thời (Chuẩn Benchmark)</option>
                  <option value={30}>30 Luồng đồng thời</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Số lượng mỗi luồng đòi giữ:
                </label>
                <select
                  value={qtyPerThread}
                  onChange={(e) => setQtyPerThread(parseInt(e.target.value, 10))}
                  disabled={loading}
                  className="text-xs font-bold font-mono px-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>1 sản phẩm / luồng</option>
                  <option value={2}>2 sản phẩm / luồng</option>
                  <option value={5}>5 sản phẩm / luồng</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <Zap className={`w-4 h-4 ${loading ? 'animate-spin' : 'text-amber-300'}`} />
              <span>{loading ? 'Đang bắn 20 luồng...' : '⚡ Bắt Đầu Kiểm Thử Live'}</span>
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Mặt hàng thử nghiệm
                  </span>
                  <div className="font-bold text-xs text-slate-900 mt-1 truncate" title={result.productName}>
                    {result.productName}
                  </div>
                  <div className="text-[10px] text-blue-700 font-mono font-bold">{result.productSku}</div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 shadow-2xs">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Khóa Thành Công (200 OK)
                  </span>
                  <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">
                    {result.successfulReservations} / {result.totalThreads} luồng
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">Được cấp phát an toàn</div>
                </div>

                <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 shadow-2xs">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                    Bị Chặn An Toàn (409)
                  </span>
                  <div className="text-xl font-black text-rose-700 font-mono mt-0.5">
                    {result.blockedReservations} / {result.totalThreads} luồng
                  </div>
                  <div className="text-[10px] text-rose-600 font-medium">Chống âm kho kịp thời</div>
                </div>

                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 shadow-2xs">
                  <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
                    Tốc độ xử lý (Benchmark)
                  </span>
                  <div className="text-xl font-black text-indigo-700 font-mono mt-0.5">
                    {result.executionTimeMs} ms
                  </div>
                  <div className="text-[10px] text-indigo-600 font-medium">Trực tiếp trên DB MySQL</div>
                </div>
              </div>

              {/* Conclusion Badge */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{result.conclusion}</span>
              </div>

              {/* Thread Execution Logs Matrix */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Nhật Ký Từng Luồng Thực Thi (Thread Trace Matrix)</span>
                  <span className="text-[11px] font-mono text-slate-500 font-normal">
                    Thuật toán: {result.lockingMechanism}
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 font-mono text-[11px]">
                  {result.threadLogs.map((log) => (
                    <div
                      key={log.threadId}
                      className={`px-3.5 py-2 flex items-center justify-between gap-3 ${
                        log.success ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'bg-rose-50/30 hover:bg-rose-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {log.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                        <span className="font-bold text-slate-800">{log.threadName}</span>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-600 font-sans text-xs">{log.message}</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-slate-400 text-[10px]">{log.durationMicros} μs</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.success
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span>
            * Hệ thống tự động hoàn trả (Release) số lượng giữ chỗ sau khi test để không làm ảnh hưởng tồn kho thật.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

