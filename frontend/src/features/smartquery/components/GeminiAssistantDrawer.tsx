import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUp,
  Maximize2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { AiDiagnoseRequest, AiDiagnosisResponse } from '../types';
import { smartQueryApi } from '../services/smartQueryApi';
import { AiDiagnosisCard } from './AiDiagnosisCard';
import { KoraAvatar } from './KoraAvatar';
import { SmartPromptGrid } from './SmartPromptGrid';

export interface GeminiAssistantContext {
  title?: string;
  warehouseCode?: string;
  orderCode?: string;
  sku?: string;
  productName?: string;
  requestedQty?: number;
  initialQuestion?: string;
}

interface GeminiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  context?: GeminiAssistantContext | null;
}

interface DrawerEntry {
  id: string;
  question: string;
  diagnosis?: AiDiagnosisResponse;
  error?: string;
}

const buildAutoQuestion = (ctx?: GeminiAssistantContext | null): string => {
  if (ctx?.initialQuestion) return ctx.initialQuestion;
  if (ctx?.orderCode) {
    return `Phân tích nguyên nhân và khả năng đáp ứng tồn kho của đơn ${ctx.orderCode}${
      ctx.warehouseCode && ctx.warehouseCode !== 'ALL' ? ` tại kho ${ctx.warehouseCode}` : ''
    }.`;
  }
  if (ctx?.sku) {
    return `Tại sao SKU ${ctx.sku}${
      ctx.productName ? ` (${ctx.productName})` : ''
    } ${ctx.requestedQty ? `không đủ xuất ${ctx.requestedQty} đơn vị` : 'bị lệch giữa tồn vật lý và tồn khả dụng'}${
      ctx.warehouseCode && ctx.warehouseCode !== 'ALL' ? ` tại kho ${ctx.warehouseCode}` : ''
    }?`;
  }
  return `Tổng hợp các sự cố tồn kho, đơn chờ xuất và cảnh báo cận hạn/QC Hold${
    ctx?.warehouseCode && ctx.warehouseCode !== 'ALL' ? ` tại kho ${ctx.warehouseCode}` : ''
  }.`;
};

export const GeminiAssistantDrawer: React.FC<GeminiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  context,
}) => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DrawerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Đang xác thực quyền kho...');
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const normalizedWh = useMemo(() => {
    const raw = context?.warehouseCode?.trim();
    if (!raw || raw === 'ALL') return undefined;
    if (raw.startsWith('WH')) return raw;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? raw : `WH0${n}`;
  }, [context?.warehouseCode]);

  const contextKey = useMemo(
    () =>
      JSON.stringify({
        wh: normalizedWh || 'ALL',
        so: context?.orderCode || '',
        sku: context?.sku || '',
        qty: context?.requestedQty || 0,
        q: context?.initialQuestion || '',
      }),
    [normalizedWh, context?.orderCode, context?.sku, context?.requestedQty, context?.initialQuestion]
  );

  useEffect(() => {
    if (!loading) return;
    setLoadingStep('Đang xác thực quyền kho...');
    const t1 = setTimeout(() => setLoadingStep('Đang đối chiếu tồn kho & chứng từ...'), 1400);
    const t2 = setTimeout(() => setLoadingStep('Kora AI đang tổng hợp kết quả...'), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  const runDiagnosis = async (questionText: string, includeStructuredContext: boolean) => {
    const entryId = `diag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setEntries((prev) => [...prev, { id: entryId, question: questionText }]);
    setLoading(true);
    try {
      const payload: AiDiagnoseRequest = {
        question: questionText,
        warehouseCode: normalizedWh,
        orderCode: includeStructuredContext ? context?.orderCode : undefined,
        sku: includeStructuredContext ? context?.sku : undefined,
        requestedQty: includeStructuredContext ? context?.requestedQty : undefined,
      };
      const result = await smartQueryApi.diagnose(payload);
      setEntries((prev) =>
        prev.map((item) => (item.id === entryId ? { ...item, diagnosis: result } : item))
      );
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      const errMsg =
        status === 403
          ? serverMsg ||
            'Bạn không có quyền sử dụng Kora AI cho phạm vi kho này (RBAC).'
          : serverMsg || 'Không thể kết nối tới dịch vụ Kora AI. Vui lòng thử lại.';
      setEntries((prev) =>
        prev.map((item) => (item.id === entryId ? { ...item, error: errMsg } : item))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('gemini-drawer-visibility', { detail: isOpen }));
    return () => {
      window.dispatchEvent(new CustomEvent('gemini-drawer-visibility', { detail: false }));
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setEntries([]);
    const initialQ = buildAutoQuestion(context);
    void runDiagnosis(initialQ, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, contextKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, loading]);

  if (!isOpen) return null;

  const quickPrompts = [
    {
      label: normalizedWh ? `Điểm nghẽn kho ${normalizedWh}` : 'Điểm nghẽn toàn kho',
      query: normalizedWh
        ? `Tổng hợp điểm nghẽn và hàng chờ Putaway tại ${normalizedWh}`
        : 'Tổng hợp điểm nghẽn tồn kho và đơn chờ xuất',
    },
    {
      label: context?.sku ? `Hàng đang về (${context.sku})` : 'Lô hết hạn & QC Hold',
      query: context?.sku
        ? `Kiểm tra đơn nhập PO đang về hoặc hàng chờ Putaway của ${context.sku}`
        : 'Kiểm tra lô hàng cận hạn, hết hạn và đang QC Hold',
    },
    {
      label: 'Đơn SO đang giữ chỗ',
      query: 'Những đơn xuất kho SO nào đang giữ chỗ (Reserved) nhiều nhất?',
    },
    {
      label: 'Ô kệ quá tải / khóa',
      query: 'Kiểm tra các ô kệ đang vượt tải trọng hoặc bị khóa bảo trì',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput('');
    void runDiagnosis(trimmed, false);
  };

  const handleNavigate = (url: string) => {
    onClose();
    navigate(url);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Kora AI SMART WMS"
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white border-b border-slate-100 px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <KoraAvatar size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                  {context?.title || 'Kora AI'}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Chỉ đọc · RBAC
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                Phân tích kho vận · {normalizedWh ? `Kho ${normalizedWh}` : 'Phạm vi được phân quyền'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleNavigate('/smartquery')}
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium cursor-pointer transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Toàn màn hình</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng Kora AI"
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
          {entries.map((entry) => (
            <div key={entry.id} className="space-y-4">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-slate-100 px-4 py-2.5 text-sm leading-relaxed text-slate-900">
                  {entry.question}
                </div>
              </div>

              {entry.diagnosis && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <KoraAvatar size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <AiDiagnosisCard
                      diagnosis={entry.diagnosis}
                      onNavigate={handleNavigate}
                      compact
                    />
                  </div>
                </div>
              )}

              {entry.error && (
                <div role="alert" className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                    <div className="font-semibold text-rose-900">Không thể xử lý yêu cầu</div>
                    <p className="mt-0.5 leading-relaxed">{entry.error}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <KoraAvatar size="sm" pulse />
              <span className="text-xs text-slate-500">{loadingStep}</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="bg-white border-t border-slate-100 p-4 space-y-3 shrink-0">
          <SmartPromptGrid
            prompts={quickPrompts}
            onSelect={(q) => void runDiagnosis(q, false)}
            disabled={loading}
            compact
          />

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 pl-4 pr-1.5 py-1.5 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:ring-3 focus-within:ring-blue-50"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Hỏi tiếp Kora AI (VD: Có lô nào sắp về thay thế không?)..."
              className="flex-1 bg-transparent py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Gửi câu hỏi tới Kora AI"
              className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-400">
            Kora AI (Powered by Gemini) có thể sai sót · Đối chiếu chứng từ kho trước khi xử lý
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};
