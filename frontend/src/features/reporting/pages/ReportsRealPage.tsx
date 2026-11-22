import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportsHeader } from '../components/ReportsHeader';
import { ReportTemplateSelector } from '../components/ReportTemplateSelector';
import { ReportJobsFeed } from '../components/ReportJobsFeed';
import { ReportOverviewPanel } from '../components/ReportOverviewPanel';
import { ReportJob, ReportTemplate } from '../types';
import { reportService } from '../services/reportService';

const reportMeta: Record<string, { title: string; category: string }> = {
  'RPT-LEDGER': { title: 'Toàn bộ giao dịch Nhập - Xuất - Điều chuyển', category: 'Kiểm toán & đối soát' },
  'RPT-INBOUND': { title: 'Báo cáo nhập kho', category: 'Nhập kho & đối soát' },
  'RPT-EXPIRY': { title: 'Cân đối tồn & hạn dùng FEFO/FIFO', category: 'Quản lý hạn sử dụng' },
  'RPT-SLOTTING': { title: 'Tỷ lệ lấp đầy & dung tích ô kệ', category: 'Vận hành kho' },
  'RPT-FULFILLMENT': { title: 'Hiệu suất đơn hàng & SLA vận hành', category: 'SLA vận hành' },
};

export const ReportsRealPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ReportJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const loadJobs = async () => {
    const records = await reportService.getJobs(selectedMonth);
    setJobs(records.map((record) => {
      const info = reportMeta[record.reportName] || { title: record.reportName, category: 'Báo cáo kho' };
      const completed = record.status === 'COMPLETED';
      return {
        id: record.id, reportCode: record.reportName, reportTitle: info.title, category: info.category,
        format: 'EXCEL', status: completed ? 'COMPLETED' : record.status === 'FAILED' ? 'FAILED' : 'EXTRACTING',
        statusLabel: record.status === 'FAILED' ? record.errorMessage || 'Xuất báo cáo thất bại' : completed ? 'Sẵn sàng tải về' : 'Đang tổng hợp dữ liệu...',
        progress: completed ? 100 : 50, totalRows: 0,
        createdAt: new Date(record.createdAt).toLocaleString('vi-VN'),
        completedAt: record.completedAt ? new Date(record.completedAt).toLocaleString('vi-VN') : undefined,
        requestedBy: 'Người dùng hiện tại',
      } as ReportJob;
    }));
  };

  useEffect(() => { loadJobs().catch(() => setJobs([])); }, [selectedMonth]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  const handleTriggerExport = async (template: ReportTemplate) => {
    setIsProcessing(true);
    try {
      const downloads: Record<string, () => Promise<Blob>> = {
        'RPT-LEDGER': () => reportService.downloadTransactionsExcel(selectedMonth),
        'RPT-INBOUND': () => reportService.downloadInboundExcel(selectedMonth),
        'RPT-EXPIRY': () => reportService.downloadExpiryExcel(selectedMonth),
        'RPT-SLOTTING': () => reportService.downloadSlottingExcel(selectedMonth),
        'RPT-FULFILLMENT': () => reportService.downloadFulfillmentExcel(selectedMonth),
      };
      const blob = await downloads[template.code]?.();
      if (blob) downloadBlob(blob, `${template.code.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      await loadJobs();
    } finally { setIsProcessing(false); }
  };

  const handleDownload = async (job: ReportJob) => {
    const blob = await reportService.downloadJob(job.id);
    downloadBlob(blob, `${job.reportCode.toLowerCase()}-${job.id}.xlsx`);
  };

  const completedCount = jobs.filter((job) => job.status === 'COMPLETED').length;
  const activeCount = jobs.filter((job) => job.status !== 'COMPLETED').length;

  return <div className="space-y-4 pb-8">
    <ReportsHeader completedJobsCount={completedCount} activeJobsCount={activeCount} reportPeriod={selectedMonth} onOpenAssistant={() => navigate('/smartquery')} onRefresh={loadJobs} />
    <ReportTemplateSelector onTriggerExport={handleTriggerExport} isProcessing={isProcessing} />
    <div className="flex items-center justify-end gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
      <label htmlFor="report-month" className="text-sm font-semibold text-slate-700">Tháng báo cáo</label>
      <input id="report-month" type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-700" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
      <div className="lg:col-span-8"><ReportJobsFeed jobs={jobs} onDownload={handleDownload} onRemoveJob={() => {}} /></div>
      <div className="lg:col-span-4"><ReportOverviewPanel /></div>
    </div>
  </div>;
};
