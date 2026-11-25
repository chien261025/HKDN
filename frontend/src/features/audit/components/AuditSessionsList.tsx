import React, { useEffect, useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Layers,
  User,
  Scale,
  ScanLine,
  Search,
  FileText,
} from 'lucide-react';
import { AuditSession } from '../types';
import { Pagination } from '../../../components/common';

const PAGE_SIZE = 10;

interface AuditSessionsListProps {
  sessions: AuditSession[];
  onSelectSession: (session: AuditSession) => void;
  onOpenCountingModal?: (session: AuditSession) => void;
  statusFilter?: 'ALL' | 'COUNTING' | 'PENDING_REVIEW' | 'RECONCILED';
  onStatusFilterChange?: (status: 'ALL' | 'COUNTING' | 'PENDING_REVIEW' | 'RECONCILED') => void;
}

export const AuditSessionsList: React.FC<AuditSessionsListProps> = ({
  sessions,
  onSelectSession,
  onOpenCountingModal,
  statusFilter: controlledStatusFilter,
  onStatusFilterChange,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [internalStatusFilter, setInternalStatusFilter] = useState<'ALL' | 'COUNTING' | 'PENDING_REVIEW' | 'RECONCILED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const statusFilter = controlledStatusFilter !== undefined ? controlledStatusFilter : internalStatusFilter;
  const setStatusFilter = (st: 'ALL' | 'COUNTING' | 'PENDING_REVIEW' | 'RECONCILED') => {
    if (onStatusFilterChange) {
      onStatusFilterChange(st);
    } else {
      setInternalStatusFilter(st);
    }
  };

  const countingCount = useMemo(() => sessions.filter((s) => s.status === 'COUNTING').length, [sessions]);
  const pendingReviewCount = useMemo(() => sessions.filter((s) => s.status === 'PENDING_REVIEW').length, [sessions]);
  const reconciledCount = useMemo(() => sessions.filter((s) => s.status === 'RECONCILED').length, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // 1. Lọc theo trạng thái
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      // 2. Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (s.auditCode || '').toLowerCase();
        const title = (s.title || '').toLowerCase();
        const op = (s.assignedOperator || '').toLowerCase();
        const scope = (s.scope || '').toLowerCase();
        if (!code.includes(q) && !title.includes(q) && !op.includes(q) && !scope.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [sessions, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / PAGE_SIZE));
  const visibleSessions = filteredSessions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2.5">
          <ClipboardCheck className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Lịch Sử & Tiến Độ Các Đợt Kiểm Kê Kho
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 font-semibold shadow-xs">
          {filteredSessions.length}/{sessions.length} Đợt kiểm kê
        </span>
      </div>

      {/* Toolbar: Bộ lọc trạng thái & Thanh tìm kiếm nhanh */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: `Tất cả (${sessions.length})` },
            { id: 'COUNTING', label: `Đang đếm (${countingCount})` },
            { id: 'PENDING_REVIEW', label: `Chờ duyệt (${pendingReviewCount})` },
            { id: 'RECONCILED', label: `Đã cân đối (${reconciledCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id as any);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs font-bold ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã AUD, tiêu đề, thủ kho..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
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
            {visibleSessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">Không tìm thấy đợt kiểm kê nào phù hợp</p>
                </td>
              </tr>
            ) : (
              visibleSessions.map((session) => {
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
                      <div className="text-slate-900 font-medium">
                        {session.scope?.replace('ZONE_A', 'Khu A')?.replace('ZONE_B', 'Khu B') || session.scope}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 font-sans mt-0.5">
                        <User className="w-3.5 h-3.5" /> {session.assignedOperator}
                      </div>
                    </td>

                    {/* Tiến độ đếm */}
                    <td className="py-3.5 px-4">
                      <div className="w-40 space-y-1.5">
                        <div className="flex justify-between text-xs font-mono text-slate-600">
                          <span>{session.countedBins}/{session.totalBins} ô</span>
                          <span className="font-bold text-blue-600">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
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

                    {/* Sai lệch phát hiện (Phân biệt: Đang đếm - Chờ duyệt - Đã cân đối) */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {isReconciled ? (
                        session.discrepanciesCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 font-bold" title="Lệch lịch sử đã được điều chỉnh cân đối vào Sổ cái">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã xử lý ({session.discrepanciesCount} lệch)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Khớp 100%
                          </span>
                        )
                      ) : isPendingReview ? (
                        session.discrepanciesCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 font-bold" title="Sai lệch đã xác nhận đếm xong, đang chờ Trưởng kho duyệt cân đối">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> {session.discrepanciesCount} ô chờ duyệt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Khớp 100%
                          </span>
                        )
                      ) : (
                        session.discrepanciesCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-bold" title="Sai lệch tạm thời phát hiện trong quá trình quét đếm">
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> Tạm tính: {session.discrepanciesCount} lệch
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 font-medium">
                            Chưa ghi nhận lệch
                          </span>
                        )
                      )}
                    </td>

                    {/* Trạng thái badge */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {isCounting && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                          <Clock className="w-3.5 h-3.5 text-blue-600" /> ĐANG KIỂM ĐẾM
                        </span>
                      )}
                      {isPendingReview && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> CHỜ ĐỐI SOÁT
                        </span>
                      )}
                      {isReconciled && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ĐÃ CÂN ĐỐI
                        </span>
                      )}
                    </td>

                    {/* Thao tác phân theo chuẩn SAP EWM & Oracle WMS */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isCounting && onOpenCountingModal && (
                          <button
                            onClick={() => onOpenCountingModal(session)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Nhập số lượng kiểm đếm thực tế tại kho"
                          >
                            <ScanLine className="w-3.5 h-3.5 text-blue-600" />
                            <span>Kiểm Đếm</span>
                          </button>
                        )}

                        {isPendingReview ? (
                          <button
                            onClick={() => onSelectSession(session)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                            title="Kiểm tra sai lệch và phê duyệt điều chỉnh tồn kho"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Duyệt Cân Đối</span>
                          </button>
                        ) : isCounting ? (
                          <button
                            onClick={() => onSelectSession(session)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer shadow-2xs"
                            title="Xem tiến độ kiểm đếm và sai lệch hiện tại"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Xem Tiến Độ</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectSession(session)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer shadow-2xs"
                            title="Xem biên bản kiểm kê và điều chỉnh đã duyệt"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>Xem Biên Bản</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalItems={filteredSessions.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};
