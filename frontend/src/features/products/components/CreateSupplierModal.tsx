import React, { useState } from 'react';
import { Plus, Building2, Phone, Mail, MapPin, Layers, Check } from 'lucide-react';
import { CategoryItem, SupplierItem } from '../types';
import { Modal, Button, InputField } from '../../../components/common';

interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSupplier: (supplier: SupplierItem & { categoryIds?: number[] }) => void;
  availableCategories?: CategoryItem[];
}

export const CreateSupplierModal: React.FC<CreateSupplierModalProps> = ({
  isOpen,
  onClose,
  onAddSupplier,
  availableCategories = [],
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([1]); // Default to CAT-FOOD

  if (!isOpen) return null;

  const toggleCategory = (catId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const chosenCategories = availableCategories.filter((c) => selectedCategoryIds.includes(Number(c.id)));
    const updatedCategoryNames = chosenCategories.length > 0
      ? chosenCategories.map((c) => c.name)
      : ['Chưa phân loại'];

    const newSupplier: SupplierItem & { categoryIds?: number[] } = {
      id: 'sup_' + Date.now(),
      code: code.trim().toUpperCase() || 'SUP-' + Math.floor(100 + Math.random() * 900),
      name: name.trim(),
      contactPerson: contactPerson.trim() || 'Người Đại Diện',
      phone: phone.trim() || '0900000000',
      email: email.trim() || 'contact@supplier.com',
      address: address.trim() || 'Khu Công Nghiệp Tân Bình, TP.HCM',
      suppliedCategories: updatedCategoryNames,
      categoryIds: selectedCategoryIds,
      categories: chosenCategories.map((c) => ({ id: Number(c.id), code: c.code, name: c.name })),
      activeProductsCount: 0,
      status: 'ACTIVE',
    };

    onAddSupplier(newSupplier);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm Nhà Cung Cấp Đối Tác Mới"
      icon={<Building2 className="w-5 h-5" />}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Mã NCC (Code)"
            placeholder="VD: SUP-VINAMILK"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono uppercase"
            helperText="* Mã định danh nghiệp vụ (không thể thay đổi sau khi tạo)"
          />
          <InputField
            label="Tên Doanh Nghiệp / Đối Tác"
            required
            placeholder="VD: Công ty Cổ phần Sữa Việt Nam"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Người Đại Diện Phụ Trách"
            placeholder="VD: Nguyễn Văn Nam"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />
          <InputField
            label="Số Điện Thoại Liên Hệ"
            placeholder="VD: 0912 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            iconRight={<Phone className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <InputField
          label="Email Trao Đổi Đơn Hàng PO"
          type="email"
          placeholder="VD: supplychain@vinamilk.com.vn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          iconRight={<Mail className="w-4 h-4 text-slate-400" />}
        />

        <InputField
          label="Địa Chỉ Trụ Sở / Tổng Kho"
          placeholder="VD: Số 10 Tân Trào, P. Tân Phú, Quận 7, TP.HCM"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          iconRight={<MapPin className="w-4 h-4 text-slate-400" />}
        />

        {/* Structured Multi-Category Linkage */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Các Ngành Hàng Cung Ứng (Chọn từ Danh Mục Master Data)</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Đã chọn: <strong className="text-indigo-600 font-bold">{selectedCategoryIds.length}</strong> ngành hàng
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-2.5 border border-slate-200 rounded-xl bg-slate-50/60">
            {availableCategories.length === 0 ? (
              <div className="col-span-3 text-xs text-slate-400 p-2 italic text-center">
                Đang nạp danh mục Master Data...
              </div>
            ) : (
              availableCategories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(Number(cat.id));
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(Number(cat.id))}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-800 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate" title={cat.name}>
                      {cat.name}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            * Chọn các ngành hàng chính mà đối tác này được phép cung cấp vào kho WMS.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Hủy Bỏ
          </Button>
          <Button variant="primary" type="submit" leftIcon={<Plus className="w-4 h-4" />}>
            Thêm Nhà Cung Cấp
          </Button>
        </div>
      </form>
    </Modal>
  );
};
