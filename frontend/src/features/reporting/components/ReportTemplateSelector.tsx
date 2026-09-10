import React from 'react';
import { Send, FileSpreadsheet, Database, Clock, Layers, ShieldCheck } from 'lucide-react';
import { ReportTemplate } from '../types';

interface ReportTemplateSelectorProps {
  onTriggerExport: (template: ReportTemplate) => void;
  isProcessing: boolean;
}

const TEMPLATES: ReportTemplate[] = [
  {
    code: 'RPT-LEDGER',
    title: 'Sổ Cái Biến Động Kho (Stock Ledger)',
    category: 'Kiểm Toán',
    description: 'Toàn bộ biến động xuất/nhập/khóa giữ',
    estimatedRows: '50,000 dòng',
    estimatedSize: '~4.2 MB',
    icon: 'Database',
    colorScheme: 'amber',
  },
  {
    code: 'RPT-EXPIRY',
    title: 'Cân Đối Tồn & Hạn Dùng FEFO',
    category: 'Hạn Dùng',
    description: 'Tổng hợp các lô hàng cận date 30-90 ngày',
    estimatedRows: '15,000 dòng',
    estimatedSize: '~1.8 MB',
    icon: 'Clock',
    colorScheme: 'emerald',
  },
  {
    code: 'RPT-TOPOLOGY',
    title: 'Tải Trọng & Lấp Đầy Vị Trí Ô Kệ',
    category: 'Mặt Bằng',
    description: 'Tỷ lệ lấp đầy & sức chứa Dãy/Kệ/Tầng',
    estimatedRows: '8,000 dòng',
    estimatedSize: '~950 KB',
    icon: 'Layers',
    colorScheme: 'cyan',
  },
  {
    code: 'RPT-LOCKS',
    title: 'Nhật Ký Khóa Giữ & Tranh Chấp',
    category: 'Kỹ Thuật',
    description: 'Kiểm toán các giao dịch Pessimistic Lock',
    estimatedRows: '25,000 dòng',
    estimatedSize: '~2.5 MB',
    icon: 'ShieldCheck',
    colorScheme: 'indigo',
  },
];

export const ReportTemplateSelector: React.FC<ReportTemplateSelectorProps> = ({
  onTriggerExport,
  isProcessing,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Chọn Mẫu Báo Cáo Cần Xuất
        </h2>
        <span className="text-[11px] text-slate-500 font-mono">Xử lý ngầm không chặn luồng</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TEMPLATES.map((tmpl) => {
          let accentColor = 'border-slate-800 hover:border-amber-500/40';
          let iconBg = 'bg-amber-500/10 text-amber-400';

          if (tmpl.colorScheme === 'emerald') {
            accentColor = 'border-slate-800 hover:border-emerald-500/40';
            iconBg = 'bg-emerald-500/10 text-emerald-400';
          } else if (tmpl.colorScheme === 'cyan') {
            accentColor = 'border-slate-800 hover:border-cyan-500/40';
            iconBg = 'bg-cyan-500/10 text-cyan-400';
          } else if (tmpl.colorScheme === 'indigo') {
            accentColor = 'border-slate-800 hover:border-indigo-500/40';
            iconBg = 'bg-indigo-500/10 text-indigo-400';
          }

          return (
            <div
              key={tmpl.code}
              className={`bg-[#0d1322]/80 rounded-xl p-3.5 border ${accentColor} transition-all flex flex-col justify-between space-y-3 shadow-md`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`p-1.5 rounded-lg ${iconBg}`}>
                    <FileSpreadsheet className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    {tmpl.estimatedRows}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-white mt-2 line-clamp-1">
                  {tmpl.title}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {tmpl.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onTriggerExport(tmpl)}
                disabled={isProcessing}
                className="w-full py-1.5 px-3 bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
              >
                <Send className="w-3 h-3" />
                <span>Xuất Ngầm ({tmpl.estimatedSize})</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
