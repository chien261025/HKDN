import React from 'react';
import { Send, Sparkles, CornerDownLeft, Loader2, X } from 'lucide-react';

interface ChatInputSectionProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (textToSend?: string) => void;
  loading: boolean;
  quickPrompts: string[];
}

export const ChatInputSection: React.FC<ChatInputSectionProps> = ({
  input,
  setInput,
  onSend,
  loading,
  quickPrompts,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && input.trim()) {
      onSend();
    }
  };

  return (
    <div className="pt-2 space-y-2.5">
      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Gợi ý:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSend(prompt)}
            disabled={loading}
            className="flex-shrink-0 text-xs px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 transition-all font-semibold shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-2xl p-1.5 shadow-sm focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Hỏi bất kỳ thông tin kho (VD: 'Tìm các mặt hàng còn dưới 20 cái', 'Thống kê tồn theo Khu A')..."
            className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none disabled:opacity-50 font-medium"
          />

          {input && (
            <button
              type="button"
              onClick={() => setInput('')}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Xóa nội dung"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl shadow-sm font-bold text-xs flex items-center gap-2 transition-all active:scale-95 flex-shrink-0 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">AST Kiểm Duyệt...</span>
              </>
            ) : (
              <>
                <span>Gửi</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between px-2 pt-1.5 text-xs text-slate-500 font-medium">
          <span>Nhấn <kbd className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-xs">Enter ↵</kbd> để gửi truy vấn</span>
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <CornerDownLeft className="w-3.5 h-3.5 text-emerald-600" /> Auto Sanitize & LIMIT 50 Enforced
          </span>
        </div>
      </form>
    </div>
  );
};
