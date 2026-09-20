import React, { useState } from 'react';
import { X, Plus, Building2, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';
import { SupplierItem } from '../types';

interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSupplier: (supplier: SupplierItem) => void;
}

export const CreateSupplierModal: React.FC<CreateSupplierModalProps> = ({
  isOpen,
  onClose,
  onAddSupplier,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [categories, setCategories] = useState('Thực Phẩm, Đồ Uống');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSupplier: SupplierItem = {
      id: 'sup_' + Date.now(),
      code: code.trim().toUpperCase() || 'SUP-' + Math.floor(100 + Math.random() * 900),
      name: name.trim(),
      contactPerson: contactPerson.trim() || 'Người Đại Diện',
      phone: phone.trim() || '0900000000',
      email: email.trim() || 'contact@supplier.com',
      address: address.trim() || 'Khu Công Nghiệp Tân Bình, TP.HCM',
      suppliedCategories: categories.split(',').map((c) => c.trim()).filter(Boolean),
      activeProductsCount: 0,
      status: 'ACTIVE',
    };

    onAddSupplier(newSupplier);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Thêm Nhà Cung Cấp Đối Tác Mới</h2>
              <p className="text-xs text-slate-500 mt-0.5">Liên kết dữ liệu đối tác cho đơn nhập kho PO & EDI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Mã NCC (Code)</label>
              <input
                type="text"
                placeholder="VD: SUP-VINAMILK"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tên Doanh Nghiệp / Đối Tác <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Công ty Cổ phần Sữa Việt Nam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Người Đại Diện Phụ Trách</label>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn Nam (Trưởng phòng Cung ứng)"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Số Điện Thoại Liên Hệ</label>
              <input
                type="text"
                placeholder="VD: 0912 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Email Trao Đổi Đơn Hàng PO</label>
            <input
              type="email"
              placeholder="VD: supplychain@vinamilk.com.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Địa Chỉ Trụ Sở / Tổng Kho</label>
            <input
              type="text"
              placeholder="VD: Số 10 Tân Trào, P. Tân Phú, Quận 7, TP.HCM"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Các Ngành Hàng Cung Ứng (ngăn cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              placeholder="Thực phẩm, Đồ uống, Bao bì"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-semibold text-sm"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Nhà Cung Cấp</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
