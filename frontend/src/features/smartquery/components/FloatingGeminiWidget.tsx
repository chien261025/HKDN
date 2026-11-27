import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUp,
  Database,
  ExternalLink,
  Maximize2,
  RotateCcw,
  X,
} from 'lucide-react';
import { AuthSession } from '../../auth/types';
import { warehouseService } from '../../masterdata/services/warehouseService';
import { smartQueryApi } from '../services/smartQueryApi';
import { AiDiagnosisResponse } from '../types';
import { AiDiagnosisCard } from './AiDiagnosisCard';
import { KoraAvatar } from './KoraAvatar';
import { SmartMarkdownText } from './SmartMarkdownText';
import { SmartPromptGrid, SmartPromptItem } from './SmartPromptGrid';

interface FloatingGeminiWidgetProps {
  session: AuthSession;
}

interface MiniChatEntry {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  diagnosis?: AiDiagnosisResponse;
  sqlQuery?: string;
  astStatus?: 'VERIFIED' | 'REJECTED' | 'LIMIT_INJECTED';
  tableData?: Array<Record<string, unknown>>;
  error?: string;
}

const TOOLTIP_DISMISSED_KEY = 'smart_wms_kora_tooltip_dismissed';

const COMPACT_COL_LABELS: Record<string, string> = {
  sku: 'SKU',
  product_name: 'Sản phẩm',
  unit: 'ĐVT',
  total_on_hand: 'Vật lý',
  total_reserved: 'Giữ chỗ',
  total_blocked: 'Khóa',
  total_available: 'Khả dụng',
  on_hand_qty: 'Vật lý',
  available_qty: 'Khả dụng',
};

const resolveActiveWarehouseCode = (): string | undefined => {
  const raw = warehouseService.getActiveWarehouseId();
  if (!raw || raw === 'ALL') return undefined;
  const trimmed = String(raw).trim();
  if (trimmed.startsWith('WH')) return trimmed;
  const n = parseInt(trimmed, 10);
  return Number.isNaN(n) ? trimmed : n < 10 ? `WH0${n}` : `WH${n}`;
};

const getContextConfig = (
  pathname: string,
  whCode?: string
): {
  subtitle: string;
  tooltip: string;
  prompts: SmartPromptItem[];
} => {
  const scopeLabel = whCode || 'kho được phân quyền';
  if (pathname.startsWith('/outbound')) {
    return {
      subtitle: 'Trợ lý xuất kho',
      tooltip: 'Kiểm tra đơn SO & tồn khả dụng',
      prompts: [
        {
          label: 'Đơn SO đang giữ chỗ',
          query: `Những đơn xuất kho SO nào đang giữ chỗ tồn kho tại ${scopeLabel}?`,
        },
        {
          label: 'Điểm nghẽn xuất kho',
          query: `Tổng hợp sự cố tồn kho, đơn chờ phân bổ FEFO và hàng khóa tại ${scopeLabel}`,
        },
        {
          label: 'Lô cận hạn 30 ngày',
          query: `Cho tôi xem các lô hàng sắp hết hạn trong 30 ngày tới`,
        },
        {
          label: 'PO chờ cất kệ (Putaway)',
          query: `Kiểm tra đơn nhập PO đang về hoặc hàng chờ cất kệ (Putaway) tại ${scopeLabel}`,
        },
      ],
    };
  }
  if (pathname.startsWith('/inventory')) {
    return {
      subtitle: 'Phân tích tồn kho',
      tooltip: 'Soi tồn vật lý, giữ chỗ & lô cận hạn',
      prompts: [
        {
          label: 'Lệch Vật lý vs Khả dụng',
          query: `Tổng hợp sự cố tồn kho, lô hết hạn/QC Hold và hàng đang giữ chỗ tại ${scopeLabel}`,
        },
        {
          label: 'Mặt hàng tồn thấp < 20',
          query: `Tìm các mặt hàng còn dưới 20 đơn vị khả dụng`,
        },
        {
          label: 'Lô cận hạn 30 ngày',
          query: `Cho tôi xem các lô hàng sắp hết hạn trong 30 ngày tới`,
        },
        {
          label: 'Top 5 Khu A (ZONE_A)',
          query: `Liệt kê top 5 sản phẩm có số lượng khả dụng cao nhất tại phân khu A`,
        },
      ],
    };
  }
  if (pathname.startsWith('/inbound')) {
    return {
      subtitle: 'Theo dõi nhập kho',
      tooltip: 'Kiểm tra tiến độ PO & hàng chờ Putaway',
      prompts: [
        {
          label: 'PO chờ cất lên kệ',
          query: `Tổng hợp sự cố tồn kho, đơn chờ xuất và hàng chờ Putaway tại ${scopeLabel}`,
        },
        {
          label: 'Lô cận hạn cần lưu ý',
          query: `Cho tôi xem các lô hàng sắp hết hạn trong 30 ngày tới`,
        },
        {
          label: 'Ô kệ quá tải hoặc khóa',
          query: `Kiểm tra ô kệ vượt tải trọng và kệ khóa bảo trì tại ${scopeLabel}`,
        },
        {
          label: 'Mặt hàng cần nhập thêm',
          query: `Tìm các mặt hàng còn dưới 20 đơn vị khả dụng`,
        },
      ],
    };
  }
  if (pathname.startsWith('/layout')) {
    return {
      subtitle: 'Giám sát ô kệ',
      tooltip: 'Quét kệ quá tải trọng & kệ bảo trì',
      prompts: [
        {
          label: 'Kệ quá tải & khóa bảo trì',
          query: `Tổng hợp sự cố ô kệ quá tải trọng, kệ khóa và rủi ro vận hành tại ${scopeLabel}`,
        },
        {
          label: 'Top 5 Khu A (ZONE_A)',
          query: `Liệt kê top 5 sản phẩm có số lượng khả dụng cao nhất tại phân khu A`,
        },
        {
          label: 'Lô hết hạn / cách ly',
          query: `Cho tôi xem các lô hàng sắp hết hạn trong 30 ngày tới`,
        },
        {
          label: 'SO đang giữ chỗ theo vị trí',
          query: `Những đơn xuất kho SO nào đang giữ chỗ tồn kho tại ${scopeLabel}?`,
        },
      ],
    };
  }
  return {
    subtitle: 'Trợ lý kho vận',
    tooltip: 'Hỏi nhanh số liệu & sự cố kho',
    prompts: [
      {
        label: 'Tổng hợp sự cố vận hành',
        query: `Tổng hợp sự cố tồn kho, đơn chờ xuất và lô hết hạn/QC Hold tại ${scopeLabel}`,
      },
      {
        label: 'Lô cận hạn 30 ngày',
        query: `Cho tôi xem các lô hàng sắp hết hạn trong 30 ngày tới`,
      },
      {
        label: 'Top 5 Khu A khả dụng',
        query: `Liệt kê top 5 sản phẩm có số lượng khả dụng cao nhất tại phân khu A`,
      },
      {
        label: 'Mặt hàng tồn thấp < 20',
        query: `Tìm các mặt hàng còn dưới 20 đơn vị khả dụng`,
      },
    ],
  };
};

export const FloatingGeminiWidget: React.FC<FloatingGeminiWidgetProps> = ({ session }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState<boolean>(
    () => sessionStorage.getItem(TOOLTIP_DISMISSED_KEY) === '1'
  );
  const [messages, setMessages] = useState<MiniChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Đang xác thực quyền kho...');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tooltipDismissed || isOpen) return;
    const timer = setTimeout(() => {
      setTooltipDismissed(true);
      sessionStorage.setItem(TOOLTIP_DISMISSED_KEY, '1');
    }, 5000);
    return () => clearTimeout(timer);
  }, [tooltipDismissed, isOpen]);

  useEffect(() => {
    const onDrawerToggle = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setDrawerOpen(Boolean(custom.detail));
    };
    window.addEventListener('gemini-drawer-visibility', onDrawerToggle);
    return () => window.removeEventListener('gemini-drawer-visibility', onDrawerToggle);
  }, []);

  useEffect(() => {
    if (!loading) return;
    setLoadingStep('Đang xác thực quyền kho...');
    const t1 = setTimeout(() => setLoadingStep('Đang truy xuất dữ liệu MySQL...'), 1400);
    const t2 = setTimeout(() => setLoadingStep('Kora AI đang tổng hợp kết quả...'), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  const isHiddenRoute =
    location.pathname.startsWith('/smartquery') ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/operator');
  const isAuthorized =
    session?.role === 'ROLE_ADMIN' || session?.role === 'ROLE_WAREHOUSE_MANAGER';

  const activeWh = resolveActiveWarehouseCode();
  const ctx = useMemo(
    () => getContextConfig(location.pathname, activeWh),
    [location.pathname, activeWh]
  );

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isOpen]);

  if (!isAuthorized || isHiddenRoute || drawerOpen) {
    return null;
  }

  const safeName =
    session.fullName && !session.fullName.includes('?') ? session.fullName : 'Quản lý';

  const handleSend = async (rawQuery?: string) => {
    const q = (rawQuery ?? input).trim();
    if (!q || loading) return;
    if (!rawQuery) setInput('');

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, sender: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await smartQueryApi.chat(q, activeWh);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'ai',
          text: res.answer,
          diagnosis: res.diagnosis,
          sqlQuery: res.sqlQuery,
          astStatus: res.astStatus,
          tableData: res.tableData,
        },
      ]);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Không thể kết nối tới Kora AI lúc này. Vui lòng thử lại.';
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, sender: 'ai', text: '', error: msg },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (url: string) => {
    setIsOpen(false);
    navigate(url);
  };

  return (
    <div className="print:hidden">
      {isOpen && (
        <section
          id="kora-chat-panel"
          role="dialog"
          aria-label="Kora AI"
          className="fixed bottom-6 right-4 md:right-8 z-50 w-[min(25rem,calc(100vw-2rem))] h-[min(37rem,calc(100vh-5rem))] rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.16)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <header className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 shrink-0 bg-white">
            <KoraAvatar size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Kora AI</p>
              <p className="text-xs text-slate-500 truncate">
                {ctx.subtitle}
                {activeWh ? ` · ${activeWh}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setMessages([])}
                  title="Cuộc trò chuyện mới"
                  aria-label="Cuộc trò chuyện mới"
                  className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleNavigate('/smartquery')}
                title="Mở toàn màn hình"
                aria-label="Mở trang Kora AI toàn màn hình"
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng Kora AI"
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-2.5">
                  <KoraAvatar size="sm" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Chào {safeName}!
                    </p>
                    <p className="text-[13.5px] leading-relaxed text-slate-600">
                      Mình là <strong className="font-semibold text-slate-900">Kora AI</strong> của SMART WMS. Bạn cần kiểm tra đơn xuất SO, tồn khả dụng hay lô cận hạn?
                    </p>
                  </div>
                </div>

                <SmartPromptGrid
                  prompts={ctx.prompts}
                  onSelect={(q) => void handleSend(q)}
                  disabled={loading}
                  compact
                />
              </div>
            )}

            {messages.map((m) =>
              m.sender === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-100 px-3.5 py-2 text-[13.5px] leading-relaxed text-slate-900 whitespace-pre-wrap break-words">
                    {m.text}
                  </div>
                </div>
              ) : m.error ? (
                <div key={m.id} className="flex items-start gap-2.5" role="alert">
                  <div className="size-7 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 leading-relaxed">
                    {m.error}
                  </div>
                </div>
              ) : m.diagnosis ? (
                <div key={m.id} className="flex items-start gap-2.5">
                  <KoraAvatar size="sm" />
                  <div className="flex-1 min-w-0">
                    <AiDiagnosisCard
                      diagnosis={m.diagnosis}
                      onNavigate={handleNavigate}
                      compact
                    />
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex items-start gap-2.5">
                  <KoraAvatar size="sm" />
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <SmartMarkdownText
                      content={m.text}
                      onNavigate={handleNavigate}
                      className="text-[13.5px] leading-relaxed text-slate-700"
                    />

                    {m.tableData && m.tableData.length > 0 && (
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Database className="w-3 h-3 text-blue-600" />
                            {m.tableData.length} bản ghi
                          </span>
                          <button
                            type="button"
                            onClick={() => handleNavigate('/smartquery')}
                            className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:underline cursor-pointer"
                          >
                            <span>Xem đầy đủ</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] divide-y divide-slate-100">
                            <thead className="bg-slate-50/70 text-slate-500">
                              <tr>
                                {Object.keys(m.tableData[0]).map((col) => (
                                  <th key={col} className="px-2.5 py-1.5 font-semibold whitespace-nowrap">
                                    {COMPACT_COL_LABELS[col.toLowerCase()] || col.replace(/_/g, ' ')}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {m.tableData.slice(0, 5).map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  {Object.keys(m.tableData![0]).map((col) => {
                                    const val = row[col];
                                    const isNum = typeof val === 'number';
                                    return (
                                      <td
                                        key={col}
                                        className={`px-2.5 py-1.5 text-slate-800 truncate max-w-[130px] whitespace-nowrap ${isNum ? 'font-mono font-semibold text-right tabular-nums' : ''
                                          }`}
                                      >
                                        {val !== null && val !== undefined
                                          ? isNum
                                            ? val.toLocaleString('vi-VN')
                                            : String(val)
                                          : '—'}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {loading && (
              <div className="flex items-center gap-2.5">
                <KoraAvatar size="sm" pulse />
                <span className="text-xs text-slate-500">{loadingStep}</span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="border-t border-slate-100 p-3 bg-white shrink-0 space-y-2"
          >
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50/60 pl-3.5 pr-1.5 py-1.5 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:ring-3 focus-within:ring-blue-50">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Hỏi Kora AI..."
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Gửi tới Kora AI"
                className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span>Powered by Gemini · Dữ liệu chỉ đọc</span>
              <button
                type="button"
                onClick={() => handleNavigate('/smartquery')}
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Mở trang đầy đủ ↗
              </button>
            </div>
          </form>
        </section>
      )}

      {!isOpen && !tooltipDismissed && (
        <div
          role="status"
          className="fixed bottom-24 right-4 md:right-8 z-50 w-[min(17.5rem,calc(100vw-2rem))] rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-3 pr-8 shadow-[0_12px_32px_rgba(15,23,42,0.12)] animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex w-full items-center gap-2.5 text-left cursor-pointer group"
          >
            <KoraAvatar size="md" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                Kora AI
              </div>
              <div className="text-xs text-slate-500 leading-snug">{ctx.tooltip}</div>
            </div>
          </button>

          <button
            type="button"
            aria-label="Ẩn gợi ý Kora AI"
            onClick={() => {
              sessionStorage.setItem(TOOLTIP_DISMISSED_KEY, '1');
              setTooltipDismissed(true);
            }}
            className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Mở Kora AI"
          className="fixed bottom-5 right-4 md:bottom-6 md:right-8 z-50 size-14 rounded-full p-0.5 bg-white border border-blue-200 shadow-[0_10px_28px_rgba(37,99,235,0.25)] hover:scale-105 hover:border-blue-400 transition-all duration-200 cursor-pointer"
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-slate-100">
            <img
              src="/kora-ai-avatar.jpg"
              alt="Kora AI"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <span className="absolute top-0 right-0 size-3.5 rounded-full bg-emerald-400 ring-2 ring-white" />
        </button>
      )}
    </div>
  );
};
