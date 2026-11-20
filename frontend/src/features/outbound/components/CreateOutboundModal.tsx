import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, PackageCheck, Building2, Info, AlertTriangle } from 'lucide-react';
import { OutboundOrder, OutboundStock } from '../types';
import { outboundService, cleanOutboundText } from '../services/outboundService';
import { inventoryService } from '../../inventory/services/inventoryService';
import { SupplierItem } from '../../products/types';
import { WarehouseItem } from '../../masterdata/types';
import { warehouseService, DEFAULT_WAREHOUSES } from '../../masterdata/services/warehouseService';

interface Props {
  initialWarehouseId?: string | number;
  onClose: () => void;
  onCreateOrder: (order: OutboundOrder) => Promise<void>;
}

export const CreateOutboundModal: React.FC<Props> = ({ initialWarehouseId, onClose, onCreateOrder }) => {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>(DEFAULT_WAREHOUSES);
  const [warehouseId, setWarehouseId] = useState<number>(() => {
    if (initialWarehouseId && initialWarehouseId !== 'ALL') {
      const m = String(initialWarehouseId).match(/\d+/);
      if (m) return parseInt(m[0], 10);
    }
    return 1;
  });

  const [stock, setStock] = useState<OutboundStock[]>([]);
  const [partners, setPartners] = useState<Pick<SupplierItem, 'id' | 'code' | 'name'>[]>([]);
  const [partnerId, setPartnerId] = useState('');
  const partner = partners.find(p => p.id === partnerId);
  const [notes, setNotes] = useState('');
  const [requiredDate, setRequiredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return `${d.toISOString().split('T')[0]} 18:00`;
  });
  const [items, setItems] = useState<Array<{ productId: number | null; qty: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    warehouseService.getWarehouses().then((whs) => {
      if (whs && whs.length > 0) setWarehouses(whs);
    });
  }, []);

  const loadDataForWarehouse = async (whId: number) => {
    setLoading(true);
    try {
      const [data, recipients] = await Promise.all([
        inventoryService.getClosingBalances(),
        outboundService.getWarehousePartners(whId),
      ]);
      setStock(data);
      setPartners(recipients);
      if (recipients.length > 0) {
        setPartnerId(recipients[0].id);
      } else {
        setPartnerId('');
      }
    } catch {
      setError('Không tải được tồn kho hoặc đối tác cho kho đã chọn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataForWarehouse(warehouseId);
  }, [warehouseId]);

  const products = stock.filter(p => p.warehouseId === warehouseId && p.availableQty > 0);
  const valid = items.length > 0 && items.every(i => i.productId !== null && Number.isInteger(i.qty) && i.qty > 0
    && i.qty <= (products.find(p => p.productId === i.productId)?.availableQty ?? 0));
  const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || saving || !partner) return;
    setSaving(true);
    setError('');
    try {
      const soPrefix = warehouseId === 2 ? 'SO-BN-2026' : 'SO-2026';
      const soCode = `${soPrefix}-${Math.floor(100 + Math.random() * 900)}`;

      await onCreateOrder({
        id: '',
        soCode,
        warehouseId,
        customerName: partner.name,
        partnerId: Number(partner.id),
        shippingAddress: 'Địa chỉ giao hàng theo hợp đồng khách hàng',
        orderDate: new Date().toLocaleString('vi-VN'),
        requiredDate,
        priority: 'NORMAL',
        status: 'PENDING',
        notes,
        items: items.map((i, index) => {
          const p = products.find(p => p.productId === i.productId)!;
          return {
            id: String(index + 1),
            productId: p.productId,
            sku: p.sku,
            productName: p.name,
            requestedQty: i.qty,
            allocatedQty: 0,
            pickedQty: 0,
            unit: p.unit,
            allocations: [],
          };
        }),
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không tạo được đơn xuất kho.');
      try { setStock(await inventoryService.getClosingBalances()); } catch { /* Retry */ }
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div role="dialog" aria-modal="true" aria-labelledby="outbound-title" className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 id="outbound-title" className="font-bold text-base text-slate-900">
                Tạo Đơn Đặt Hàng Xuất Kho (SO)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Khởi tạo nhu cầu xuất hàng từ khách hàng (Tồn khả dụng sẽ được giữ chỗ an toàn khi duyệt phân bổ)
              </p>
            </div>
          </div>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Đóng" className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6 text-sm">
          {error && (
            <div role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="space-y-1 text-xs font-bold text-slate-700 block mb-1">
                Kho Xuất Hàng:
              </label>
              <select
                aria-label="Kho xuất hàng"
                className={inputClass}
                value={warehouseId}
                onChange={e => {
                  setWarehouseId(Number(e.target.value));
                  setItems([]);
                }}
                disabled={loading || saving}
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="space-y-1 text-xs font-bold text-slate-700 block mb-1">
                Khách Hàng / Đối Tác Nhận:
              </label>
              <select
                aria-label="Khách hàng / Đơn vị nhận"
                className={inputClass}
                value={partnerId}
                onChange={e => setPartnerId(e.target.value)}
                required
                disabled={loading || saving}
              >
                <option value="" disabled>Chọn khách hàng / chuỗi bán lẻ tiếp nhận</option>
                {partners.map(p => {
                  const isCust = p.code?.startsWith('CUST-');
                  return (
                    <option key={p.id} value={p.id}>
                      {isCust ? '🏢 [Khách Hàng] ' : ''}{cleanOutboundText(p.name)} ({p.code})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="space-y-1 text-xs font-bold text-slate-700 block mb-1">
              Thời Hạn Giao Hàng Dự Kiến:
            </label>
            <input
              type="text"
              value={requiredDate}
              onChange={e => setRequiredDate(e.target.value)}
              className={inputClass}
              placeholder="YYYY-MM-DD HH:mm (Ví dụ: 2026-11-30 18:00)"
              required
            />
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Danh Sách Sản Phẩm Xuất ({items.length}):
              </label>
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-40 cursor-pointer"
                disabled={loading || saving || items.length >= products.length}
                onClick={() => setItems(prev => [...prev, { productId: null, qty: 1 }])}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm sản phẩm</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-3">Sản phẩm (SKU)</th>
                    <th className="p-3 text-right">Tồn Vật Lý</th>
                    <th className="p-3 text-right">Khả Dụng</th>
                    <th className="p-3 text-center w-28">Số Lượng Xuất</th>
                    <th className="p-3 text-right">Khả Dụng Sau Giữ</th>
                    <th className="p-3 text-center w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, index) => {
                    const p = products.find(p => p.productId === item.productId);
                    const remainingAvailable = p ? p.availableQty - item.qty : 0;
                    return (
                      <tr key={index} className="hover:bg-slate-50/80">
                        <td className="p-3 min-w-56">
                          <select
                            aria-label={`Sản phẩm ${index + 1}`}
                            className={inputClass}
                            value={item.productId ?? ''}
                            required
                            disabled={saving}
                            onChange={e => setItems(prev => prev.map((i, n) => n === index ? { productId: Number(e.target.value), qty: 1 } : i))}
                          >
                            <option value="" disabled>Chọn sản phẩm từ danh mục tồn kho</option>
                            {products
                              .filter(prod => prod.productId === item.productId || !items.some(i => i.productId === prod.productId))
                              .map(prod => (
                                <option key={prod.productId} value={prod.productId}>
                                  {prod.name} ({prod.sku}) — Khả dụng: {prod.availableQty} {prod.unit}
                                </option>
                              ))}
                          </select>
                        </td>

                        <td className="p-3 text-right font-bold tabular-nums text-slate-800">
                          {p ? `${p.onHandQty.toLocaleString('vi-VN')} ${p.unit}` : '—'}
                        </td>

                        <td className="p-3 text-right font-black tabular-nums text-blue-700">
                          {p ? `${p.availableQty.toLocaleString('vi-VN')} ${p.unit}` : '—'}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              aria-label={`Số lượng xuất ${index + 1}`}
                              type="number"
                              min={1}
                              max={p?.availableQty ?? 1}
                              step={1}
                              required
                              disabled={saving || !p}
                              className="w-20 p-1.5 text-center font-bold font-mono text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600"
                              value={item.qty || ''}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10) || 1;
                                setItems(prev => prev.map((i, n) => n === index ? { ...i, qty: val } : i));
                              }}
                            />
                            <span className="text-[11px] font-bold text-slate-600">{p?.unit}</span>
                          </div>
                        </td>

                        <td className="p-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                          {p ? `${Math.max(0, remainingAvailable).toLocaleString('vi-VN')} ${p.unit}` : '—'}
                        </td>

                        <td className="p-3 text-center">
                          <button
                            type="button"
                            aria-label={`Xóa sản phẩm ${index + 1}`}
                            disabled={saving}
                            onClick={() => setItems(prev => prev.filter((_, n) => n !== index))}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {items.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-500">
                  Chưa có sản phẩm nào được chọn. Nhấn <strong>+ Thêm sản phẩm</strong> ở trên để thêm dòng xuất kho.
                </div>
              )}
            </div>
          </div>

          {/* WMS Reservation Guidance Note */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Nguyên tắc kiểm soát tồn xuất:</strong> Sau khi tạo đơn, hệ thống sẽ thực hiện khóa giữ chỗ an toàn <strong>(Reservation)</strong> theo đúng số lượng yêu cầu. Tồn khả dụng (Available) sẽ giảm để chống xuất âm, trong khi tồn vật lý trên kệ (On-hand) chỉ được trừ khi nhân viên hoàn tất xuất kho.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Đơn Hàng SO:</label>
            <input
              className={inputClass}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ghi chú đơn vị vận chuyển, yêu cầu bốc xếp..."
              disabled={saving}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-3">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || saving || !valid || !partner}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white shadow-md shadow-blue-200 disabled:opacity-40 cursor-pointer transition-all"
            >
              {saving ? 'Đang tạo...' : 'Tạo Đơn Xuất Kho (Phát Hành SO)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
