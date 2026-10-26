import React from 'react';

export type StatTagVariant = 'indigo' | 'amber' | 'blue' | 'emerald' | 'rose' | 'purple';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  tagText?: string;
  tagVariant?: StatTagVariant;
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const tagStyles: Record<StatTagVariant, { bg: string; text: string; border: string; accent: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', accent: 'from-indigo-500 to-indigo-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', accent: 'from-amber-400 to-amber-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', accent: 'from-blue-500 to-cyan-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', accent: 'from-emerald-400 to-emerald-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', accent: 'from-rose-500 to-pink-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', accent: 'from-purple-500 to-indigo-500' },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  tagText,
  tagVariant = 'indigo',
  icon,
  onClick,
  className = '',
}) => {
  const currentTag = tagStyles[tagVariant];

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 hover:shadow-lg transition-all duration-200 overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${currentTag.accent} opacity-80 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
            {value}
          </div>
          {tagText && (
            <div className="pt-1">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${currentTag.bg} ${currentTag.text} ${currentTag.border}`}
              >
                {tagText}
              </span>
            </div>
          )}
        </div>

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs group-hover:scale-105 transition-transform flex-shrink-0 ${currentTag.bg} ${currentTag.text} ${currentTag.border}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};
