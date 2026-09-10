import React, { useState } from 'react';
import { FileSpreadsheet, Send, CheckCircle2, Clock, Download, Cpu, HardDrive, Bell, Zap, Radio } from 'lucide-react';

interface ReportJob {
  id: string;
  reportType: string;
  status: 'PENDING' | 'STREAMING' | 'COMPLETED';
  progress: number;
  createdAt: string;
  fileSize?: string;
  downloadUrl?: string;
}

export const ReportsPage: React.FC = () => {
  const [jobs, setJobs] = useState<ReportJob[]>([
    {
      id: 'job-9821a-4c',
      reportType: 'Báo Cáo Sổ Cái Biến Động Kho (Stock Ledger)',
      status: 'COMPLETED',
      progress: 100,
      createdAt: '10 phút trước',
      fileSize: '4.2 MB (50,000 dòng)',
      downloadUrl: '#',
    },
  ]);

  const [isExporting, setIsExporting] = useState(false);

  const handleTriggerExport = () => {
    setIsExporting(true);
    const newJobId = `job-${Math.random().toString(36).substring(2, 7)}-${Date.now().toString().slice(-4)}`;

    const newJob: ReportJob = {
      id: newJobId,
      reportType: 'Báo Cáo Tồn Kho Toàn Bộ Ô Kệ & Lô Cận Date',
      status: 'PENDING',
      progress: 15,
      createdAt: 'Vừa xong',
    };

    setJobs((prev) => [newJob, ...prev]);

    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) => (j.id === newJobId ? { ...j, status: 'STREAMING', progress: 65 } : j))
      );
    }, 1200);

    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJobId
            ? {
                ...j,
                status: 'COMPLETED',
                progress: 100,
                fileSize: '1.8 MB (1,000 dòng)',
                downloadUrl: '#',
              }
            : j
        )
      );
      setIsExporting(false);
    }, 2800);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Xuất Báo Cáo Dữ Liệu Lớn (Async Queue Offloading)</h1>
              <p className="text-xs text-slate-400">
                Đẩy tác vụ vào RabbitMQ <span className="font-mono text-cyan-400 font-bold">wms.report.task.queue</span> • Stream Excel giữ RAM &lt; 50MB • Lưu trữ MinIO S3
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleTriggerExport}
          disabled={isExporting}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg ${
            isExporting
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Đang Đẩy Vào RabbitMQ...' : 'Kích Hoạt Xuất Báo Cáo Ngầm'}</span>
        </button>
      </div>

      {/* 3 Architecture Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Chống Nghẽn Luồng (Non-blocking)</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Người dùng không phải chờ đợi. Backend offload toàn bộ việc nặng sang RabbitMQ Worker.
            </p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">SXSSFWorkbook Streaming</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Cửa sổ trượt 100 dòng ghi thẳng ra ổ cứng đệm, duy trì RAM dưới 50MB kể cả với 100,000 dòng.
            </p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">MinIO Object Storage</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Tệp kết quả được đẩy trực tiếp lên MinIO S3 bucket `wms-reports` kèm URL tải an toàn.
            </p>
          </div>
        </div>
      </div>

      {/* Jobs Queue Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Hàng Đợi Nhiệm Vụ: <span className="text-amber-400">wms.report.task.queue</span>
            </h3>
          </div>
          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded border border-slate-700">
            {jobs.length} TASKS
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {jobs.map((job) => {
            const isDone = job.status === 'COMPLETED';
            const isStreaming = job.status === 'STREAMING';

            return (
              <div key={job.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{job.reportType}</span>
                    <span className="text-[10px] font-mono bg-slate-900 text-cyan-300 px-2 py-0.5 rounded border border-slate-700">
                      {job.id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3 font-mono text-[11px]">
                    <span>Thời gian: {job.createdAt}</span>
                    {job.fileSize && <span>Dung lượng: <strong className="text-emerald-400">{job.fileSize}</strong></span>}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div>
                    {isDone ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Hoàn Thành (S3 Uploaded)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 animate-pulse font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {isStreaming ? 'STREAMING SXSSFWorkbook (65%)...' : 'QUEUE PENDING (15%)...'}
                      </span>
                    )}
                  </div>

                  {isDone && (
                    <button
                      onClick={() => alert(`Bắt đầu tải file báo cáo Excel cho Job: ${job.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/30"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải Excel</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
