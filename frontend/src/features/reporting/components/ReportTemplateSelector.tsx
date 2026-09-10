import React from 'react';
import { Send, Clock, Database, Layers, ShieldAlert, Sparkles } from 'lucide-react';
import { ReportTemplate } from '../types';

interface ReportTemplateSelectorProps {
  onTriggerExport: (template: ReportTemplate) => void;
  isProcessing: boolean;
}

const TEMPLATES: ReportTemplate[] = [
  {
    code: 'RPT-LEDGER',
    title: 'Sổ Cái Biến Động Kho (Stock Ledger)',
    category: 'Kiểm Toán & Bất Biến (Audit)',
    description: 'Toàn bộ lịch sử giao dịch xuất/nhập/khóa giữ theo thời gian thực (Append-Only).',
    estimatedRows: '50,000 dòng',
    estimatedSize: '~4.2 MB',
    icon: 'Database',
    colorScheme: 'amber',
  },
  {
    code: 'RPT-EXPIRY',
    title: 'Cân Đối Tồn & Hạn Dùng FEFO',
    category: 'Hạn Dùng & Cảnh Báo Cận Date',
    description: 'Thống kê chi tiết từng lô hàng, ngày hết hạn và số lượng khả dụng theo chuẩn FEFO.',
    estimatedRows: '15,000 dòng',
    estimatedSize: '~1.8 MB',
    icon: 'Clock',
    colorScheme: 'emerald',
  },
  {
    code: 'RPT-TOPOLOGY',
    title: 'Tải Trọng & Lấp Đầy Vị Trí Ô Kệ',
    category: 'Mặt Bằng & Sức Chứa Không Gian',
    description: 'Báo cáo trực quan tỷ lệ lấp đầy, sức chịu tải an toàn (kg) theo Dãy, Kệ, Tầng.',
    estimatedRows: '8,000 dòng',
    estimatedSize: '~950 KB',
    icon: 'Layers',
    colorScheme: 'cyan',
  },
  {
    code: 'RPT-LOCKS',
    title: 'Nhật Ký Khóa Giữ & Tranh Chấp',
    category: 'Kỹ Thuật Concurrency Lock',
    description: 'Kiểm toán các giao dịch kích hoạt khóa bi quan (Pessimistic Lock) khi xuất hàng đồng thời.',
    estimatedRows: '25,000 dòng',
    estimatedSize: '~2.5 MB',
    icon: 'ShieldAlert',
    colorScheme: 'indigo',
  },
];

export const ReportTemplateSelector: React.FC<ReportTemplateSelectorProps> = ({
  onTriggerExport,
  isProcessing,
}) => {
  return (
    <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl p-4.5 border border-slate-800/80 shadow-xl space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Danh Mục Báo Cáo Dữ Liệu Lớn Sẵn Sàng Xuất
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">4 Mẫu Báo Cáo</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {TEMPLATES.map((tmpl) => {
          let badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
          let borderHover = 'hover:border-amber-500/50';

          if (tmpl.colorScheme === 'emerald') {
            badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            borderHover = 'hover:border-emerald-500/50';
          } else if (tmpl.colorScheme === 'cyan') {
            badgeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
            borderHover = 'hover:border-cyan-500/50';
          } else if (tmpl.colorScheme === 'indigo') {
            badgeColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            borderHover = 'hover:border-indigo-500/50';
          }

          return (
            <div
              key={tmpl.code}
              className={`bg-[#070c17]/80 rounded-xl p-3.5 border border-slate-800/90 ${borderHover} transition-all flex flex-col justify-between space-y-3 shadow-md group`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                    {tmpl.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">{tmpl.code}</span>
                </div>

                <h4 className="text-xs font-bold text-white mt-2 group-hover:text-amber-300 transition-colors">
                  {tmpl.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <div>
                  Ước tính: <strong className="text-slate-200">{tmpl.estimatedRows}</strong> ({tmpl.estimatedSize})
                </div>

                <button
                  type="button"
                  onClick={() => onTriggerExport(tmpl)}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 text-[11px] font-bold transition-all disabled:opacity-40"
                >
                  <Send className="w-3 h-3" />
                  <span>Đẩy Vào Hàng Đợi</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
