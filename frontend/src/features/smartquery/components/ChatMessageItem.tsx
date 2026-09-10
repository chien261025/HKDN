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
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
          isRejected
            ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
            : 'bg-slate-800/90 text-cyan-400 border border-slate-700/80'
        }`}>
          {isRejected ? <ShieldAlert className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </div>
      )}

      {/* Message Content Container */}
      <div
        className={`rounded-2xl p-4.5 space-y-3.5 transition-all text-xs ${
          isUser
            ? 'max-w-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none shadow-lg shadow-indigo-950/50'
            : isRejected
            ? 'max-w-3xl w-full bg-[#130d14] border border-rose-800/60 rounded-bl-none shadow-xl text-slate-200'
            : 'max-w-3xl w-full bg-[#0d1322]/90 border border-slate-800/80 rounded-bl-none shadow-xl text-slate-200'
        }`}
      >
        {/* Header line inside bubble */}
        <div className="flex items-center justify-between gap-4 text-[11px] pb-1 border-b border-white/10">
          <span className="font-bold flex items-center gap-1.5 opacity-90">
            {isUser ? (
              <>
                <User className="w-3.5 h-3.5 text-indigo-200" />
                <span>Quản Trị Viên</span>
              </>
            ) : (
              <>
                <span className="text-cyan-400 font-extrabold">Trợ Lý AI WMS</span>
                {message.executionTimeMs && (
                  <span className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> {message.executionTimeMs}ms
                  </span>
                )}
              </>
            )}
          </span>
          <span className="text-[10px] font-mono opacity-60">{message.timestamp}</span>
        </div>

        {/* Text Body */}
        <p className={`leading-relaxed text-xs sm:text-[13px] ${isUser ? 'text-white' : 'text-slate-200'}`}>
          {message.text}
        </p>

        {/* AST Rejection Warning Banner */}
        {isRejected && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>CHẶN ĐỨNG BỞI BỘ LỌC AST JSqlParser (Anti-Injection)</span>
            </div>
            <p className="text-[11px] text-rose-200/90 leading-normal">
              {message.astRejectionReason || 'Truy vấn vi phạm chính sách bảo mật: Hệ thống chỉ chấp nhận câu lệnh SELECT đọc số liệu. Các hành động thay đổi dữ liệu hoặc cấu trúc bảng đều bị cấm triệt để.'}
            </p>
            {message.sqlQuery && (
              <div className="mt-2 p-2 rounded-lg bg-black/60 border border-rose-900/60 font-mono text-[11px] text-rose-400/90 line-through">
                {message.sqlQuery}
              </div>
            )}
          </div>
        )}

        {/* Sanitized SQL Code Snippet */}
        {!isRejected && message.sqlQuery && (
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#070b14] shadow-inner font-mono text-xs">
            <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/80 border-b border-slate-800 text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-bold text-cyan-300">Sanitized SQL (AST Verified)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  +LIMIT 50 INJECTED
                </span>
              </div>

              <button
                onClick={() => handleCopySql(message.sqlQuery!)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
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

            <div className="p-3.5 overflow-x-auto">
              <pre className="text-indigo-300 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {message.sqlQuery}
              </pre>
            </div>
          </div>
        )}

        {/* Table Data Preview */}
        {!isRejected && message.tableData && message.tableData.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Kết quả thực thi cơ sở dữ liệu ({message.tableData.length} bản ghi)</span>
              </span>
              <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Truy vấn hợp lệ
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090d18]">
              <table className="w-full text-left font-mono text-[11px] divide-y divide-slate-800/80">
                <thead className="bg-slate-900/90 text-slate-300">
                  <tr>
                    {Object.keys(message.tableData[0]).map((colKey) => (
                      <th key={colKey} className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                        {colKey}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {message.tableData.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                      {Object.values(row).map((val: any, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 whitespace-nowrap font-medium">
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
            >
              <span>{message.actionPayload.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md font-bold">
          U
        </div>
      )}
    </div>
  );
};
