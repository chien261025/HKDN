import React, { useEffect, useState } from 'react';
import { Layers, AlertTriangle } from 'lucide-react';
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
        <label className="block">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-700">Số lượng cất lần này</span>
            <span className="text-xs text-slate-500 font-medium">Tối đa còn: <strong className="text-emerald-700 font-mono">{remaining.toLocaleString()}</strong> {item?.unit || 'kiện'}</span>
          </div>
          <input
            className={`w-full border rounded-xl p-2.5 text-sm font-semibold transition-all ${
              quantity > remaining || quantity <= 0
                ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-200'
                : 'border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-200'
            }`}
            type="number"
            required
            min={1}
            max={remaining}
            value={quantity}
            onChange={e => {
              setQuantity(Number(e.target.value));
              setLocationId(0);
            }}
          />
          {quantity > remaining && (
            <div className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Chặn cất khống: Số lượng ({quantity.toLocaleString()}) vượt quá {remaining.toLocaleString()} {item?.unit || 'kiện'} đạt QC của đơn hàng!</span>
            </div>
          )}
        </label>

        <label className="block">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-700">Ô kệ đích</span>
            {weight > 0 && (
              <span className="text-xs text-slate-500 font-medium">
                Tải trọng lô hàng: <strong className={bins.length === 0 ? 'text-rose-600 font-bold font-mono' : 'text-slate-800 font-mono'}>{weight.toLocaleString()} kg</strong>
              </span>
            )}
          </div>
          <select
            className={`w-full border rounded-xl p-2.5 text-sm transition-all ${
              bins.length === 0 && weight > 0
                ? 'border-rose-400 bg-rose-50 text-rose-800'
                : 'border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-200'
            }`}
            value={locationId}
            onChange={e => setLocationId(Number(e.target.value))}
          >
            <option value={0}>
              {loading
                ? 'Đang tải kệ…'
                : bins.length === 0 && weight > 0
                ? `❌ Không có ô kệ nào đủ tải trọng cho ${weight.toLocaleString()} kg!`
                : 'Chọn ô kệ thực tế'}
            </option>
            {bins.map(l => (
              <option key={l.id} value={l.id}>
                {l.binBarcode} · {l.zoneCode} (Tải trọng max: {l.maxWeightKg} kg)
              </option>
            ))}
          </select>
          {bins.length === 0 && weight > 0 && (
            <div className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Cảnh báo an toàn: Trọng lượng {weight.toLocaleString()} kg quá nặng, không thể cất vào bất kỳ ô kệ nào trong kho (tránh sập kệ)!</span>
            </div>
          )}
        </label>
        <button
          type="button"
          className="text-indigo-700 underline text-xs font-semibold cursor-pointer disabled:opacity-50"
          disabled={loading || !zones[item?.storageCondition ?? ''] || weight <= 0 || bins.length === 0}
          onClick={suggest}
        >
          Gợi ý theo phân khu và trọng lượng
        </button>
      </fieldset>
      <div className="pt-2">
        <button
          disabled={busy || !canSubmit}
          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold px-4 py-2.5 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center gap-2"
        >
          {canSubmit ? (
            <span>Xác nhận cất kệ và ghi sổ cái</span>
          ) : (
            <span className="text-xs">Đang bị khóa (Nhập số lượng ≤ {remaining.toLocaleString()} & chọn ô kệ hợp lệ)</span>
          )}
        </button>
      </div>
    </form>
  </Modal>;
};
