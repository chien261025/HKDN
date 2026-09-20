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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Chọn Mẫu Báo Cáo Cần Xuất
        </h2>
        <span className="text-xs text-slate-500 font-mono">Xử lý ngầm không chặn luồng</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {TEMPLATES.map((tmpl) => {
          let accentColor = 'border-slate-200 hover:border-amber-400';
          let iconBg = 'bg-amber-50 text-amber-600 border border-amber-200';

          if (tmpl.colorScheme === 'emerald') {
            accentColor = 'border-slate-200 hover:border-emerald-400';
            iconBg = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
          } else if (tmpl.colorScheme === 'cyan') {
            accentColor = 'border-slate-200 hover:border-blue-400';
            iconBg = 'bg-blue-50 text-blue-600 border border-blue-200';
          } else if (tmpl.colorScheme === 'indigo') {
            accentColor = 'border-slate-200 hover:border-indigo-400';
            iconBg = 'bg-indigo-50 text-indigo-600 border border-indigo-200';
          }

          return (
            <div
              key={tmpl.code}
              className={`bg-white rounded-xl p-4 border ${accentColor} transition-all flex flex-col justify-between space-y-3.5 shadow-sm hover:shadow-md`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`p-2 rounded-lg ${iconBg}`}>
                    <FileSpreadsheet className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-mono text-slate-500 font-bold">
                    {tmpl.estimatedRows}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2.5 line-clamp-1">
                  {tmpl.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                  {tmpl.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onTriggerExport(tmpl)}
                disabled={isProcessing}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Xuất Ngầm ({tmpl.estimatedSize})</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
