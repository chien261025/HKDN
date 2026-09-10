import React from 'react';
import {
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  HardDrive,
  Cpu,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { ReportJob } from '../types';

interface ReportJobsFeedProps {
  jobs: ReportJob[];
  onDownload: (job: ReportJob) => void;
  onRemoveJob: (id: string) => void;
}

export const ReportJobsFeed: React.FC<ReportJobsFeedProps> = ({
  jobs,
  onDownload,
  onRemoveJob,
}) => {
  return (
    <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Hàng Đợi Nhiệm Vụ: <span className="text-amber-400">wms.report.task.queue</span>
          </h3>
        </div>
        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 font-bold px-2.5 py-0.5 rounded-full border border-slate-700">
          {jobs.length} TASKS
        </span>
      </div>

      {/* Jobs List */}
      <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto scrollbar-thin">
        {jobs.length === 0 ? (
          <div className="p-10 text-center text-slate-500 space-y-2">
            <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">Chưa có tác vụ xuất báo cáo nào trong hàng đợi.</p>
            <p className="text-[11px] text-slate-600">
              Hãy chọn một mẫu báo cáo ở trên để kích hoạt xuất ngầm qua RabbitMQ.
            </p>
          </div>
        ) : (
          jobs.map((job) => {
            const isCompleted = job.status === 'COMPLETED';
            const isStreaming = job.status === 'STREAMING';
            const isUploading = job.status === 'UPLOADING';
            const isQueued = job.status === 'QUEUED';

            return (
              <div
                key={job.id}
                className="p-4.5 hover:bg-slate-800/20 transition-colors space-y-3"
              >
                {/* Job top info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">{job.reportTitle}</span>
                      <span className="text-[10px] font-mono bg-slate-900 text-cyan-300 px-2 py-0.5 rounded border border-slate-700 font-bold">
                        {job.id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {job.workerNode}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-4 font-mono text-[11px] flex-wrap">
                      <span>Thời điểm: {job.createdAt}</span>
                      <span>Dung lượng: <strong className="text-emerald-400">{job.fileSize || 'Đang ước tính...'}</strong></span>
                      <span className="flex items-center gap-1 text-indigo-300">
                        <Cpu className="w-3 h-3" /> RAM Heap: {job.ramUsageMb} MB / 512 MB
                      </span>
                    </div>
                  </div>

                  {/* Actions & Status Badge */}
                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    {isCompleted ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>S3 Uploaded</span>
                        </span>

                        <button
                          onClick={() => onDownload(job)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/30 active:scale-95"
                          title="Tải tệp Excel về máy"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải Excel</span>
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30 animate-pulse font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {isQueued && 'QUEUED (RabbitMQ)'}
                        {isStreaming && 'SXSSF STREAMING...'}
                        {isUploading && 'MINIO UPLOADING...'}
                      </span>
                    )}

                    <button
                      onClick={() => onRemoveJob(job.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Xóa bản ghi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Live Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400">
                      {isQueued && 'Bước 1/4: Đã nhận thông điệp qua AMQP exchange wms.direct'}
                      {isStreaming && 'Bước 2/4: Đang ghi đệm 100 dòng/cửa sổ ra đĩa (SXSSFWorkbook)'}
                      {isUploading && 'Bước 3/4: Đang chuyển luồng nhị phân vào MinIO S3 bucket'}
                      {isCompleted && 'Bước 4/4: Tệp đã sẵn sàng tải xuống với chữ ký an toàn'}
                    </span>
                    <span className="font-bold text-slate-300">{job.progress}%</span>
                  </div>

                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isCompleted
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-amber-500 via-amber-400 to-cyan-400 animate-pulse'
                      }`}
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
