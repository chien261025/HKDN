import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export interface SmartPromptItem {
  label: string;
  query: string;
}

interface SmartPromptGridProps {
  prompts: Array<string | SmartPromptItem>;
  onSelect: (query: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const SmartPromptGrid: React.FC<SmartPromptGridProps> = ({
  prompts,
  onSelect,
  disabled = false,
  compact = false,
}) => {
  if (!prompts || prompts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {prompts.map((item, idx) => {
        const label = typeof item === 'string' ? item : item.label;
        const query = typeof item === 'string' ? item : item.query;
        return (
          <button
            key={`${label}-${idx}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(query)}
            className={`group flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white text-left transition-all hover:border-blue-300 hover:bg-blue-50/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              compact ? 'px-3 py-2' : 'px-3.5 py-2.5'
            }`}
          >
            <span className="text-[12.5px] font-medium leading-snug text-slate-700 group-hover:text-blue-700 line-clamp-2">
              {label}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </button>
        );
      })}
    </div>
  );
};
