import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Building2 } from 'lucide-react';
import { InboundOrder, InboundOrderItem } from '../types';
import { productService } from '../../products/services/productService';
import { ProductItem, SupplierItem } from '../../products/types';

interface CreatePoModalProps {
  onClose: () => void;
  onCreateOrder: (order: InboundOrder) => void;
}

export const CreatePoModal: React.FC<CreatePoModalProps> = ({ onClose, onCreateOrder }) => {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [supplierCode, setSupplierCode] = useState('');
  const [expectedDate, setExpectedDate] = useState('2026-10-30');
  const [notes, setNotes] = useState('Giao hàng buổi sáng trước 11h. Xe tải có bửng nâng hạ.');

  const [items, setItems] = useState<Array<{ productId?: number; sku: string; productName: string; expectedQty: number; unit: string }>>([
    { sku: 'SKU-MILK-100', productName: 'Sữa tươi Vinamilk 100% 1L', expectedQty: 100, unit: 'Hộp' },
  ]);

  useEffect(() => {
    productService.getSuppliers().then((supps) => {
      if (supps && supps.length > 0) {
        setSuppliers(supps);
        setSupplierCode(supps[0].code);
      }
    });

    productService.getProducts().then((prods) => {
      if (prods && prods.length > 0) {
        setAvailableProducts(prods);
        setItems([
          {
            productId: Number(prods[0].id),
            sku: prods[0].sku,
            productName: prods[0].name,
            expectedQty: 50,
            unit: prods[0].unit,
          },
        ]);
      }
    });
  }, []);

  const handleAddItem = () => {
    if (availableProducts.length > 0) {
      const p = availableProducts[items.length % availableProducts.length];
      setItems((prev) => [
        ...prev,
        { productId: Number(p.id), sku: p.sku, productName: p.name, expectedQty: 50, unit: p.unit },
      ]);
    } else {
      setItems((prev) => [
        ...prev,
        { sku: 'SKU-OMO-MATIC', productName: 'Nước giặt OMO Matic 3.6kg', expectedQty: 50, unit: 'Túi' },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSupplier = suppliers.find((s) => s.code === supplierCode) || suppliers[0];
    const poNumber = `PO-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: InboundOrder & { supplierId?: number } = {
      id: `po-${Date.now()}`,
      poCode: poNumber,
      supplierId: selectedSupplier ? Number(selectedSupplier.id) : 1,
      supplierName: selectedSupplier ? selectedSupplier.name : 'Nhà Cung Cấp Tổng Hợp',
      supplierCode: selectedSupplier ? selectedSupplier.code : supplierCode,
      expectedDeliveryDate: expectedDate,
      createdAt: 'Vừa xong',
      status: 'PENDING',
      notes,
      items: items.map((it, idx) => ({
        id: `item-${idx + 1}`,
        productId: it.productId,
        sku: it.sku,
        productName: it.productName,
        expectedQty: it.expectedQty,
        receivedQty: 0,
        stockedQty: 0,
        unit: it.unit,
      })),
      approvedBy: 'Trần Trưởng Kho',
    };

    onCreateOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-900">Tạo Đơn Đặt Hàng Nhập Kho (PO Mới)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div>
            <label className="text-slate-700 font-bold block mb-1.5">Chọn Nhà Cung Cấp:</label>
            <select
              value={supplierCode}
              onChange={(e) => setSupplierCode(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
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
              <label className="text-slate-700 font-bold block mb-1.5">Ngày Giao Hàng Dự Kiến:</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1.5">Kho Tiếp Nhận:</label>
              <input
                type="text"
                disabled
                value="Kho Tổng Tân Bình (Khu A & B)"
                className="w-full p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-600 font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-bold">Danh Sách Mặt Hàng Đặt Nhập ({items.length}):</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm dòng hàng</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                  <div className="flex-1">
                    <select
                      value={it.sku}
                      onChange={(e) => {
                        const newSku = e.target.value;
                        const matched = availableProducts.find((p) => p.sku === newSku);
                        setItems((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? {
                                  ...item,
                                  productId: matched ? Number(matched.id) : undefined,
                                  sku: newSku,
                                  productName: matched ? matched.name : item.productName,
                                  unit: matched ? matched.unit : item.unit,
                                }
                              : item
                          )
                        );
                      }}
                      className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                    >
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.sku}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
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
                      className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs text-center focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <span className="text-xs font-bold text-slate-600 w-12 text-center">{it.unit}</span>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1.5">Ghi Chú Đơn Hàng:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

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
              Phát Hành Đơn PO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
