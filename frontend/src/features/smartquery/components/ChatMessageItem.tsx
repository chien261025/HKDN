import React, { useState } from 'react';
import {
  Sparkles,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Clock,
  ArrowRight,
  Database,
  User,
  ShieldAlert
} from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatMessageItemProps {
  message: ChatMessage;
  onNavigateAction?: (url: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onNavigateAction,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.sender === 'user';
  const isRejected = message.astStatus === 'REJECTED';

  return (
    <div className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      {/* AI Avatar */}
      {!isUser && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
          isRejected
            ? 'bg-rose-50 text-rose-600 border border-rose-200'
            : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
        }`}>
          {isRejected ? <ShieldAlert className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        </div>
      )}

      {/* Message Content Container */}
      <div
        className={`rounded-2xl p-5 space-y-3.5 transition-all text-sm ${
          isUser
            ? 'max-w-xl bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-100'
            : isRejected
            ? 'max-w-3xl w-full bg-rose-50/60 border border-rose-200 rounded-bl-none shadow-sm text-slate-800'
            : 'max-w-3xl w-full bg-white border border-slate-200 rounded-bl-none shadow-sm text-slate-800'
        }`}
      >
        {/* Header line inside bubble */}
        <div className={`flex items-center justify-between gap-4 text-xs pb-2 border-b ${
          isUser ? 'border-white/20' : 'border-slate-100'
        }`}>
          <span className="font-bold flex items-center gap-1.5">
            {isUser ? (
              <>
                <User className="w-4 h-4 text-indigo-200" />
                <span className="text-white">Quản Trị Viên</span>
              </>
            ) : (
              <>
                <span className="text-indigo-700 font-extrabold text-sm">Trợ Lý AI WMS</span>
                {message.executionTimeMs && (
                  <span className="text-slate-500 font-mono text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {message.executionTimeMs}ms
                  </span>
                )}
              </>
            )}
          </span>
          <span className={`text-xs font-mono ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
            {message.timestamp}
          </span>
        </div>

        {/* Text Body */}
        <p className={`leading-relaxed text-sm ${isUser ? 'text-white' : 'text-slate-800'}`}>
          {message.text}
        </p>

        {/* AST Rejection Warning Banner */}
        {isRejected && (
          <div className="p-4 rounded-xl bg-rose-100/70 border border-rose-300 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>CHẶN ĐỨNG BỞI BỘ LỌC AST JSqlParser (Anti-Injection)</span>
            </div>
            <p className="text-xs text-rose-900 leading-normal font-medium">
              {message.astRejectionReason || 'Truy vấn vi phạm chính sách bảo mật: Hệ thống chỉ chấp nhận câu lệnh SELECT đọc số liệu. Các hành động thay đổi dữ liệu hoặc cấu trúc bảng đều bị cấm triệt để.'}
            </p>
            {message.sqlQuery && (
              <div className="mt-2 p-2.5 rounded-lg bg-white border border-rose-200 font-mono text-xs text-rose-700 line-through">
                {message.sqlQuery}
              </div>
            )}
          </div>
        )}

        {/* Sanitized SQL Code Snippet */}
        {!isRejected && message.sqlQuery && (
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700 text-slate-300">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300">Sanitized SQL (AST Verified)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  +LIMIT 50 INJECTED
                </span>
              </div>

              <button
                onClick={() => handleCopySql(message.sqlQuery!)}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Sao chép câu truy vấn SQL"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Chép SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 overflow-x-auto">
              <pre className="text-indigo-200 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                {message.sqlQuery}
              </pre>
            </div>
          </div>
        )}

        {/* Table Data Preview */}
        {!isRejected && message.tableData && message.tableData.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-600 px-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Kết quả thực thi cơ sở dữ liệu ({message.tableData.length} bản ghi)</span>
              </span>
              <span className="text-emerald-700 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Truy vấn hợp lệ
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left font-mono text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    {Object.keys(message.tableData[0]).map((colKey) => (
                      <th key={colKey} className="px-4 py-2.5 font-bold uppercase tracking-wider text-xs text-slate-600 font-sans">
                        {colKey}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {message.tableData.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                      {Object.values(row).map((val: any, cIdx) => (
                        <td key={cIdx} className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-800">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Button Payload */}
        {message.actionPayload && (
          <div className="pt-1">
            <button
              onClick={() => onNavigateAction && onNavigateAction(message.actionPayload!.targetUrl)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <span>{message.actionPayload.label}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm font-bold">
          U
        </div>
      )}
    </div>
  );
};
