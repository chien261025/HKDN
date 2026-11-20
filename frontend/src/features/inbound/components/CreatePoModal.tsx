import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Building2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { InboundOrder } from '../types';
import { productService } from '../../products/services/productService';
import { ProductItem, SupplierItem } from '../../products/types';
import { WarehouseItem } from '../../masterdata/types';
import { warehouseService, DEFAULT_WAREHOUSES } from '../../masterdata/services/warehouseService';
import { LocationDto, operatorService } from '../../operator/services/operatorService';

interface CreatePoModalProps {
  initialWarehouseId?: string | number;
  onClose: () => void;
  onCreateOrder: (order: InboundOrder) => Promise<void>;
}

interface PoItemRow {
  productId?: number;
  sku: string;
  productName: string;
  expectedQty: number;
  unit: string;
  unitPrice: number;
}

export const CreatePoModal: React.FC<CreatePoModalProps> = ({ initialWarehouseId, onClose, onCreateOrder }) => {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>(DEFAULT_WAREHOUSES);
  const [warehouseId, setWarehouseId] = useState<number>(() => {
    if (initialWarehouseId && initialWarehouseId !== 'ALL') {
      const m = String(initialWarehouseId).match(/\d+/);
      if (m) return parseInt(m[0], 10);
    }
    return 1;
  });

  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [supplierCode, setSupplierCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('Giao hàng buổi sáng trước 11h. Xe tải có bửng nâng hạ.');

  const [items, setItems] = useState<PoItemRow[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);

  useEffect(() => {
    operatorService.getLocations().then((all) => {
      setLocations(all.filter((l) => l.isActive && (l.warehouseId === warehouseId || !warehouseId)));
    }).catch(() => {});
  }, [warehouseId]);

  const selectedSupplier = suppliers.find((s) => s.code === supplierCode);
  const supplierProducts = availableProducts.filter(
    (p) => p.status === 'ACTIVE' && selectedSupplier && String(p.supplierId) === selectedSupplier.id
  );

  // Enterprise Real-time Weight & Zone Capacity Checking
  const zoneRequirement = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of items) {
      const prod = availableProducts.find((p) => Number(p.id) === it.productId);
      const unitWeight = prod?.weightKg || 1;
      const condition = prod?.storageCondition || 'AMBIENT';
      const zone = condition === 'COOL' ? 'ZONE_B' : condition === 'COLD' ? 'ZONE_C' : condition === 'SECURE' ? 'ZONE_D' : 'ZONE_A';
      map[zone] = (map[zone] || 0) + (it.expectedQty * unitWeight);
    }
    return map;
  }, [items, availableProducts]);

  const totalPoWeightKg = Object.values(zoneRequirement).reduce((sum, w) => sum + w, 0);

  const capacityWarning = React.useMemo(() => {
    if (locations.length === 0) return null;
    for (const [zone, neededWeight] of Object.entries(zoneRequirement)) {
      const zoneCapacity = locations
        .filter((l) => l.zoneCode === zone)
        .reduce((sum, l) => sum + (l.maxWeightKg || 0), 0);
      if (zoneCapacity > 0 && neededWeight > zoneCapacity) {
        const zoneLabel = zone === 'ZONE_B' ? 'Kho Mát (Zone B)' : zone === 'ZONE_C' ? 'Kho Đông (Zone C)' : 'Kho Khô (Zone A)';
        return `Lưu ý tải trọng: Đơn hàng dự kiến (${neededWeight.toLocaleString()} kg) vượt quá sức chứa kệ tức thời của ${zoneLabel} (${zoneCapacity.toLocaleString()} kg). Hệ thống vẫn cho phép phát hành PO phục vụ kế hoạch mua hàng; khuyến nghị điều phối chia đợt giao hoặc áp dụng Cross-Docking luân chuyển xuất ngay.`;
      }
    }
    return null;
  }, [zoneRequirement, locations]);

  useEffect(() => {
    warehouseService.getWarehouses().then((whs) => {
      if (whs && whs.length > 0) {
        setWarehouses(whs);
      }
    });

    productService.getSuppliers().then((supps) => {
      if (supps && supps.length > 0) {
        setSuppliers(supps);
        setSupplierCode(supps[0].code);
      }
    });

    productService.getProducts().then((prods) => {
      if (prods && prods.length > 0) {
        setAvailableProducts(prods);
      }
    });
  }, []);

  useEffect(() => {
    setItems((current) => {
      const valid = current.filter((item) =>
        supplierProducts.some((p) => Number(p.id) === item.productId)
      );
      if (valid.length) return valid;
      const first = supplierProducts[0];
      if (first) {
        return [
          {
            productId: Number(first.id),
            sku: first.sku,
            productName: first.name,
            expectedQty: 50,
            unit: first.unit,
            unitPrice: first.purchasePrice || 0,
          },
        ];
      }
      return [];
    });
  }, [supplierCode, availableProducts, suppliers]);

  const handleAddItem = () => {
    if (supplierProducts.length > 0) {
      const p = supplierProducts[items.length % supplierProducts.length];
      setItems((prev) => [
        ...prev,
        {
          productId: Number(p.id),
          sku: p.sku,
          productName: p.name,
          expectedQty: 50,
          unit: p.unit,
          unitPrice: p.purchasePrice || 0,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalPoValue = items.reduce((sum, it) => sum + it.expectedQty * (it.unitPrice || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !items.length || items.some((item) => !item.productId)) {
      setError('Vui lòng chọn nhà cung cấp có sản phẩm hợp lệ.');
      return;
    }
    const poPrefix = warehouseId === 2 ? 'PO-BN-2026' : 'PO-2026';
    const poNumber = `${poPrefix}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: InboundOrder & { supplierId?: number } = {
      id: `po-${Date.now()}`,
      poCode: poNumber,
      warehouseId: warehouseId,
      supplierId: selectedSupplier ? Number(selectedSupplier.id) : 1,
      supplierName: selectedSupplier ? selectedSupplier.name : 'Nhà Cung Cấp Tổng Hợp',
      supplierCode: selectedSupplier ? selectedSupplier.code : supplierCode,
      expectedDeliveryDate: expectedDate,
      createdAt: 'Vừa xong',
      status: 'PENDING',
      notes,
      totalValue: totalPoValue,
      items: items.map((it, idx) => ({
        id: `item-${idx + 1}`,
        productId: it.productId,
        sku: it.sku,
        productName: it.productName,
        expectedQty: it.expectedQty,
        receivedQty: 0,
        stockedQty: 0,
        unit: it.unit,
        unitPrice: it.unitPrice || 0,
      })),
      approvedBy: 'Trần Trưởng Kho',
    };

    setSubmitting(true);
    setError(null);
    try {
      await onCreateOrder(newOrder);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tạo đơn nhập kho');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Tạo Đơn Đặt Hàng Nhập Kho (PO)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Bước 1: Khởi tạo PO từ Nhà Cung Cấp (Chưa cộng tồn kho)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {/* Chọn Nhà cung cấp */}
          <div>
            <label className="text-slate-700 font-bold block mb-1 text-xs">Chọn Nhà Cung Cấp:</label>
            <select
              value={supplierCode}
              onChange={(e) => setSupplierCode(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-700 font-bold block mb-1 text-xs">Ngày Giao Hàng Dự Kiến:</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                required
                className="w-full p-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1 text-xs">Kho Đích Tiếp Nhận:</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Danh sách mặt hàng đặt */}
          <div className="space-y-2">
            {supplierProducts.length === 0 && (
              <p role="alert" className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                Nhà cung cấp này chưa có sản phẩm nào đang hoạt động trong danh mục Master Data.
              </p>
            )}
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-bold text-xs">
                Danh Sách Mặt Hàng Đặt Nhập ({items.length}):
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm dòng hàng</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <select
                        value={it.sku}
                        onChange={(e) => {
                          const newSku = e.target.value;
                          const matched = supplierProducts.find((p) => p.sku === newSku);
                          setItems((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? {
                                    ...item,
                                    productId: matched ? Number(matched.id) : undefined,
                                    sku: newSku,
                                    productName: matched ? matched.name : item.productName,
                                    unit: matched ? matched.unit : item.unit,
                                    unitPrice: matched ? (matched.purchasePrice || 0) : item.unitPrice,
                                  }
                                : item
                            )
                          );
                        }}
                        className="w-full p-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-600"
                      >
                        {supplierProducts.map((p) => (
                          <option key={p.id} value={p.sku}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Xóa dòng mặt hàng này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-12 gap-2 text-xs items-center">
                    <div className="col-span-4">
                      <span className="text-[11px] text-slate-500 block mb-0.5">Số lượng đặt:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={it.expectedQty}
                          min="1"
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, expectedQty: val } : item))
                            );
                          }}
                          className="w-full p-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold text-center focus:outline-none focus:border-blue-600"
                        />
                        <span className="text-slate-700 font-bold whitespace-nowrap">{it.unit}</span>
                      </div>
                    </div>

                    <div className="col-span-4">
                      <span className="text-[11px] text-slate-500 block mb-0.5">Đơn giá mua:</span>
                      <input
                        type="number"
                        step="500"
                        min="0"
                        value={it.unitPrice}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setItems((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, unitPrice: val } : item))
                          );
                        }}
                        className="w-full p-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold text-right focus:outline-none focus:border-blue-600"
                      />
                      <span className="text-[10px] text-slate-500 block text-right mt-0.5 font-mono">
                        {(it.unitPrice || 0).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>

                    <div className="col-span-4">
                      <span className="text-[11px] text-slate-500 block mb-0.5">Thành tiền:</span>
                      <div className="p-1.5 font-mono font-bold text-emerald-700 text-right bg-emerald-50 rounded-lg border border-emerald-200">
                        {(it.expectedQty * (it.unitPrice || 0)).toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Order Amount & Weight Banner */}
            <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-blue-900 font-semibold">TỔNG GIÁ TRỊ ĐƠN HÀNG PO:</span>
                <span className="font-extrabold text-blue-700 text-base">
                  {totalPoValue.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-blue-200/60">
                <span className="text-slate-600 font-medium">Tổng tải trọng dự kiến:</span>
                <span className="font-bold text-slate-800">
                  {totalPoWeightKg.toLocaleString()} kg
                </span>
              </div>
            </div>

            {capacityWarning && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-800">Cảnh Báo Sức Chứa Phân Khu (Capacity Advisory)</div>
                  <div className="text-[11px] leading-relaxed text-amber-700">{capacityWarning}</div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1 text-xs">Ghi Chú Đơn Hàng PO:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && <p role="alert" className="text-xs text-red-700 bg-red-50 p-2 rounded-lg border border-red-200">{error}</p>}

          <div className="flex gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs shadow-sm shadow-blue-200 cursor-pointer transition-all"
            >
              {submitting ? 'Đang tạo đơn...' : 'Tạo Đơn Nhập Kho (Phát Hành PO)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
