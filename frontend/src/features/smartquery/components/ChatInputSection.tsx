import React, { useState } from 'react';
import { ArrowUp, Loader2, Sparkles, X } from 'lucide-react';

interface ChatInputSectionProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (textToSend?: string) => void;
  loading: boolean;
  quickPrompts: string[];
  showPrompts?: boolean;
}

export const ChatInputSection: React.FC<ChatInputSectionProps> = ({
  input,
  setInput,
  onSend,
  loading,
  quickPrompts,
  showPrompts = false,
}) => {
  const [promptPopoverOpen, setPromptPopoverOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && input.trim()) {
      setPromptPopoverOpen(false);
      onSend();
    }
  };

  return (
    <div className="relative space-y-2">
      {showPrompts && promptPopoverOpen && quickPrompts.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setPromptPopoverOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-2 shadow-lg z-20 space-y-1">
            <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">
              Câu hỏi gợi ý
            </div>
            {quickPrompts.map((p) => (
              <button
                key={p}
                type="button"
                disabled={loading}
                onClick={() => {
                  setPromptPopoverOpen(false);
                  onSend(p);
                }}
                className="w-full text-left rounded-xl px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white pl-3 pr-2 py-2 shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition-all focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50"
      >
        {showPrompts && quickPrompts.length > 0 && (
          <button
            type="button"
            disabled={loading}
            onClick={() => setPromptPopoverOpen((prev) => !prev)}
            title="Chọn câu hỏi gợi ý"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Gợi ý</span>
          </button>
        )}

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Hỏi Kora AI về đơn SO, tồn khả dụng, lô cận hạn, PO chờ cất kệ..."
          className="flex-1 min-w-0 bg-transparent px-1 py-1.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
        />
        {input && !loading && (
          <button
            type="button"
            onClick={() => setInput('')}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            title="Xóa nội dung"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Gửi câu hỏi"
          className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
        </button>
      </form>

      <p className="text-center text-[11px] text-slate-400">
        Kora AI (Powered by Gemini) có thể sai sót · Dữ liệu chỉ đọc theo quyền RBAC
      </p>
    </div>
  );
};
