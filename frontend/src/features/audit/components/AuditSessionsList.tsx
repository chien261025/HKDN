import React from 'react';
import {
  ClipboardCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Layers,
  User,
  Scale
} from 'lucide-react';
import { AuditSession } from '../types';

interface AuditSessionsListProps {
  sessions: AuditSession[];
  onSelectSession: (session: AuditSession) => void;
}

export const AuditSessionsList: React.FC<AuditSessionsListProps> = ({
  sessions,
  onSelectSession,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2.5">
          <ClipboardCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Lịch Sử & Tiến Độ Các Đợt Kiểm Kê Kho
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 font-semibold shadow-xs">
          {sessions.length} Đợt kiểm kê
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Mã Đợt / Tiêu Đề Kiểm Kê</th>
              <th className="py-3.5 px-4">Phạm Vi / Người Phụ Trách</th>
              <th className="py-3.5 px-4">Tiến Độ Đếm Thực Địa</th>
              <th className="py-3.5 px-4">Sai Lệch Phát Hiện</th>
              <th className="py-3.5 px-4">Trạng Thái</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700 font-sans">
            {sessions.map((session) => {
              const isCounting = session.status === 'COUNTING';
              const isPendingReview = session.status === 'PENDING_REVIEW';
              const isReconciled = session.status === 'RECONCILED';

              const progressPercent = Math.round((session.countedBins / session.totalBins) * 100) || 0;

              return (
                <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Mã đợt & Tiêu đề */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-900 text-sm">{session.auditCode}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{session.title}</div>
                  </td>

                  {/* Phạm vi & Thủ kho */}
                  <td className="py-3.5 px-4 font-mono text-xs">
                    <div className="text-slate-900 font-medium">{session.scope}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 font-sans mt-0.5">
                      <User className="w-3.5 h-3.5" /> {session.assignedOperator}
                    </div>
                  </td>

                  {/* Tiến độ đếm */}
                  <td className="py-3.5 px-4">
                    <div className="w-40 space-y-1.5">
                      <div className="flex justify-between text-xs font-mono text-slate-600">
                        <span>{session.countedBins}/{session.totalBins} ô</span>
                        <span className="font-bold text-emerald-600">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isReconciled
                              ? 'bg-emerald-500'
                              : isPendingReview
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Sai lệch phát hiện */}
                  <td className="py-3.5 px-4 font-mono text-xs">
                    {session.discrepanciesCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" /> {session.discrepanciesCount} ô chênh lệch
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Khớp 100%
                      </span>
                    )}
                  </td>

                  {/* Trạng thái badge */}
                  <td className="py-3.5 px-4 font-mono text-xs">
                    {isCounting && (
                      <span className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-bold">
                        <Clock className="w-3.5 h-3.5" /> COUNTING
                      </span>
                    )}
                    {isPendingReview && (
                      <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" /> CHỜ DUYỆT
                      </span>
                    )}
                    {isReconciled && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> RECONCILED
                      </span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectSession(session)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all shadow-xs"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Đối Soát & Cân Đối</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
