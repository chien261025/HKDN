import React, { useState, useEffect } from 'react';
import { AuditHeader } from '../components/AuditHeader';
import { AuditSessionsList } from '../components/AuditSessionsList';
import { CreateAuditSessionModal } from '../components/CreateAuditSessionModal';
import { AuditDiscrepancyModal } from '../components/AuditDiscrepancyModal';
import { AuditSession } from '../types';
import { auditService } from '../services/auditService';

export const AuditManagementPage: React.FC = () => {
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AuditSession | null>(null);

  useEffect(() => {
    auditService.getAuditSessions().then(setSessions);
  }, []);

  const handleCreateSession = async (newSession: AuditSession) => {
    const saved = await auditService.createAuditSession(newSession);
    setSessions((prev) => [saved, ...prev]);
  };

  const handleApproveAdjustment = async (sessionId: string) => {
    await auditService.reconcileAudit(sessionId);
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          status: 'RECONCILED',
          completedDate: new Date().toLocaleDateString('vi-VN'),
          reconciledBy: 'Trần Trưởng Kho',
        };
      })
    );

    if (selectedSession && selectedSession.id === sessionId) {
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

    alert('Đã phê duyệt phiếu Cân Đối Kho thành công! Hệ thống đã tự động ghi nhận bút toán ADJUSTMENT vào Sổ Cái Bất Biến (stock_ledger).');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <AuditHeader
        sessions={sessions}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Sessions Table */}
      <AuditSessionsList
        sessions={sessions}
        onSelectSession={(session) => setSelectedSession(session)}
      />

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateAuditSessionModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreateSession={handleCreateSession}
        />
      )}

      {/* Discrepancy & Reconciliation Modal */}
      {selectedSession && (
        <AuditDiscrepancyModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onApproveAdjustment={handleApproveAdjustment}
        />
      )}
    </div>
  );
};
