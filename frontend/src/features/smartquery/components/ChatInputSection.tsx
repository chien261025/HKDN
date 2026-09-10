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
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
          <Sparkles className="w-3 h-3 text-cyan-400" /> Gợi ý:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSend(prompt)}
            disabled={loading}
            className="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-cyan-300 transition-all font-medium disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 bg-[#0a0f1d] border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Hỏi bất kỳ thông tin kho (VD: 'Tìm các mặt hàng còn dưới 20 cái', 'Thống kê tồn theo Khu A')..."
            className="flex-1 bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50 font-medium"
          />

          {input && (
            <button
              type="button"
              onClick={() => setInput('')}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Xóa nội dung"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:from-slate-800 disabled:to-slate-800 text-white disabled:text-slate-500 rounded-xl shadow-lg shadow-indigo-600/30 font-bold text-xs flex items-center gap-2 transition-all disabled:shadow-none active:scale-95 flex-shrink-0"
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

        <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-slate-500 font-mono">
          <span>Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Enter ↵</kbd> để gửi truy vấn</span>
          <span className="flex items-center gap-1 text-emerald-500/80">
            <CornerDownLeft className="w-3 h-3" /> Auto Sanitize & LIMIT 50 Enforced
          </span>
        </div>
      </form>
    </div>
  );
};
