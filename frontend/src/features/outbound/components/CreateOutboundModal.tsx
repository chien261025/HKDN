import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, PackageCheck, Building2, AlertTriangle, RotateCcw } from 'lucide-react';
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
    const [orderType, setOrderType] = useState<'SO' | 'RTV'>('SO');
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
    const [carrier, setCarrier] = useState('Đội xe nội bộ WMS Logistics');
    const [vehiclePlate, setVehiclePlate] = useState(() => (warehouseId === 2 ? '99C-338.21' : '51C-892.44'));
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
                inventoryService.getClosingBalances(whId),
                outboundService.getWarehousePartners(whId),
            ]);
            setStock(data);
            setPartners(recipients);
            const hasCust = recipients.some(item => item.code?.startsWith('CUST-'));
            const suitable = recipients.filter(p => {
                if (orderType === 'RTV') return !p.code?.startsWith('CUST-');
                return hasCust ? (p.code?.startsWith('CUST-') || !p.code?.startsWith('SUP-')) : true;
            });
            if (suitable.length > 0) {
                setPartnerId(suitable[0].id);
            } else if (recipients.length > 0) {
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

    const hasCust = partners.some(item => item.code?.startsWith('CUST-'));
    const filteredPartners = partners.filter(p => {
        if (orderType === 'RTV') {
            return !p.code?.startsWith('CUST-');
        }
        return hasCust ? (p.code?.startsWith('CUST-') || !p.code?.startsWith('SUP-')) : true;
    });

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
            const prefix = orderType === 'RTV'
                ? (warehouseId === 2 ? 'RTV-BN-2026' : 'RTV-2026')
                : (warehouseId === 2 ? 'SO-BN-2026' : 'SO-2026');
            const soCode = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;

            const baseNote = notes || (orderType === 'RTV' ? 'Xuất trả hàng lỗi QC / bao bì móp méo theo biên bản tiếp nhận đơn PO' : '');
            const fullNotes = `[Vận chuyển: ${carrier} | Biển số: ${vehiclePlate}] ${baseNote}`.trim();

            await onCreateOrder({
                id: '',
                soCode,
                warehouseId,
                customerName: partner.name,
                partnerId: Number(partner.id),
                shippingAddress: orderType === 'RTV' ? 'Nhà máy / Kho trả hàng của Nhà cung cấp' : 'Địa chỉ giao hàng theo hợp đồng khách hàng',
                orderDate: new Date().toLocaleString('vi-VN'),
                requiredDate,
                priority: 'NORMAL',
                status: 'PENDING',
                dispatchCarrier: carrier,
                notes: fullNotes,
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
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${orderType === 'RTV'
                            ? 'bg-purple-50 text-purple-600 border-purple-200'
                            : 'bg-blue-50 text-blue-600 border-blue-200'
                            }`}>
                            {orderType === 'RTV' ? <RotateCcw className="h-5 w-5" /> : <PackageCheck className="h-5 w-5" />}
                        </div>
                        <div>
                            <h3 id="outbound-title" className="font-bold text-base text-slate-900">
                                {orderType === 'RTV' ? 'Tạo Phiếu Xuất Trả Nhà Cung Cấp (RTV)' : 'Tạo Đơn Đặt Hàng Xuất Kho (SO)'}
                            </h3>
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

                    {/* Loại Đơn Xuất Kho (SO vs RTV) */}
                    <div className="flex p-1 bg-slate-100 rounded-xl gap-1 border border-slate-200">
                        <button
                            type="button"
                            onClick={() => {
                                setOrderType('SO');
                                const firstCust = partners.find(p => p.code?.startsWith('CUST-')) || partners[0];
                                if (firstCust) setPartnerId(firstCust.id);
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${orderType === 'SO'
                                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Xuất Bán Hàng (SO)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setOrderType('RTV');
                                const firstSup = partners.find(p => !p.code?.startsWith('CUST-'));
                                if (firstSup) setPartnerId(firstSup.id);
                                if (!notes) setNotes('Xuất trả hàng lỗi QC theo biên bản tiếp nhận');
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${orderType === 'RTV'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Xuất Trả Nhà Cung Cấp (RTV)</span>
                        </button>
                    </div>

                    {orderType === 'RTV' && (
                        <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-900 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-bold">Nguồn xuất hàng:</span>
                                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[11px] border border-purple-300 font-mono">
                                    Khu Biệt Trữ / Cách Ly Kiểm Định (Quarantine Zone)
                                </span>
                            </div>
                            <span className="text-[11px] text-purple-700 italic">Xuất trừ hàng lỗi & giải phóng góc kho cách ly</span>
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
                                {orderType === 'RTV' ? 'Nhà Cung Cấp Nhận Hàng Trả (Vendor):' : 'Khách Hàng / Đối Tác Nhận:'}
                            </label>
                            <select
                                aria-label="Khách hàng / Đơn vị nhận"
                                className={inputClass}
                                value={partnerId}
                                onChange={e => setPartnerId(e.target.value)}
                                required
                                disabled={loading || saving}
                            >
                                <option value="" disabled>
                                    {orderType === 'RTV'
                                        ? 'Chọn nhà cung ứng tiếp nhận hàng trả (VD: Vinamilk)'
                                        : 'Chọn khách hàng / chuỗi bán lẻ tiếp nhận'}
                                </option>
                                {filteredPartners.map(p => {
                                    const isCust = p.code?.startsWith('CUST-');
                                    return (
                                        <option key={p.id} value={p.id}>
                                            {isCust ? '🏢 [Khách Hàng] ' : '🏭 [Nhà Cung Cấp] '}{cleanOutboundText(p.name)} ({p.code})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
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
                        <div>
                            <label className="space-y-1 text-xs font-bold text-slate-700 block mb-1">
                                Đơn Vị Vận Chuyển:
                            </label>
                            <select
                                className={inputClass}
                                value={carrier}
                                onChange={e => setCarrier(e.target.value)}
                            >
                                <option value="Đội xe nội bộ WMS Logistics">🚚 Đội xe nội bộ WMS Logistics</option>
                                <option value="Viettel Post Logistics">📦 Viettel Post Logistics</option>
                                <option value="Giao Hàng Tiết Kiệm (GHTK)">⚡ Giao Hàng Tiết Kiệm (GHTK)</option>
                                <option value="J&T Express Logistics">🚛 J&T Express Logistics</option>
                                <option value="Khách hàng tự điều xe lấy">🏢 Khách hàng tự điều xe đến nhận</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="space-y-1 text-xs font-bold text-slate-700 block mb-1">
                                Biển Số Xe / Lái Xe Bàn Giao:
                            </label>
                            <input
                                type="text"
                                value={vehiclePlate}
                                onChange={e => setVehiclePlate(e.target.value)}
                                className={inputClass}
                                placeholder="Ví dụ: 51C-892.44 - Lái xe Nguyễn Văn An"
                            />
                        </div>
                        <div>
                            <label className="space-y-1 text-xs font-bold text-slate-700 block mb-1">
                                Ghi Chú Vận Hành:
                            </label>
                            <input
                                type="text"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className={inputClass}
                                placeholder="Ghi chú đơn hàng (nếu có)..."
                            />
                        </div>
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

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            {orderType === 'RTV' ? 'Ghi Chú Xuất Trả Nhà Cung Cấp:' : 'Ghi Chú Đơn Hàng SO:'}
                        </label>
                        <input
                            className={inputClass}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder={orderType === 'RTV' ? 'Ghi chú lý do xuất trả (VD: Xuất trả 10 hộp lỗi bao bì theo biên bản PO)...' : 'Ghi chú đơn vị vận chuyển, yêu cầu bốc xếp...'}
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
                            className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md disabled:opacity-40 cursor-pointer transition-all ${orderType === 'RTV'
                                ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                }`}
                        >
                            {saving
                                ? 'Đang tạo...'
                                : orderType === 'RTV'
                                    ? 'Tạo Phiếu Xuất Trả (Phát Hành RTV)'
                                    : 'Tạo Đơn Xuất Kho (Phát Hành SO)'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
