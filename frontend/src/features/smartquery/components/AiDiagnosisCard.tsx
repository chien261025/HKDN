import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Lock,
  Package,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react';
import { AiDiagnosisResponse, DiagnosisEvidence } from '../types';
import { SmartMarkdownText } from './SmartMarkdownText';

interface AiDiagnosisCardProps {
  diagnosis: AiDiagnosisResponse;
  onNavigate?: (targetUrl: string) => void;
  compact?: boolean;
}

const getEvidenceBadgeStyle = (type: string) => {
  switch (type) {
    case 'RESERVATION':
      return {
        qtyColor: 'text-amber-700',
        badge: 'bg-amber-50 text-amber-700 ring-amber-200',
        label: 'Giữ chỗ SO',
        Icon: Lock,
      };
    case 'EXPIRED':
    case 'EXPIRED_BATCH':
      return {
        qtyColor: 'text-rose-700',
        badge: 'bg-rose-50 text-rose-700 ring-rose-200',
        label: 'Lô hết hạn',
        Icon: AlertTriangle,
      };
    case 'EXPIRING':
      return {
        qtyColor: 'text-amber-700',
        badge: 'bg-amber-50 text-amber-700 ring-amber-200',
        label: 'Lô cận hạn',
        Icon: Clock,
      };
    case 'QUARANTINE':
    case 'QUARANTINE_BATCH':
      return {
        qtyColor: 'text-orange-700',
        badge: 'bg-orange-50 text-orange-700 ring-orange-200',
        label: 'QC Hold',
        Icon: Ban,
      };
    case 'LOCKED_BIN':
    case 'INACTIVE_LOCATION':
      return {
        qtyColor: 'text-slate-600',
        badge: 'bg-slate-100 text-slate-700 ring-slate-200',
        label: 'Kệ khóa',
        Icon: Ban,
      };
    case 'OVERLOAD_BIN':
      return {
        qtyColor: 'text-rose-700',
        badge: 'bg-rose-50 text-rose-700 ring-rose-200',
        label: 'Kệ quá tải',
        Icon: AlertTriangle,
      };
    case 'AVAILABLE':
      return {
        qtyColor: 'text-emerald-700',
        badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        label: 'Khả dụng FEFO',
        Icon: CheckCircle2,
      };
    case 'INCOMING_PO':
    case 'INBOUND_PIPELINE':
      return {
        qtyColor: 'text-blue-700',
        badge: 'bg-blue-50 text-blue-700 ring-blue-200',
        label: 'PO / Putaway',
        Icon: Truck,
      };
    case 'OUTBOUND_ORDER':
      return {
        qtyColor: 'text-indigo-700',
        badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
        label: 'Đơn xuất SO',
        Icon: Package,
      };
    default:
      return {
        qtyColor: 'text-slate-700',
        badge: 'bg-slate-100 text-slate-700 ring-slate-200',
        label: type || 'Chứng từ',
        Icon: Layers,
      };
  }
};

export const AiDiagnosisCard: React.FC<AiDiagnosisCardProps> = ({
  diagnosis,
  onNavigate,
  compact = false,
}) => {
  const [showTools, setShowTools] = useState(false);
  const [showAllEvidences, setShowAllEvidences] = useState(false);
  const { breakdown, evidences, recommendations, toolLogs, actions } = diagnosis;
  const visibleEvidences = showAllEvidences ? evidences : (evidences || []).slice(0, compact ? 3 : 5);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-800">Kora AI</span>
        {(diagnosis.warehouseName || diagnosis.warehouseCode) && (
          <>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {diagnosis.warehouseName || diagnosis.warehouseCode}
            </span>
          </>
        )}
        <span>·</span>
        <span>{(diagnosis.executionTimeMs / 1000).toFixed(1)}s</span>
      </div>

      {breakdown && compact && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-800 truncate">
              {breakdown.sku || breakdown.orderCode || 'Tồn kho'}
            </span>
            {breakdown.requestedQty != null && breakdown.requestedQty > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset tabular-nums ${
                  (breakdown.shortageQty ?? 0) > 0
                    ? 'bg-rose-50 text-rose-700 ring-rose-200'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                }`}
              >
                {(breakdown.shortageQty ?? 0) > 0
                  ? `Cần ${breakdown.requestedQty} · Thiếu ${breakdown.shortageQty}`
                  : `Cần ${breakdown.requestedQty} · Đủ`}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums">
            <span className="text-slate-600">
              Vật lý <strong className="text-slate-900">{(breakdown.onHandQty ?? 0).toLocaleString('vi-VN')}</strong>
            </span>
            <span className="text-amber-700">
              Giữ chỗ <strong>{(breakdown.reservedQty ?? 0).toLocaleString('vi-VN')}</strong>
            </span>
            <span className="text-rose-600">
              Khóa <strong>{(breakdown.unavailableQty ?? 0).toLocaleString('vi-VN')}</strong>
            </span>
            <span className={(breakdown.availableQty ?? 0) > 0 ? 'text-emerald-700' : 'text-rose-700'}>
              Khả dụng <strong>{(breakdown.availableQty ?? 0).toLocaleString('vi-VN')}</strong> {breakdown.unit || ''}
            </span>
          </div>
        </div>
      )}

      {breakdown && !compact && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Package className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                {breakdown.orderCode ? `${breakdown.orderCode} · ` : ''}
                {breakdown.sku ? `${breakdown.sku} · ` : ''}
                {breakdown.productName || 'Phân tích tồn kho'}
              </span>
            </div>
            {breakdown.requestedQty != null && breakdown.requestedQty > 0 && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset tabular-nums ${
                  (breakdown.shortageQty ?? 0) > 0
                    ? 'bg-rose-50 text-rose-700 ring-rose-200'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                }`}
              >
                {(breakdown.shortageQty ?? 0) > 0
                  ? `Cần ${breakdown.requestedQty} · Thiếu ${breakdown.shortageQty} ${breakdown.unit || ''}`
                  : `Cần ${breakdown.requestedQty} · Đủ khả dụng`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl bg-white border border-slate-200/90 p-2.5">
              <div className="text-[11px] font-medium text-slate-500">Tồn vật lý</div>
              <div className="text-base font-bold text-slate-900 mt-0.5 tabular-nums">
                {(breakdown.onHandQty ?? 0).toLocaleString('vi-VN')}
                <span className="text-xs font-normal text-slate-400 ml-1">{breakdown.unit || ''}</span>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-slate-200/90 p-2.5">
              <div className="text-[11px] font-medium text-amber-700">Đã giữ chỗ</div>
              <div className="text-base font-bold text-slate-900 mt-0.5 tabular-nums">
                {(breakdown.reservedQty ?? 0).toLocaleString('vi-VN')}
                <span className="text-xs font-normal text-slate-400 ml-1">{breakdown.unit || ''}</span>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-slate-200/90 p-2.5">
              <div className="text-[11px] font-medium text-rose-600">Khóa / Hết hạn</div>
              <div className="text-base font-bold text-slate-900 mt-0.5 tabular-nums">
                {(breakdown.unavailableQty ?? 0).toLocaleString('vi-VN')}
                <span className="text-xs font-normal text-slate-400 ml-1">{breakdown.unit || ''}</span>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-slate-200/90 p-2.5">
              <div
                className={`text-[11px] font-medium ${
                  (breakdown.availableQty ?? 0) > 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                Khả dụng xuất
              </div>
              <div
                className={`text-base font-bold mt-0.5 tabular-nums ${
                  (breakdown.availableQty ?? 0) > 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {(breakdown.availableQty ?? 0).toLocaleString('vi-VN')}
                <span className="text-xs font-normal text-slate-400 ml-1">{breakdown.unit || ''}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <CheckCircle2
              className={`w-3.5 h-3.5 shrink-0 ${
                breakdown.consistent ? 'text-emerald-600' : 'text-amber-600'
              }`}
            />
            <span>
              {breakdown.consistent
                ? 'Khớp chuẩn dữ liệu tồn kho MySQL (Vật lý = Giữ chỗ + Khóa + Khả dụng).'
                : 'Phát hiện chênh lệch số liệu giữa vị trí lưu trữ và tổng hợp tồn kho.'}
            </span>
          </div>
        </div>
      )}

      <SmartMarkdownText
        content={diagnosis.answer}
        onNavigate={onNavigate}
        className={compact ? 'text-[13.5px] leading-relaxed' : 'text-[15px] leading-relaxed'}
      />

      {evidences && evidences.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Chứng từ &amp; lô hàng liên quan ({evidences.length})</span>
          </div>
          <div className="space-y-1.5">
            {visibleEvidences.map((ev: DiagnosisEvidence, idx: number) => {
              const style = getEvidenceBadgeStyle(ev.type);
              const Icon = style.Icon;
              const inner = (
                <div className="rounded-xl border border-slate-200 bg-white group-hover:border-blue-300 group-hover:bg-blue-50/30 p-2.5 transition-colors flex items-center justify-between gap-2.5">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium ring-1 ring-inset ${style.badge}`}
                      >
                        <Icon className="w-2.5 h-2.5" />
                        {style.label}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                        {ev.code}
                      </span>
                      {ev.statusLabel && (
                        <span className="text-[11px] text-slate-500 truncate">
                          · {ev.statusLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-snug truncate" title={ev.detail}>
                      {ev.detail}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ev.qty != null && (
                      <span className={`text-xs font-bold tabular-nums ${style.qtyColor}`}>
                        {ev.qty.toLocaleString('vi-VN')}
                      </span>
                    )}
                    {ev.link && onNavigate && (
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    )}
                  </div>
                </div>
              );

              return ev.link && onNavigate ? (
                <button
                  key={`${ev.code}-${idx}`}
                  type="button"
                  onClick={() => onNavigate(ev.link!)}
                  className="group w-full text-left block cursor-pointer"
                >
                  {inner}
                </button>
              ) : (
                <div key={`${ev.code}-${idx}`} className="group">
                  {inner}
                </div>
              );
            })}
            {evidences.length > (compact ? 3 : 5) && (
              <button
                type="button"
                onClick={() => setShowAllEvidences((prev) => !prev)}
                className="w-full py-1.5 rounded-xl border border-dashed border-slate-200 hover:border-blue-300 hover:text-blue-600 text-xs font-medium text-slate-500 cursor-pointer transition-colors"
              >
                {showAllEvidences
                  ? 'Thu gọn danh sách'
                  : `Xem thêm ${evidences.length - (compact ? 3 : 5)} chứng từ`}
              </button>
            )}
          </div>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 space-y-1.5">
          <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đề xuất xử lý</span>
          </div>
          <ul className="space-y-1 text-xs text-slate-700 list-disc pl-4">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="leading-relaxed">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {actions && actions.length > 0 && onNavigate && (
        <div className="flex flex-wrap gap-1.5">
          {actions.map((act, idx) => (
            <button
              key={`${act.targetUrl}-${idx}`}
              type="button"
              onClick={() => onNavigate(act.targetUrl)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <span>{act.label}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      )}

      {toolLogs && toolLogs.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTools((prev) => !prev)}
            className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              Đã kiểm tra qua {toolLogs.length} Read-Only Tools
            </span>
            {showTools ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showTools && (
            <div className="px-3 pb-2.5 space-y-1.5 border-t border-slate-200 pt-2">
              {toolLogs.map((log, idx) => (
                <div
                  key={`${log.toolName}-${idx}`}
                  className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                >
                  <div className="truncate">
                    <span className="font-semibold text-blue-700">{log.toolName}</span>
                    <span className="text-slate-500 ml-1.5">({log.argsSummary})</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      {log.status}
                    </span>
                    <span className="text-slate-400">{log.durationMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
