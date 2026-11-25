import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuditHeader, AuditFilterStatus } from '../components/AuditHeader';
import { AuditSessionsList } from '../components/AuditSessionsList';
import { CreateAuditSessionModal } from '../components/CreateAuditSessionModal';
import { AuditDiscrepancyModal } from '../components/AuditDiscrepancyModal';
import { AuditCountingModal } from '../components/AuditCountingModal';
import { AuditSession, CreateAuditPayload } from '../types';
import { auditService } from '../services/auditService';
import { warehouseService } from '../../masterdata/services/warehouseService';
import { useNotifications } from '../../notifications/context/NotificationContext';

export const AuditManagementPage: React.FC = () => {
  const { addToast } = useNotifications();
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(() => warehouseService.getActiveWarehouseId() || 'ALL');
  const [statusFilter, setStatusFilter] = useState<AuditFilterStatus>('ALL');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const [selectedSession, setSelectedSession] = useState<AuditSession | null>(null);
  const [countingSession, setCountingSession] = useState<AuditSession | null>(null);

  const urlAuditCode = searchParams.get('auditCode') || searchParams.get('adjCode');
  useEffect(() => {
    if (urlAuditCode && sessions.length > 0) {
      const match = sessions.find(
        (s) =>
          s.auditCode === urlAuditCode ||
          s.adjustmentCode === urlAuditCode ||
          urlAuditCode.includes(s.auditCode) ||
          (s.adjustmentCode && urlAuditCode.includes(s.adjustmentCode))
      );
      if (match) {
        setSelectedSession(match);
      }
    }
  }, [urlAuditCode, sessions]);

  const fetchSessions = async (whIdStr = selectedWarehouse) => {
    setLoading(true);
    try {
      const match = String(whIdStr).match(/\d+/);
      const targetWhId = whIdStr === 'ALL' ? undefined : (match ? Number(match[0]) : undefined);
      const data = await auditService.getAuditSessions(targetWhId);
      setSessions(data);
      setLastUpdated(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Lỗi tải danh sách đợt kiểm kê:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseChange = (whIdStr: string) => {
    setSelectedWarehouse(whIdStr);
    warehouseService.setActiveWarehouseId(whIdStr);
    window.dispatchEvent(new CustomEvent('smart_wms_warehouse_changed', { detail: whIdStr }));
    fetchSessions(whIdStr);
  };

  // Lắng nghe sự kiện đổi kho từ Global Header
  useEffect(() => {
    const handleWhChange = (e: any) => {
      const newWh = e.detail || warehouseService.getActiveWarehouseId() || 'ALL';
      setSelectedWarehouse(newWh);
      fetchSessions(newWh);
    };

    window.addEventListener('smart_wms_warehouse_changed', handleWhChange);
    return () => window.removeEventListener('smart_wms_warehouse_changed', handleWhChange);
  }, []);

  useEffect(() => {
    fetchSessions(selectedWarehouse);
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

      addToast({
        type: 'success',
        title: 'Phê Duyệt Cân Đối Thành Công',
        message: res.message || 'Đã duyệt kiểm kê và ghi nhận điều chỉnh tồn kho vào thẻ kho.',
        duration: 6000,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể phê duyệt cân đối đợt kiểm kê.';
      addToast({
        type: 'warning',
        title: 'Cảnh Báo Phân Tách Nhiệm Vụ (SoD)',
        message: msg,
        duration: 9000,
      });
      throw err;
    }
  };

  const handleRefreshCurrentSession = async () => {
    if (!selectedSession) return;
    const updated = await auditService.getAuditById(selectedSession.id);
    if (updated) setSelectedSession(updated);
    fetchSessions();
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header with Enterprise Interactive KPI Cards & Dynamic Unified Warehouse Scope */}
      <AuditHeader
        sessions={sessions}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        selectedWarehouse={selectedWarehouse}
        onWarehouseChange={handleWarehouseChange}
        activeStatus={statusFilter}
        onStatusChange={(st) => setStatusFilter(st)}
        onRefresh={() => fetchSessions(selectedWarehouse)}
        loading={loading}
        lastUpdated={lastUpdated}
      />

      {/* Sessions Table with Synchronized Status Filter Tabs & Search */}
      <AuditSessionsList
        sessions={sessions}
        onSelectSession={(session) => setSelectedSession(session)}
        onOpenCountingModal={(session) => setCountingSession(session)}
        statusFilter={statusFilter}
        onStatusFilterChange={(st) => setStatusFilter(st)}
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
