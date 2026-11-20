import React, { useState, useEffect } from 'react';
import { AuditHeader } from '../components/AuditHeader';
import { AuditSessionsList } from '../components/AuditSessionsList';
import { CreateAuditSessionModal } from '../components/CreateAuditSessionModal';
import { AuditDiscrepancyModal } from '../components/AuditDiscrepancyModal';
import { AuditCountingModal } from '../components/AuditCountingModal';
import { AuditSession, CreateAuditPayload } from '../types';
import { auditService } from '../services/auditService';

export const AuditManagementPage: React.FC = () => {
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AuditSession | null>(null);
  const [countingSession, setCountingSession] = useState<AuditSession | null>(null);

  const fetchSessions = async () => {
    const data = await auditService.getAuditSessions();
    setSessions(data);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateSession = async (payload: CreateAuditPayload) => {
    const saved = await auditService.createAuditSession(payload);
    setSessions((prev) => [saved, ...prev]);
  };

  const handleRecordCount = async (itemId: number, countedQty: number, notes?: string) => {
    if (!countingSession) return;
    const updated = await auditService.recordItemCount(countingSession.id, itemId, countedQty, notes);
    setCountingSession(updated);
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleApproveAdjustment = async (sessionId: string) => {
    try {
      const res = await auditService.reconcileAudit(sessionId);
      await fetchSessions();

      const updated = await auditService.getAuditById(sessionId);
      if (updated) {
        setSelectedSession(updated);
      } else {
        setSelectedSession((prev) =>
          prev
            ? {
                ...prev,
                status: 'RECONCILED',
                completedDate: new Date().toLocaleDateString('vi-VN'),
                reconciledBy: 'Trần Trưởng Kho',
              }
            : null
        );
      }

      alert(res.message || 'Đã phê duyệt phiếu Cân Đối Kho thành công! Hệ thống đã tự động ghi nhận bút toán ADJUSTMENT vào Sổ Cái Bất Biến (stock_ledger).');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể phê duyệt cân đối đợt kiểm kê.';
      alert(msg);
    }
  };

  const handleRefreshCurrentSession = async () => {
    if (!selectedSession) return;
    const updated = await auditService.getAuditById(selectedSession.id);
    if (updated) setSelectedSession(updated);
    fetchSessions();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {/* Header with Enterprise KPI Cards */}
      <AuditHeader
        sessions={sessions}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Sessions Table */}
      <AuditSessionsList
        sessions={sessions}
        onSelectSession={(session) => setSelectedSession(session)}
        onOpenCountingModal={(session) => setCountingSession(session)}
      />

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateAuditSessionModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreateSession={handleCreateSession}
        />
      )}

      {/* Physical Counting Simulation Modal */}
      {countingSession && (
        <AuditCountingModal
          session={countingSession}
          onClose={() => setCountingSession(null)}
          onRecordCount={handleRecordCount}
          onOpenReconcileModal={() => {
            setSelectedSession(countingSession);
            setCountingSession(null);
          }}
        />
      )}

      {/* Discrepancy & Reconciliation Modal */}
      {selectedSession && (
        <AuditDiscrepancyModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onApproveAdjustment={handleApproveAdjustment}
          onRefreshSession={handleRefreshCurrentSession}
        />
      )}
    </div>
  );
};
