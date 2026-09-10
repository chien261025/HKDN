import React from 'react';
import {
  Download,
  Clock,
  CheckCircle2,
  Trash2,
  FileSpreadsheet,
  Cpu,
  Layers
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
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Lịch Sử Tác Vụ & Tệp Sẵn Sàng Tải Về
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
          {jobs.length} Tác vụ
        </span>
      </div>

      {/* Clean Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Tên Báo Cáo / Mã Job</th>
              <th className="py-3 px-4">Quy Mô Dữ Liệu</th>
              <th className="py-3 px-4">RAM SXSSF</th>
              <th className="py-3 px-4">Thời Gian</th>
              <th className="py-3 px-4">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  <FileSpreadsheet className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                  Chưa có tác vụ xuất báo cáo nào. Bấm vào một mẫu phía trên để bắt đầu xuất.
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const isDone = job.status === 'COMPLETED';

                return (
                  <tr key={job.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Tên báo cáo & ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-white line-clamp-1">{job.reportTitle}</div>
                          <div className="text-[10px] font-mono text-slate-500">{job.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Quy mô */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="text-slate-200">{job.fileSize || 'Đang stream...'}</div>
                      <div className="text-[10px] text-slate-500">
                        {job.totalRows.toLocaleString()} dòng
                      </div>
                    </td>

                    {/* RAM */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <Cpu className="w-3 h-3" /> {job.ramUsageMb} MB
                      </span>
                    </td>

                    {/* Thời gian */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {job.createdAt}
                    </td>

                    {/* Trạng thái / Progress */}
                    <td className="py-3 px-4">
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> MinIO S3
                        </span>
                      ) : (
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-amber-300">
                            <span>{job.status}...</span>
                            <span>{job.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden border border-slate-800">
                            <div
                              className="h-full bg-amber-400 transition-all duration-300 rounded-full"
                              style={{ width: `${job.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Nút tải & xóa */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isDone && (
                          <button
                            onClick={() => onDownload(job)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition-all shadow"
                            title="Tải tệp Excel về máy"
                          >
                            <Download className="w-3 h-3" />
                            <span>Tải về</span>
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveJob(job.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
