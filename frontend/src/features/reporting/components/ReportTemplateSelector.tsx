import React from 'react';
import {
  FileSpreadsheet,
  FileDown,
  Layers,
  Clock,
  BarChart3,
  CheckCircle2,
  BookOpenCheck
} from 'lucide-react';
import { ReportTemplate } from '../types';

interface ReportTemplateSelectorProps {
  onTriggerExport: (template: ReportTemplate) => void;
  isProcessing: boolean;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    code: 'RPT-LEDGER',
    title: 'Sổ Cái Thẻ Kho & Bút Toán Đối Soát',
    category: 'Kiểm Toán & Kế Toán',
    description: 'Toàn bộ giao dịch Nhập - Xuất - Điều chuyển kèm chứng từ và mã lô đối soát.',
    estimatedRows: '50,000 dòng',
    estimatedSize: '4.2 MB',
    format: 'EXCEL',
    badgeColor: 'emerald',
  },
  {
    code: 'RPT-EXPIRY',
    title: 'Cân Đối Tồn & Hạn Dùng (FEFO/FIFO)',
    category: 'Quản Lý Hạn Sử Dụng',
    description: 'Tổng hợp tồn khả dụng, phân loại lô hàng cận date 30-60-90 ngày theo danh mục SKU.',
    estimatedRows: '15,000 dòng',
    estimatedSize: '1.8 MB',
    format: 'EXCEL',
    badgeColor: 'blue',
  },
  {
    code: 'RPT-SLOTTING',
    title: 'Tỷ Lệ Lấp Đầy & Dung Tích Ô Kệ',
    category: 'Quy Hoạch Mặt Bằng',
    description: 'Thống kê sức chứa, tỷ lệ lấp đầy thể tích & tải trọng an toàn phân khu Zone A & B.',
    estimatedRows: '8,000 vị trí',
    estimatedSize: '950 KB',
    format: 'EXCEL',
    badgeColor: 'indigo',
  },
  {
    code: 'RPT-FULFILLMENT',
    title: 'Hiệu Suất Đơn Hàng & SLA Vận Hành',
    category: 'KPI Vận Hành & Giao Vận',
    description: 'Đo lường năng suất lấy hàng (Pick/Pack), tỷ lệ hoàn tất đơn hàng và thời gian xử lý.',
    estimatedRows: '25,000 dòng',
    estimatedSize: '2.5 MB',
    format: 'EXCEL',
    badgeColor: 'amber',
  },
];

export const ReportTemplateSelector: React.FC<ReportTemplateSelectorProps> = ({
  onTriggerExport,
  isProcessing,
}) => {
  return (
    <div className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-0.5">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <BookOpenCheck className="w-4 h-4 text-emerald-600" />
            Danh Mục Mẫu Báo Cáo Nghiệp Vụ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chọn mẫu dữ liệu cần xuất theo tiêu chuẩn kế toán và đối soát vận hành kho
          </p>
        </div>
        <span className="text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-medium self-start sm:self-auto border border-slate-200">
          Định dạng xuất: <strong className="text-emerald-700">Microsoft Excel (.xlsx)</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORT_TEMPLATES.map((tmpl) => {
          let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          let iconBg = 'bg-emerald-50 text-emerald-600 border-emerald-200';
          let cardBorderHover = 'hover:border-emerald-300 hover:shadow-emerald-500/10';
          let btnClasses = 'bg-emerald-600 hover:bg-emerald-700 text-white';

          if (tmpl.badgeColor === 'blue') {
            badgeBg = 'bg-sky-50 text-sky-700 border-sky-200';
            iconBg = 'bg-sky-50 text-sky-600 border-sky-200';
            cardBorderHover = 'hover:border-sky-300 hover:shadow-sky-500/10';
            btnClasses = 'bg-sky-600 hover:bg-sky-700 text-white';
          } else if (tmpl.badgeColor === 'indigo') {
            badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
            iconBg = 'bg-indigo-50 text-indigo-600 border-indigo-200';
            cardBorderHover = 'hover:border-indigo-300 hover:shadow-indigo-500/10';
            btnClasses = 'bg-indigo-600 hover:bg-indigo-700 text-white';
          } else if (tmpl.badgeColor === 'amber') {
            badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
            iconBg = 'bg-amber-50 text-amber-600 border-amber-200';
            cardBorderHover = 'hover:border-amber-300 hover:shadow-amber-500/10';
            btnClasses = 'bg-amber-600 hover:bg-amber-700 text-white';
          }

          return (
            <div
              key={tmpl.code}
              className={`bg-white rounded-2xl p-5 border border-slate-200/90 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md ${cardBorderHover} group`}
            >
              <div>
                {/* Header card: Category badge + Quy mô */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${badgeBg}`}>
                    {tmpl.category}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {tmpl.estimatedRows}
                  </span>
                </div>

                {/* Title & Icon */}
                <div className="flex items-start gap-3 mt-1">
                  <div className={`p-2.5 rounded-xl border ${iconBg} flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 leading-snug">
                      {tmpl.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-500 font-medium">
                  Ước tính: <strong className="text-slate-700 font-semibold">{tmpl.estimatedSize}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => onTriggerExport(tmpl)}
                  disabled={isProcessing}
                  className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed ${btnClasses}`}
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Xuất Báo Cáo</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
