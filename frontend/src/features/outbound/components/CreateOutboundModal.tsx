import React, { useState } from 'react';
import { X, Plus, Trash2, Building2, PackageCheck, AlertTriangle } from 'lucide-react';
import { OutboundOrder, CustomerOption } from '../types';

interface CreateOutboundModalProps {
  onClose: () => void;
  onCreateOrder: (order: OutboundOrder) => void;
}

const CUSTOMERS: CustomerOption[] = [
  { code: 'CUST-WMT', name: 'Chuỗi Siêu Thị WinMart+', address: 'Hà Nội & TP.HCM', phone: '1800-6868' },
  { code: 'CUST-BHX', name: 'Hệ Thống Bách Hóa Xanh', address: 'Toàn quốc', phone: '1900-1908' },
  { code: 'CUST-BIGC', name: 'Đại Siêu Thị Go! (BigC)', address: 'Thăng Long, Hà Nội', phone: '024-3784-8888' },
];

export const CreateOutboundModal: React.FC<CreateOutboundModalProps> = ({
  onClose,
  onCreateOrder,
}) => {
  const [customerCode, setCustomerCode] = useState('CUST-WMT');
  const [requiredDate, setRequiredDate] = useState('2026-09-11');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('HIGH');
  const [notes, setNotes] = useState('Xuất ưu tiên hàng date ngắn theo FEFO, đóng pallet cẩn thận.');

  const [items, setItems] = useState<Array<{ sku: string; productName: string; requestedQty: number; unit: string }>>([
    { sku: 'SKU-MILK-100', productName: 'Sữa tươi Vinamilk 100% 1L', requestedQty: 20, unit: 'Thùng' },
  ]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { sku: 'SKU-OMO-MATIC', productName: 'Nước giặt OMO Matic 3.6kg', requestedQty: 15, unit: 'Can' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = CUSTOMERS.find((c) => c.code === customerCode) || CUSTOMERS[0];
    const soNumber = `SO-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: OutboundOrder = {
      id: `so-${Date.now()}`,
      soCode: soNumber,
      customerName: customer.name,
      shippingAddress: customer.address,
      orderDate: 'Hôm nay',
      requiredDate,
      priority,
      status: 'PENDING',
      notes,
      items: items.map((it, idx) => ({
        id: `item-${idx + 1}`,
        sku: it.sku,
        productName: it.productName,
        requestedQty: it.requestedQty,
        allocatedQty: 0,
        pickedQty: 0,
        unit: it.unit,
        allocations: [],
      })),
    };

    onCreateOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <PackageCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-900">Tạo Đơn Xuất Kho Mới (Sales Order / SO)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {/* Khách hàng */}
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

          {/* Ngày giao & Mức ưu tiên */}
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
                <option value="NORMAL">Bình Thường (NORMAL)</option>
                <option value="HIGH">Ưu Tiên Cao (HIGH)</option>
                <option value="URGENT">Hỏa Tốc (URGENT)</option>
              </select>
            </div>
          </div>

          {/* Mặt hàng cần xuất */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-bold">Mặt Hàng Cần Xuất ({items.length}):</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm mặt hàng</span>
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
                      className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                    >
                      <option value="SKU-MILK-100">Sữa tươi Vinamilk 100% 1L</option>
                      <option value="SKU-OMO-MATIC">Nước giặt OMO Matic 3.6kg</option>
                      <option value="SKU-SAMS-S24">Samsung Galaxy S24 Ultra</option>
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      value={it.requestedQty}
                      min="1"
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setItems((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, requestedQty: val } : item))
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

          {/* Ghi chú */}
          <div>
            <label className="text-slate-700 font-bold block mb-1.5">Ghi Chú Đơn Xuất:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Footer buttons */}
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
              Phát Hành Đơn SO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

