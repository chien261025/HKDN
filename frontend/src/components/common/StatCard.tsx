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

const tagStyles: Record<StatTagVariant, { bg: string; text: string; border: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
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
      className={`rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer hover:border-indigo-300' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs sm:text-sm font-semibold text-slate-600 block">{title}</span>
          <span className="text-3xl font-extrabold text-slate-900 mt-2 block tracking-tight font-mono">
            {value}
          </span>
          {tagText && (
            <span
              className={`inline-block mt-2 text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentTag.bg} ${currentTag.text} ${currentTag.border}`}
            >
              {tagText}
            </span>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center border ${currentTag.bg} ${currentTag.text} ${currentTag.border}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};
