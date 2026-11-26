import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Database,
  Download,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { KoraAvatar } from './KoraAvatar';
import { SmartMarkdownText } from './SmartMarkdownText';

const COLUMN_LABELS: Record<string, string> = {
  sku: 'Mã SKU',
  product_name: 'Sản phẩm',
  category_name: 'Danh mục',
  unit: 'ĐVT',
  warehouse_code: 'Mã kho',
  warehouse_name: 'Chi nhánh kho',
  zone_code: 'Phân khu',
  bin_barcode: 'Ô kệ',
  batch_number: 'Số lô',
  expiry_date: 'Hạn sử dụng',
  days_until_expiry: 'Còn (ngày)',
  batch_status: 'Trạng thái lô',
  on_hand_qty: 'Tồn vật lý',
  reserved_qty: 'Giữ chỗ',
  unavailable_qty: 'Khóa / Hết hạn',
  available_qty: 'Khả dụng',
  total_on_hand: 'Tồn vật lý',
  total_reserved: 'Giữ chỗ',
  total_blocked: 'Khóa / Hết hạn',
  total_available: 'Khả dụng',
};

const formatColHeader = (col: string): string =>
  COLUMN_LABELS[col.toLowerCase()] || col.replace(/_/g, ' ');

const formatCellVal = (val: unknown): { text: string; numeric: boolean } => {
  if (val === null || val === undefined) return { text: '—', numeric: false };
  if (typeof val === 'number') {
    return { text: val.toLocaleString('vi-VN'), numeric: true };
  }
  const s = String(val);
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    if (!Number.isNaN(n)) return { text: n.toLocaleString('vi-VN'), numeric: true };
  }
  return { text: s, numeric: false };
};

const resolveCellRoute = (raw: string): string | null => {
  const upper = raw.trim().toUpperCase();
  if (/^(SO|RTV)-[A-Z0-9-]+$/.test(upper)) return '/outbound';
  if (/^PO-[A-Z0-9-]+$/.test(upper)) return '/inbound';
  if (/^SKU-[A-Z0-9-]+$/.test(upper)) return '/inventory';
  if (/^WH0\d$/.test(upper)) return `/layout?warehouse=${upper}`;
  return null;
};

const downloadCsv = (rows: Array<Record<string, unknown>>) => {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = cols.map((c) => esc(formatColHeader(c))).join(',');
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kora-ai-export-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

interface ChatMessageItemProps {
  message: ChatMessage;
  onNavigateAction?: (url: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onNavigateAction,
}) => {
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const handleCopySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.sender === 'user';
  const isRejected = message.astStatus === 'REJECTED';
  const hasTable = !isRejected && Boolean(message.tableData && message.tableData.length > 0);

  if (isUser) {
    return (
      <div className="flex justify-end w-full">
        <div className="max-w-xl rounded-2xl rounded-tr-md bg-slate-100 px-4 py-2.5 text-[15px] text-slate-900 leading-relaxed whitespace-pre-line break-words">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3.5 w-full">
      {isRejected ? (
        <div className="size-8 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4" />
        </div>
      ) : (
        <div className="mt-0.5">
          <KoraAvatar size="md" />
        </div>
      )}

      <div className={`${hasTable ? 'max-w-4xl' : 'max-w-3xl'} flex-1 min-w-0 space-y-3`}>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-800">Kora AI</span>
          {message.executionTimeMs && (
            <>
              <span>·</span>
              <span>{(message.executionTimeMs / 1000).toFixed(1)}s</span>
            </>
          )}
          <span>·</span>
          <span>{message.timestamp}</span>
        </div>

        <SmartMarkdownText
          content={message.text}
          onNavigate={onNavigateAction}
          className="text-[15px] leading-relaxed text-slate-700"
        />

        {isRejected && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Truy vấn bị từ chối bởi chính sách chỉ đọc (Read-Only)</span>
            </div>
            <p className="text-xs text-rose-800/90 leading-relaxed">
              {message.astRejectionReason ||
                'Hệ thống chỉ cho phép câu lệnh SELECT đọc số liệu tồn kho. Các thao tác thay đổi dữ liệu đều bị chặn.'}
            </p>
            {message.sqlQuery && (
              <div className="p-2.5 rounded-lg bg-white border border-rose-200 font-mono text-xs text-rose-700 line-through">
                {message.sqlQuery}
              </div>
            )}
          </div>
        )}

        {!isRejected && message.sqlQuery && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2 text-xs text-slate-600 bg-slate-50/70 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-medium text-slate-700">SQL đã kiểm duyệt AST</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  {(() => {
                    const m = message.sqlQuery?.match(/\bLIMIT\s+(\d+)\b/i);
                    return m ? `LIMIT ${m[1]}` : 'LIMIT 50';
                  })()}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCopySql(message.sqlQuery!)}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-medium">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Chép SQL</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSql((prev) => !prev)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                >
                  <span>{showSql ? 'Ẩn SQL' : 'Xem SQL'}</span>
                  {showSql ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {showSql && (
              <div className="p-3.5 bg-slate-900 border-t border-slate-200 overflow-x-auto">
                <pre className="text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                  {message.sqlQuery}
                </pre>
              </div>
            )}
          </div>
        )}

        {hasTable && message.tableData && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/70 border-b border-slate-200 text-xs gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>Dữ liệu thực tế ({message.tableData.length} dòng)</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 ml-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Đã xác thực
                </span>
              </span>

              <button
                type="button"
                onClick={() => downloadCsv(message.tableData!)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                title="Tải xuống file CSV (Excel)"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Xuất CSV</span>
              </button>
            </div>

            <div className="max-h-72 overflow-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    {Object.keys(message.tableData[0]).map((colKey) => {
                      const isNumericCol = formatCellVal(message.tableData![0][colKey]).numeric;
                      return (
                        <th
                          key={colKey}
                          className={`px-3 py-2.5 font-semibold text-[11.5px] whitespace-nowrap ${
                            isNumericCol ? 'text-right' : 'text-left'
                          }`}
                        >
                          {formatColHeader(colKey)}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {message.tableData.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                      {Object.keys(message.tableData![0]).map((colKey) => {
                        const cell = formatCellVal(row[colKey]);
                        const route = !cell.numeric && onNavigateAction ? resolveCellRoute(cell.text) : null;
                        return (
                          <td
                            key={colKey}
                            title={cell.text}
                            className={`px-3 py-2 whitespace-nowrap ${
                              cell.numeric
                                ? 'font-mono font-semibold text-right tabular-nums text-slate-900'
                                : 'font-medium max-w-[230px] truncate text-slate-700'
                            }`}
                          >
                            {route && onNavigateAction ? (
                              <button
                                type="button"
                                onClick={() => onNavigateAction(route)}
                                className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-700 hover:underline font-medium cursor-pointer"
                              >
                                <span>{cell.text}</span>
                                <ArrowUpRight className="w-3 h-3 opacity-70" />
                              </button>
                            ) : (
                              cell.text
                            )}
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

        {message.actionPayload && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onNavigateAction && onNavigateAction(message.actionPayload!.targetUrl)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-medium text-white transition-colors cursor-pointer"
            >
              <span>{message.actionPayload.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
