import React, { useState } from 'react';
import { X, Building2, MapPin, Phone, Boxes, CheckCircle2 } from 'lucide-react';
import { WarehouseItem } from '../../types';

interface CreateWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWarehouse: (warehouse: Partial<WarehouseItem>) => Promise<void>;
  existingCount: number;
}

export const CreateWarehouseModal: React.FC<CreateWarehouseModalProps> = ({
  isOpen,
  onClose,
  onAddWarehouse,
  existingCount,
}) => {
  const [code, setCode] = useState(`WH0${existingCount + 1}`);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [type, setType] = useState<'CENTRAL' | 'DISTRIBUTION' | 'HUB' | 'COLD_STORAGE'>('DISTRIBUTION');
  const [capacityPallets, setCapacityPallets] = useState(3000);
  const [totalZones, setTotalZones] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddWarehouse({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        address: address.trim(),
        contactPhone: contactPhone.trim(),
        type,
        capacityPallets: Number(capacityPallets) || 2500,
        totalZones: Number(totalZones) || 3,
        isActive: true,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">Khai Báo Chi Nhánh Kho Mới</h2>
              <p className="text-xs text-slate-500 mt-0.5">Mở rộng mạng lưới chi nhánh kho hàng trong chuỗi cung ứng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Chi Nhánh Kho *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: WH05"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 uppercase focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loại Hình Kho Hàng</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                <option value="DISTRIBUTION">Kho Phân Phối Vùng</option>
                <option value="CENTRAL">Kho Tổng Trung Tâm</option>
                <option value="HUB">Kho Trung Chuyển (Hub)</option>
                <option value="COLD_STORAGE">Kho Lạnh Bảo Quản</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Chi Nhánh Kho *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Kho Phân Phối Cần Thơ - Miền Tây"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Địa Chỉ Chi Tiết</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: KCN Trà Nóc, Q.Bình Thủy, TP. Cần Thơ"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hotline / SĐT</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="0292 388 7766"
                  className="w-full pl-8 pr-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sức Chứa (Pallet)</label>
              <input
                type="number"
                min="100"
                step="100"
                value={capacityPallets}
                onChange={(e) => setCapacityPallets(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số Phân Khu (Zone)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={totalZones}
                onChange={(e) => setTotalZones(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Sau khi thêm kho mới, chi nhánh sẽ lập tức xuất hiện trong bộ chọn kho trên thanh công cụ và toàn bộ giao diện quản trị WMS.
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-all cursor-pointer disabled:opacity-60"
            >
              <Building2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang Khai Báo...' : 'Xác Nhận Thêm Kho'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

