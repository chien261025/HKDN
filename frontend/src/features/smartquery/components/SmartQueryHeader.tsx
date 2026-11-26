import React, { useState } from 'react';
import { Building2, History, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { KoraAvatar } from './KoraAvatar';

export interface SavedChatSession {
  id: string;
  title: string;
  warehouseCode: string;
  updatedAt: string;
  messages: ChatMessage[];
}

interface WarehouseOption {
  code: string;
  name: string;
}

interface SmartQueryHeaderProps {
  onClearHistory: () => void;
  messageCount: number;
  warehouses?: WarehouseOption[];
  selectedWarehouse?: string;
  onWarehouseChange?: (code: string) => void;
  sessions?: SavedChatSession[];
  activeSessionId?: string;
  onSelectSession?: (session: SavedChatSession) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export const SmartQueryHeader: React.FC<SmartQueryHeaderProps> = ({
  onClearHistory,
  messageCount,
  warehouses = [],
  selectedWarehouse = 'ALL',
  onWarehouseChange,
  sessions = [],
  activeSessionId,
  onSelectSession,
  onDeleteSession,
}) => {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <KoraAvatar size="md" />
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h1 className="text-base font-semibold text-slate-900 tracking-tight">Kora AI</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <ShieldCheck className="w-3 h-3" />
            Chỉ đọc · RBAC
          </span>
          <span className="hidden md:inline text-xs text-slate-400">· Powered by Gemini</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {onWarehouseChange && warehouses.length > 0 && (
          <label className="flex items-center gap-2 h-8 rounded-lg border border-slate-200 bg-white px-2.5 hover:border-slate-300 transition-colors">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              aria-label="Phạm vi kho Kora AI"
              value={selectedWarehouse}
              onChange={(e) => onWarehouseChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer max-w-[230px]"
            >
              <option value="ALL">Kho được phân quyền (mặc định)</option>
              {warehouses.map((wh) => (
                <option key={wh.code} value={wh.code}>
                  {wh.code} — {wh.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {sessions.length > 0 && onSelectSession && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setHistoryOpen((p) => !p)}
              className="inline-flex items-center gap-1.5 h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Lịch sử ({sessions.length})</span>
            </button>

            {historyOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setHistoryOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-80 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg z-30 p-1.5 space-y-1">
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Phiên hỏi gần đây
                  </div>
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`group flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors ${
                        s.id === activeSessionId
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSession(s);
                          setHistoryOpen(false);
                        }}
                        className="flex-1 text-left min-w-0 cursor-pointer"
                      >
                        <div className="font-medium truncate">{s.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {s.warehouseCode === 'ALL' ? 'Mặc định' : s.warehouseCode} · {s.updatedAt}
                        </div>
                      </button>
                      {onDeleteSession && (
                        <button
                          type="button"
                          aria-label="Xóa phiên"
                          onClick={() => onDeleteSession(s.id)}
                          className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {messageCount > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="inline-flex items-center gap-1 h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cuộc trò chuyện mới</span>
          </button>
        )}
      </div>
    </div>
  );
};
