import React, { useState } from 'react';
import { AuditHeader } from '../components/AuditHeader';
import { AuditSessionsList } from '../components/AuditSessionsList';
import { CreateAuditSessionModal } from '../components/CreateAuditSessionModal';
import { AuditDiscrepancyModal } from '../components/AuditDiscrepancyModal';
import { AuditSession } from '../types';

export const AuditManagementPage: React.FC = () => {
  const [sessions, setSessions] = useState<AuditSession[]>([
    {
      id: 'aud-01',
      auditCode: 'AUD-2026-09',
      title: 'Kiểm kê định kỳ Quý 3/2026 (Toàn Bộ Kho)',
      scope: 'Toàn Bộ Kho (Khu A & Khu B)',
      startDate: '10/09/2026',
      status: 'PENDING_REVIEW',
      totalBins: 40,
      countedBins: 28,
      discrepanciesCount: 1,
      assignedOperator: 'Trần Văn Thao (Thủ kho hiện trường)',
      notes: 'Thủ kho đã hoàn tất đếm mù 28 ô kệ qua máy quét PDA.',
      items: [
        {
          id: 'item-1',
          locationBarcode: 'ZA-A01-R01-S01-B01',
          sku: 'SKU-SAMS-S24',
          productName: 'Samsung Galaxy S24 Ultra',
          batchNumber: 'BATCH-S24-01',
          systemQty: 25,
          countedQty: 25,
          differenceQty: 0,
          unit: 'Hộp',
          countedBy: 'Trần Văn Thao',
          notes: 'Khớp 100% số lượng thực tế',
        },
        {
          id: 'item-2',
          locationBarcode: 'ZB-B01-R01-S01-B05',
          sku: 'SKU-MILK-100',
          productName: 'Sữa tươi Vinamilk 100% 1L',
          batchNumber: 'BATCH-MILK-26A',
          systemQty: 80,
          countedQty: 78,
          differenceQty: -2,
          unit: 'Thùng',
          countedBy: 'Trần Văn Thao',
          notes: 'Phát hiện thiếu 2 thùng so với số sách (rách bao bì ngoài bãi chuyển khu hủy)',
        },
      ],
    },
    {
      id: 'aud-02',
      auditCode: 'AUD-2026-08',
      title: 'Kiểm kê đột xuất Phân Khu A (Hàng Điện Tử)',
      scope: 'Phân Khu A: Hàng Khô & Điện Tử',
      startDate: '01/08/2026',
      completedDate: '01/08/2026',
      status: 'RECONCILED',
      totalBins: 20,
      countedBins: 20,
      discrepanciesCount: 0,
      assignedOperator: 'Trần Văn Thao',
      reconciledBy: 'Trần Trưởng Kho',
      notes: 'Đã phê duyệt cân đối kho và ghi sổ cái bất biến thành công.',
      items: [
        {
          id: 'item-3',
          locationBarcode: 'ZA-A01-R01-S02-B01',
          sku: 'SKU-SAMS-S24',
          productName: 'Samsung Galaxy S24 Ultra',
          batchNumber: 'BATCH-S24-01',
          systemQty: 10,
          countedQty: 10,
          differenceQty: 0,
          unit: 'Hộp',
          countedBy: 'Trần Văn Thao',
          notes: 'Số liệu khớp tuyệt đối',
        },
      ],
    },
    {
      id: 'aud-03',
      auditCode: 'AUD-2026-10',
      title: 'Kiểm kê cuốn chiếu Khu B (Kho Mát 2-8°C)',
      scope: 'Phân Khu B: Kho Mát (2-8°C)',
      startDate: '10/09/2026',
      status: 'COUNTING',
      totalBins: 20,
      countedBins: 8,
      discrepanciesCount: 0,
      assignedOperator: 'Trần Văn Thao',
      notes: 'Đang tiến hành đếm kiểm kê thực địa bằng PDA.',
      items: [],
    },
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AuditSession | null>(null);

  const handleCreateSession = (newSession: AuditSession) => {
    setSessions((prev) => [newSession, ...prev]);
  };

  const handleApproveAdjustment = (sessionId: string) => {
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
