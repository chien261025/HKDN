import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface SmartMarkdownTextProps {
  content?: string | null;
  className?: string;
  onNavigate?: (targetUrl: string) => void;
}

const ENTITY_PATTERN = /\b((?:SO|RTV|PO|SKU)-[A-Z0-9-]+|WH0\d)\b/g;

const resolveEntityRoute = (code: string): string | null => {
  const upper = code.toUpperCase();
  if (upper.startsWith('SO-') || upper.startsWith('RTV-')) return '/outbound';
  if (upper.startsWith('PO-')) return '/inbound';
  if (upper.startsWith('SKU-')) return '/inventory';
  if (/^WH0\d$/.test(upper)) return `/layout?warehouse=${upper}`;
  return null;
};

const renderTextWithEntities = (
  text: string,
  keyPrefix: string,
  onNavigate?: (targetUrl: string) => void
): React.ReactNode[] => {
  if (!onNavigate) {
    return [<React.Fragment key={`${keyPrefix}-plain`}>{text}</React.Fragment>];
  }
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(ENTITY_PATTERN.source, 'g');
  let idx = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <React.Fragment key={`${keyPrefix}-p-${idx++}`}>
          {text.slice(lastIndex, match.index)}
        </React.Fragment>
      );
    }
    const code = match[1];
    const route = resolveEntityRoute(code);
    if (route) {
      parts.push(
        <button
          key={`${keyPrefix}-e-${idx++}`}
          type="button"
          onClick={() => onNavigate(route)}
          title={`Mở phân hệ tương ứng (${route})`}
          className="mx-0.5 inline-flex items-baseline gap-0.5 rounded bg-[#3b6fd4]/10 px-1.5 py-0.5 font-hud text-[0.9em] font-semibold text-[#3b6fd4] hover:bg-[#3b6fd4]/20 hover:underline underline-offset-2 transition-colors cursor-pointer"
        >
          <span>{code}</span>
          <ArrowUpRight className="w-2.5 h-2.5 self-center shrink-0 opacity-80" />
        </button>
      );
    } else {
      parts.push(<React.Fragment key={`${keyPrefix}-n-${idx++}`}>{code}</React.Fragment>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(
      <React.Fragment key={`${keyPrefix}-end`}>{text.slice(lastIndex)}</React.Fragment>
    );
  }
  return parts.length > 0 ? parts : [<React.Fragment key={`${keyPrefix}-raw`}>{text}</React.Fragment>];
};

const renderInlineCodeOrItalic = (
  text: string,
  keyPrefix: string,
  onNavigate?: (targetUrl: string) => void
): React.ReactNode[] => {
  const tokens = text.split(/(`[^`]+`|\*[^*\n]+\*)/g);
  return tokens.map((tok, idx) => {
    if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 2) {
      const inner = tok.slice(1, -1);
      const route = onNavigate ? resolveEntityRoute(inner.trim()) : null;
      if (route && onNavigate) {
        return (
          <button
            key={`${keyPrefix}-ce-${idx}`}
            type="button"
            onClick={() => onNavigate(route)}
            title={`Mở phân hệ (${route})`}
            className="mx-0.5 inline-flex items-baseline gap-0.5 rounded bg-[#3b6fd4]/10 px-1.5 py-0.5 font-mono text-[0.86em] font-semibold text-[#3b6fd4] hover:bg-[#3b6fd4]/20 hover:underline underline-offset-2 transition-colors cursor-pointer"
          >
            <span>{inner}</span>
            <ArrowUpRight className="w-2.5 h-2.5 self-center shrink-0" />
          </button>
        );
      }
      return (
        <code
          key={`${keyPrefix}-c-${idx}`}
          className="px-1.5 py-0.5 rounded bg-[#3b6fd4]/8 text-[#2f5ab0] border border-[#3b6fd4]/15 font-mono text-[11px]"
        >
          {inner}
        </code>
      );
    }
    if (
      tok.startsWith('*') &&
      tok.endsWith('*') &&
      !tok.startsWith('**') &&
      tok.length > 2
    ) {
      return (
        <em key={`${keyPrefix}-i-${idx}`} className="italic text-[#45454f]">
          {tok.slice(1, -1)}
        </em>
      );
    }
    return (
      <React.Fragment key={`${keyPrefix}-t-${idx}`}>
        {renderTextWithEntities(tok, `${keyPrefix}-e-${idx}`, onNavigate)}
      </React.Fragment>
    );
  });
};

const renderInlineRich = (
  text: string,
  lineIdx: number,
  onNavigate?: (targetUrl: string) => void
): React.ReactNode[] => {
  const boldSegments = text.split(/(\*\*[^*\n]+\*\*)/g);
  return boldSegments.map((seg, idx) => {
    if (seg.startsWith('**') && seg.endsWith('**') && seg.length > 4) {
      return (
        <strong key={`b-${lineIdx}-${idx}`} className="font-semibold text-[#0a0a0d]">
          {renderInlineCodeOrItalic(seg.slice(2, -2), `bi-${lineIdx}-${idx}`, onNavigate)}
        </strong>
      );
    }
    return (
      <React.Fragment key={`r-${lineIdx}-${idx}`}>
        {renderInlineCodeOrItalic(seg, `ri-${lineIdx}-${idx}`, onNavigate)}
      </React.Fragment>
    );
  });
};

export const SmartMarkdownText: React.FC<SmartMarkdownTextProps> = ({
  content,
  className = '',
  onNavigate,
}) => {
  const cleanedContent = (content || '')
    .replace(/\$\\rightarrow\$/g, '→')
    .replace(/\$\\to\$/g, '→')
    .replace(/\$\\le\$/g, '≤')
    .replace(/\$\\ge\$/g, '≥')
    .replace(/\$\\approx\$/g, '≈');
  const lines = cleanedContent.split('\n');

  return (
    <div className={`space-y-2 text-slate-700 ${className || 'text-sm leading-relaxed'}`}>
      {lines.map((rawLine, lineIdx) => {
        const trimmed = rawLine.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1" />;
        }
        if (/^[-*_]{3,}$/.test(trimmed)) {
          return <hr key={lineIdx} className="border-[#0a0a0d]/10 my-2" />;
        }
        const headingMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
        if (headingMatch) {
          return (
            <div
              key={lineIdx}
              className="font-hud text-xs sm:text-[13px] font-bold tracking-wide text-[#0a0a0d] pt-1.5 pb-1 border-b border-[#0a0a0d]/10"
            >
              {renderInlineRich(headingMatch[1], lineIdx, onNavigate)}
            </div>
          );
        }
        const bulletMatch = rawLine.match(/^(\s*)[\*\-]\s+(.+)$/);
        if (bulletMatch) {
          const isNested = bulletMatch[1].length >= 2;
          return (
            <div
              key={lineIdx}
              className={`flex items-start gap-2 ${isNested ? 'pl-5' : 'pl-1'}`}
            >
              <span className="text-[#3b6fd4] font-bold leading-relaxed shrink-0">
                {isNested ? '◦' : '•'}
              </span>
              <div className="flex-1 min-w-0">
                {renderInlineRich(bulletMatch[2], lineIdx, onNavigate)}
              </div>
            </div>
          );
        }
        return (
          <div key={lineIdx} className="min-w-0">
            {renderInlineRich(trimmed, lineIdx, onNavigate)}
          </div>
        );
      })}
    </div>
  );
};
