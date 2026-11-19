import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, PackageCheck } from 'lucide-react';
import { OutboundOrder, OutboundStock } from '../types';
import { outboundService } from '../services/outboundService';
import { inventoryService } from '../../inventory/services/inventoryService';
import { SupplierItem } from '../../products/types';
import { PRIMARY_WAREHOUSE } from '../../../config/warehouse';

interface Props {
  onClose: () => void;
  onCreateOrder: (order: OutboundOrder) => Promise<void>;
}

export const CreateOutboundModal: React.FC<Props> = ({ onClose, onCreateOrder }) => {
  const [stock, setStock] = useState<OutboundStock[]>([]);
  const warehouseId = PRIMARY_WAREHOUSE.id;
  const [partners, setPartners] = useState<Pick<SupplierItem, 'id' | 'code' | 'name'>[]>([]);
  const [partnerId, setPartnerId] = useState('');
  const partner = partners.find(p => p.id === partnerId);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productId: number | null; qty: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([inventoryService.getClosingBalances(), outboundService.getWarehousePartners()]).then(([data, recipients]) => {
      if (!active) return;
      setStock(data);
      setPartners(recipients);
    }).catch(() => {
      if (active) setError('Không tải được tồn cuối hoặc đối tác của kho. Vui lòng đóng và mở lại để thử lại.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const products = stock.filter(p => p.warehouseId === warehouseId && p.availableQty > 0);
  const valid = items.length > 0 && items.every(i => i.productId !== null && Number.isInteger(i.qty) && i.qty > 0
    && i.qty <= (products.find(p => p.productId === i.productId)?.availableQty ?? 0));
  const inputClass = 'w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || saving || !partner) return;
    setSaving(true);
    setError('');
    try {
      await onCreateOrder({
        id: '', soCode: `SO-${Date.now()}`, warehouseId,
        customerName: partner.name, partnerId: Number(partner.id), shippingAddress: '', orderDate: '', requiredDate: '',
        priority: 'NORMAL', status: 'PENDING', notes,
        items: items.map((i, index) => {
          const p = products.find(p => p.productId === i.productId)!;
          return { id: String(index), productId: p.productId, sku: p.sku, productName: p.name,
            requestedQty: i.qty, allocatedQty: 0, pickedQty: 0, unit: p.unit, allocations: [] };
        }),
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không tạo được đơn xuất kho.');
      try { setStock(await inventoryService.getClosingBalances()); } catch { /* Keep form for retry. */ }
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="outbound-title" className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h3 id="outbound-title" className="flex items-center gap-2 font-bold"><PackageCheck className="h-5 w-5 text-indigo-600" />Tạo đơn xuất kho</h3>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Đóng"><X /></button>
        </div>
<<<<<<< HEAD
        <form onSubmit={submit} className="space-y-5 p-5">
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          {loading ? <p>Đang tải tồn kho…</p> : products.length === 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Kho chưa có sản phẩm khả dụng để xuất.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold">Kho xuất
              <input aria-label="Kho xuất" className={`${inputClass} bg-slate-100`} value={PRIMARY_WAREHOUSE.name} readOnly />
            </label>
            <label className="space-y-1 text-sm font-semibold">Khách hàng / Đơn vị nhận
              <select aria-label="Khách hàng / Đơn vị nhận" className={inputClass} value={partnerId} onChange={e => setPartnerId(e.target.value)} required disabled={loading || saving}>
                <option value="" disabled>Chọn đối tác của kho</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
=======

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div>
            <label className="text-slate-700 font-bold block mb-1.5">Khách Hàng / Đối Tác Nhận:</label>
            <select
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            >
              {CUSTOMERS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-700 font-bold block mb-1.5">Hạn Giao Hàng:</label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1.5">Mức Độ Ưu Tiên:</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-amber-800 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="NORMAL">Bình Thường</option>
                <option value="HIGH">Ưu Tiên Cao</option>
                <option value="URGENT">Hỏa Tốc</option>
>>>>>>> 36fa9b52849e24e253b8552373cbd59e9c2fe860
              </select>
            </label>
          </div>
          {!loading && partners.length === 0 && <p role="alert" className="text-sm text-amber-700">Chưa có đối tác đang hoạt động có sản phẩm trong kho.</p>}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Sản phẩm xuất ({items.length})</h4>
            <button type="button" className="flex items-center gap-1 text-sm font-semibold text-indigo-600 disabled:opacity-40" disabled={loading || saving || items.length >= products.length} onClick={() => setItems(prev => [...prev, { productId: null, qty: 1 }])}><Plus className="h-4 w-4" />Thêm sản phẩm</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="p-2">Sản phẩm</th><th className="p-2">Tồn cuối hiện tại</th><th className="p-2">Khả dụng</th><th className="p-2">Số lượng xuất</th><th className="p-2">Tồn cuối sau xuất</th><th /></tr></thead>
              <tbody>
                {items.map((item, index) => {
                  const p = products.find(p => p.productId === item.productId);
                  return <tr key={index} className="border-b">
                    <td className="min-w-56 p-2"><select aria-label={`Sản phẩm ${index + 1}`} className={inputClass} value={item.productId ?? ''} required disabled={saving} onChange={e => setItems(prev => prev.map((i, n) => n === index ? { productId: Number(e.target.value), qty: 1 } : i))}>
                      <option value="" disabled>Chọn sản phẩm từ tồn cuối</option>
                      {item.productId !== null && !p && <option value={item.productId} disabled>Sản phẩm đã hết tồn khả dụng</option>}
                      {products.filter(p => p.productId === item.productId || !items.some(i => i.productId === p.productId)).map(p => <option key={p.productId} value={p.productId}>{p.name} ({p.sku})</option>)}
                    </select><span className="text-xs text-slate-500">{p?.unit}</span></td>
                    <td className="p-2 tabular-nums">{p?.onHandQty.toLocaleString('vi-VN') ?? '—'}</td>
                    <td className="p-2 tabular-nums">{p?.availableQty.toLocaleString('vi-VN') ?? 0}</td>
                    <td className="p-2"><input aria-label={`Số lượng xuất ${index + 1}`} type="number" min={1} max={p?.availableQty ?? 0} step={1} required disabled={saving || !p} className={`${inputClass} min-w-24`} value={item.qty || ''} onChange={e => setItems(prev => prev.map((i, n) => n === index ? { ...i, qty: Number(e.target.value) } : i))} /></td>
                    <td className="p-2 font-semibold text-emerald-700 tabular-nums">{p ? (p.onHandQty - item.qty).toLocaleString('vi-VN') : '—'}</td>
                    <td className="p-2"><button type="button" aria-label={`Xóa sản phẩm ${index + 1}`} disabled={saving} onClick={() => setItems(prev => prev.filter((_, n) => n !== index))}><Trash2 className="h-4 w-4 text-rose-600" /></button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
<<<<<<< HEAD
          <p className="text-xs text-slate-500">Tồn cuối dự kiến = tồn hiện tại − số lượng xuất. Tồn thực tế chỉ giảm khi xác nhận xuất kho; hàng được lấy theo FEFO trong kho của đơn.</p>
          <label className="block space-y-1 text-sm font-semibold">Ghi chú<input className={inputClass} value={notes} onChange={e => setNotes(e.target.value)} disabled={saving} /></label>
          <div className="flex justify-end gap-3 border-t pt-4">
            <button type="button" disabled={saving} onClick={onClose} className="rounded-lg bg-slate-100 px-5 py-2.5 font-semibold">Hủy</button>
            <button type="submit" disabled={loading || saving || !valid || !partner} className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white disabled:opacity-40">{saving ? 'Đang tạo…' : 'Tạo đơn xuất kho'}</button>
=======

          <div className="flex gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200 cursor-pointer transition-all"
            >
              Tạo Đơn Xuất Kho
            </button>
>>>>>>> 36fa9b52849e24e253b8552373cbd59e9c2fe860
          </div>
        </form>
      </div>
    </div>
  );
};
