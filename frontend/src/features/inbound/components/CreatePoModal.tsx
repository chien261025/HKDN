import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, Building2, Package, Check } from 'lucide-react';
import { InboundOrder, InboundOrderItem, SupplierOption } from '../types';

interface CreatePoModalProps {
  onClose: () => void;
  onCreateOrder: (order: InboundOrder) => void;
}

const SUPPLIERS: SupplierOption[] = [
  { code: 'SUP-VNM', name: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)', phone: '028-5415-5555', address: 'Quận 7, TP.HCM' },
  { code: 'SUP-ULV', name: 'Unilever Việt Nam Quốc Tế', phone: '028-3823-6655', address: 'KCN Tây Bắc Củ Chi' },
  { code: 'SUP-SEC', name: 'Samsung Electronics Vietnam Co., Ltd', phone: '0222-369-6000', address: 'KCN Yên Phong, Bắc Ninh' },
];

export const CreatePoModal: React.FC<CreatePoModalProps> = ({ onClose, onCreateOrder }) => {
  const [supplierCode, setSupplierCode] = useState('SUP-VNM');
  const [expectedDate, setExpectedDate] = useState('2026-09-12');
  const [notes, setNotes] = useState('Giao hàng buổi sáng trước 11h. Xe tải có bửng nâng hạ.');

  const [items, setItems] = useState<Array<{ sku: string; productName: string; expectedQty: number; unit: string }>>([
    { sku: 'SKU-MILK-100', productName: 'Sữa tươi Vinamilk 100% 1L', expectedQty: 100, unit: 'Thùng' },
  ]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { sku: 'SKU-OMO-MATIC', productName: 'Nước giặt OMO Matic 3.6kg', expectedQty: 50, unit: 'Can' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSupplier = SUPPLIERS.find((s) => s.code === supplierCode) || SUPPLIERS[0];
    const poNumber = `PO-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: InboundOrder = {
      id: `po-${Date.now()}`,
      poCode: poNumber,
      supplierName: selectedSupplier.name,
      supplierCode: selectedSupplier.code,
      expectedDeliveryDate: expectedDate,
      createdAt: 'Vừa xong',
      status: 'PENDING',
      notes,
      items: items.map((it, idx) => ({
        id: `item-${idx + 1}`,
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#0b101d] rounded-2xl max-w-xl w-full border border-slate-700 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">Tạo Đơn Đặt Hàng Nhập Kho (PO Mới)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Nhà cung cấp */}
          <div>
            <label className="text-slate-400 font-semibold block mb-1">Chọn Nhà Cung Cấp:</label>
            <select
              value={supplierCode}
              onChange={(e) => setSupplierCode(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500"
            >
              {SUPPLIERS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Ngày dự kiến */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Ngày Giao Hàng Dự Kiến:</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                required
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Kho Tiếp Nhận:</label>
              <input
                type="text"
                disabled
                value="Kho Trung Tâm (Khu A & B)"
                className="w-full p-2 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 font-mono"
              />
            </div>
          </div>

          {/* Danh sách mặt hàng */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 font-semibold">Danh Sách Mặt Hàng Đặt Nhập ({items.length}):</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm dòng hàng</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2">
                  <div className="flex-1">
                    <select
                      value={it.sku}
                      onChange={(e) => {
                        const newSku = e.target.value;
                        let newName = 'Sữa tươi Vinamilk 100% 1L';
                        let newUnit = 'Thùng';
                        if (newSku === 'SKU-OMO-MATIC') {
                          newName = 'Nước giặt OMO Matic 3.6kg';
                          newUnit = 'Can';
                        } else if (newSku === 'SKU-SAMS-S24') {
                          newName = 'Samsung Galaxy S24 Ultra';
                          newUnit = 'Hộp';
                        }
                        setItems((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, sku: newSku, productName: newName, unit: newUnit } : item
                          )
                        );
                      }}
                      className="w-full p-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-[11px]"
                    >
                      <option value="SKU-MILK-100">Sữa tươi Vinamilk 100% 1L</option>
                      <option value="SKU-OMO-MATIC">Nước giặt OMO Matic 3.6kg</option>
                      <option value="SKU-SAMS-S24">Samsung Galaxy S24 Ultra</option>
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
                      className="w-full p-1.5 rounded-lg bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold text-[11px]"
                    />
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 w-12">{it.unit}</span>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="text-slate-400 font-semibold block mb-1">Ghi Chú Đơn Hàng:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-[11px] focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Nút hành động */}
          <div className="flex gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-cyan-900/30"
            >
              Phát Hành Đơn PO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
