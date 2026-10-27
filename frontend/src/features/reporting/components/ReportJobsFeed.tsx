import React from 'react';
import {
  Download,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck2,
  AlertCircle
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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Trung Tâm Tải Về & Lịch Sử Xuất Báo Cáo
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Danh sách các tệp báo cáo đã hoàn thành và sẵn sàng tải về máy tính
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
          {jobs.length} Tệp báo cáo
        </span>
      </div>

      {/* Clean Enterprise Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Tên Báo Cáo / Mã Tệp</th>
              <th className="py-3.5 px-4">Định Dạng</th>
              <th className="py-3.5 px-4">Quy Mô Dữ Liệu</th>
              <th className="py-3.5 px-4">Thời Gian Tạo</th>
              <th className="py-3.5 px-4">Trạng Thái</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center text-slate-400">
                  <FileSpreadsheet className="w-10 h-10 mx-auto mb-2.5 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">Chưa có tệp báo cáo nào được kết xuất</p>
                  <p className="text-xs text-slate-400 mt-1">Bấm vào các mẫu báo cáo phía trên để bắt đầu trích xuất dữ liệu</p>
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const isDone = job.status === 'COMPLETED';

                return (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Tên báo cáo & ID */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center flex-shrink-0 shadow-2xs">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm line-clamp-1">
                            {job.reportTitle}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            <span className="font-mono text-slate-500">{job.id}</span>
                            <span>•</span>
                            <span className="text-slate-600 font-medium">Bởi: {job.requestedBy || 'Quản Trị Viên'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Định dạng */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>.XLSX</span>
                      </span>
                    </td>

                    {/* Quy mô */}
                    <td className="py-4 px-4 font-mono text-xs">
                      <div className="text-slate-900 font-semibold">{job.fileSize || 'Đang tính toán...'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {job.totalRows.toLocaleString()} dòng dữ liệu
                      </div>
                    </td>

                    {/* Thời gian */}
                    <td className="py-4 px-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.createdAt}</span>
                      </div>
                      {job.completedAt && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Hoàn tất: {job.completedAt}
                        </div>
                      )}
                    </td>

                    {/* Trạng thái / Progress */}
                    <td className="py-4 px-4">
                      {isDone ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sẵn Sàng Tải Về</span>
                        </span>
                      ) : (
                        <div className="w-44 space-y-1.5">
                          <div className="flex justify-between text-xs font-medium text-slate-700">
                            <span className="text-slate-600 truncate mr-1">
                              {job.statusLabel || 'Đang xử lý dữ liệu...'}
                            </span>
                            <span className="font-bold font-mono text-emerald-700">{job.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                              style={{ width: `${job.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Nút tải & xóa */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isDone ? (
                          <button
                            onClick={() => onDownload(job)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
                            title="Tải bảng tính Excel (.xlsx) về máy"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Tải Báo Cáo</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Đang tổng hợp...</span>
                        )}
                        <button
                          onClick={() => onRemoveJob(job.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa tệp khỏi danh sách"
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
