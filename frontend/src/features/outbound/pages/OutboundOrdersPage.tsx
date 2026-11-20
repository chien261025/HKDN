import React, { useState, useEffect, useRef } from 'react';
import { OutboundHeader } from '../components/OutboundHeader';
import { OutboundOrderTable } from '../components/OutboundOrderTable';
import { CreateOutboundModal } from '../components/CreateOutboundModal';
import { OutboundDetailModal } from '../components/OutboundDetailModal';
import { PickPathVisualizerModal } from '../components/PickPathVisualizerModal';
import { OutboundOrder, OutboundStock } from '../types';
import { outboundService } from '../services/outboundService';
import { inventoryService } from '../../inventory/services/inventoryService';
import { WarehouseClosingBalances } from '../../inventory/components/WarehouseClosingBalances';

export const OutboundOrdersPage: React.FC = () => {
  const [stock, setStock] = useState<OutboundStock[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const busy = useRef(false);
  const [processing, setProcessing] = useState(false);
  const [orders, setOrders] = useState<OutboundOrder[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OutboundOrder | null>(null);
  const [pickPathOrder, setPickPathOrder] = useState<OutboundOrder | null>(null);

  const fetchOrders = async () => {
    const list = await outboundService.getOutboundOrders();
    setOrders(list);
    try { setStock(await inventoryService.getClosingBalances()); }
    catch { setError('Không tải được tồn cuối kho.'); }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreateOrder = async (newOrder: OutboundOrder) => {
    const saved = await outboundService.createOutboundOrder(newOrder);
    if (!saved) throw new Error('Không tạo được đơn xuất kho.');
    setOrders((prev) => [saved, ...prev]);
    setMessage('Đã tạo đơn. Tồn kho sẽ giảm khi xác nhận xuất kho.');
  };

  const runAction = async (orderId: string, dispatch: boolean) => {
    if (busy.current) return;
    busy.current = true;
    setProcessing(true);
    setError('');
    setMessage('');
    try {
      if (dispatch) await outboundService.dispatchOrder(orderId);
      else await outboundService.allocateOrderFefo(orderId);
      await fetchOrders();
      setMessage(dispatch ? 'Xuất kho thành công. Tồn cuối đã trừ đúng số lượng xuất.' : 'Đã cấp phát và giữ hàng theo FEFO.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Thao tác thất bại. Vui lòng kiểm tra lại tồn kho.');
    } finally { busy.current = false; setProcessing(false); }
  };
  const handleAllocateAndLock = (id: string) => runAction(id, false);
  const handleDispatchOrder = (id: string) => runAction(id, true);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <OutboundHeader
        orders={orders}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      {processing && <p role="status" className="text-sm text-indigo-600">Đang xử lý đơn xuất…</p>}
      {/* <WarehouseClosingBalances balances={stock} /> */}
      {/* Orders Table */}
      <OutboundOrderTable
        orders={orders}
        onSelectOrder={(order) => setSelectedOrder(order)}
        onAllocateAndLock={handleAllocateAndLock}
        onDispatchOrder={handleDispatchOrder}
        onOpenPickPath={(order) => setPickPathOrder(order)}
      />

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateOutboundModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreateOrder={handleCreateOrder}
        />
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <OutboundDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOpenPickPath={(order) => {
            setSelectedOrder(null);
            setPickPathOrder(order);
          }}
        />
      )}

      {/* Smart Pick-Path Routing Modal */}
      {pickPathOrder && (
        <PickPathVisualizerModal
          isOpen={Boolean(pickPathOrder)}
          onClose={() => setPickPathOrder(null)}
          order={pickPathOrder}
        />
      )}
    </div>
  );
};
