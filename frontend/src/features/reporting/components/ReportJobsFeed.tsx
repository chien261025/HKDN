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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-amber-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Lịch Sử Tác Vụ & Tệp Sẵn Sàng Tải Về
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 font-semibold shadow-xs">
          {jobs.length} Tác vụ
        </span>
      </div>

      {/* Clean Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Tên Báo Cáo / Mã Job</th>
              <th className="py-3.5 px-4">Quy Mô Dữ Liệu</th>
              <th className="py-3.5 px-4">RAM SXSSF</th>
              <th className="py-3.5 px-4">Thời Gian</th>
              <th className="py-3.5 px-4">Trạng Thái</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700 font-sans">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  Chưa có tác vụ xuất báo cáo nào. Bấm vào một mẫu phía trên để bắt đầu xuất.
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const isDone = job.status === 'COMPLETED';

                return (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Tên báo cáo & ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center flex-shrink-0 shadow-xs">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm line-clamp-1">{job.reportTitle}</div>
                          <div className="text-xs font-mono text-slate-500 mt-0.5">{job.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Quy mô */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div className="text-slate-900 font-semibold">{job.fileSize || 'Đang stream...'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {job.totalRows.toLocaleString()} dòng
                      </div>
                    </td>

                    {/* RAM */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-bold">
                        <Cpu className="w-3.5 h-3.5 text-emerald-600" /> {job.ramUsageMb} MB
                      </span>
                    </td>

                    {/* Thời gian */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {job.createdAt}
                    </td>

                    {/* Trạng thái / Progress */}
                    <td className="py-3.5 px-4">
                      {isDone ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> MinIO S3
                        </span>
                      ) : (
                        <div className="w-40 space-y-1.5">
                          <div className="flex justify-between text-xs font-mono text-amber-700 font-semibold">
                            <span>{job.status}...</span>
                            <span>{job.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div
                              className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                              style={{ width: `${job.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Nút tải & xóa */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isDone && (
                          <button
                            onClick={() => onDownload(job)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                            title="Tải tệp Excel về máy"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Tải về</span>
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveJob(job.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-4 h-4" />
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
