import React, { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { Modal } from '../../../components/common';
import { InboundOrder, remainingToStock } from '../types';
import { inboundService } from '../services/inboundService';
import { LocationDto, operatorService } from '../../operator/services/operatorService';

type Placement = Omit<Parameters<typeof inboundService.executePutaway>[0], 'orderId'>;
interface Props {
  order: InboundOrder;
  onClose: () => void;
  onConfirmPutaway: (id: string, placement: Placement) => Promise<void>;
}

const zones: Record<string, string> = { AMBIENT: 'ZONE_A', COOL: 'ZONE_B', COLD: 'ZONE_C', SECURE: 'ZONE_D' };

export const PutawayExecutionModal: React.FC<Props> = ({ order, onClose, onConfirmPutaway }) => {
  const pending = order.items.filter(i => remainingToStock(i) > 0);
  const [itemId, setItemId] = useState(pending[0]?.id);
  const item = pending.find(i => i.id === itemId);
  const remaining = item ? remainingToStock(item) : 0;
  const [quantity, setQuantity] = useState(remaining);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [locationId, setLocationId] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const targetWh = order.warehouseId || 1;
    operatorService.getLocations().then(all => {
      if (active) setLocations(all.filter(l => l.isActive && (l.warehouseId === targetWh || !order.warehouseId)));
    }).catch(() => { if (active) setError('Không tải được danh sách kệ của kho.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [order.warehouseId]);

  const weight = quantity * (item?.weightKg ?? 0);
  const bins = locations.filter(l => l.maxWeightKg >= weight);
  const canSubmit = item?.productId && Number.isInteger(quantity) && quantity > 0 && quantity <= remaining
    && bins.some(l => l.id === locationId);

  const suggest = async () => {
    const whId = order.warehouseId || 1;
    if (!whId || !item || !zones[item.storageCondition ?? ''] || weight <= 0) return;
    setBusy(true); setError(''); setLocationId(0);
    try {
      const loc = await inboundService.suggestLocation(whId, zones[item.storageCondition!], weight);
      if (bins.some(l => l.id === loc?.id)) setLocationId(loc.id);
      else setError('Không có gợi ý phù hợp. Hãy chọn ô kệ thực tế trong kho.');
    } finally { setBusy(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !item?.productId) return;
    setBusy(true); setError('');
    try {
      await onConfirmPutaway(order.id, { orderItemId: Number(item.id), productId: item.productId,
        locationId, quantity, expectedStockedQty: item.stockedQty });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể ghi nhận cất kệ.');
    } finally { setBusy(false); }
  };

  return <Modal isOpen onClose={() => { if (!busy) onClose(); }} icon={<Layers />}
    title={`Cất hàng lên kệ · ${order.poCode}`} description="Ghi một lần cất cho một dòng hàng đã đạt QC.">
    <form onSubmit={submit} className="space-y-4 text-sm">
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <fieldset disabled={busy} className="space-y-3">
        <label className="block">Dòng hàng chờ cất
          <select className="w-full border rounded p-2" value={itemId ?? ''} onChange={e => {
            const next = pending.find(i => i.id === e.target.value);
            setItemId(next?.id); setQuantity(next ? remainingToStock(next) : 0); setLocationId(0); setError('');
          }}>
            {pending.map(i => <option key={i.id} value={i.id}>{i.productName} · Lô {i.batchNumber} · Còn {remainingToStock(i)} {i.unit}</option>)}
          </select>
        </label>
        <label className="block">Số lượng cất lần này
          <input className="w-full border rounded p-2" type="number" required min={1} max={remaining} value={quantity}
            onChange={e => { setQuantity(Number(e.target.value)); setLocationId(0); }} />
        </label>
        <label className="block">Ô kệ đích
          <select className="w-full border rounded p-2" value={locationId} onChange={e => setLocationId(Number(e.target.value))}>
            <option value={0}>{loading ? 'Đang tải kệ…' : 'Chọn ô kệ thực tế'}</option>
            {bins.map(l => <option key={l.id} value={l.id}>{l.binBarcode} · {l.zoneCode}</option>)}
          </select>
        </label>
        <button type="button" className="text-indigo-700 underline" disabled={loading || !zones[item?.storageCondition ?? ''] || weight <= 0}
          onClick={suggest}>Gợi ý theo phân khu và trọng lượng</button>
      </fieldset>
      <button disabled={busy || !canSubmit} className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50">
        Xác nhận cất kệ và ghi sổ cái
      </button>
    </form>
  </Modal>;
};
