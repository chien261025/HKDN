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
    <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Lịch Sử & Tiến Độ Các Đợt Kiểm Kê Kho
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
          {sessions.length} Đợt kiểm kê
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Mã Đợt / Tiêu Đề Kiểm Kê</th>
              <th className="py-3 px-4">Phạm Vi / Người Phụ Trách</th>
              <th className="py-3 px-4">Tiến Độ Đếm Thực Địa</th>
              <th className="py-3 px-4">Sai Lệch Phát Hiện</th>
              <th className="py-3 px-4">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {sessions.map((session) => {
              const isCounting = session.status === 'COUNTING';
              const isPendingReview = session.status === 'PENDING_REVIEW';
              const isReconciled = session.status === 'RECONCILED';

              const progressPercent = Math.round((session.countedBins / session.totalBins) * 100) || 0;

              return (
                <tr key={session.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Mã đợt & Tiêu đề */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-white text-sm">{session.auditCode}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{session.title}</div>
                  </td>

                  {/* Phạm vi & Thủ kho */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div className="text-slate-200">{session.scope}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 font-sans">
                      <User className="w-3 h-3" /> {session.assignedOperator}
                    </div>
                  </td>

                  {/* Tiến độ đếm */}
                  <td className="py-3.5 px-4">
                    <div className="w-36 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>{session.countedBins}/{session.totalBins} ô</span>
                        <span className="font-bold text-emerald-400">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isReconciled
                              ? 'bg-emerald-400'
                              : isPendingReview
                              ? 'bg-amber-400'
                              : 'bg-cyan-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Sai lệch phát hiện */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {session.discrepanciesCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-bold">
                        <AlertTriangle className="w-3 h-3" /> {session.discrepanciesCount} ô chênh lệch
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Khớp 100%
                      </span>
                    )}
                  </td>

                  {/* Trạng thái badge */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {isCounting && (
                      <span className="inline-flex items-center gap-1 text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 font-bold animate-pulse">
                        <Clock className="w-3 h-3" /> COUNTING
                      </span>
                    )}
                    {isPendingReview && (
                      <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-bold">
                        <AlertTriangle className="w-3 h-3" /> CHỜ DUYỆT
                      </span>
                    )}
                    {isReconciled && (
                      <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> RECONCILED
                      </span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectSession(session)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/40 hover:to-teal-600/40 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition-all"
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
