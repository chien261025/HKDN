import React, { useState, useEffect } from 'react';
import { Save, Building2, Phone, Mail, MapPin, Lock, Check, Layers } from 'lucide-react';
import { CategoryItem, SupplierItem } from '../types';
import { Modal, Button, InputField, SelectField } from '../../../components/common';

interface EditSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierItem | null;
  onUpdateSupplier: (supplier: SupplierItem & { categoryIds?: number[] }) => void;
  availableCategories?: CategoryItem[];
}

export const EditSupplierModal: React.FC<EditSupplierModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onUpdateSupplier,
  availableCategories = [],
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  useEffect(() => {
    if (supplier) {
      setCode(supplier.code || '');
      setName(supplier.name || '');
      setContactPerson(supplier.contactPerson || '');
      setPhone(supplier.phone || '');
      setEmail(supplier.email || '');
      setAddress(supplier.address || '');
      setStatus(supplier.status || 'ACTIVE');

      // Initialize selected category IDs
      if (supplier.categories && supplier.categories.length > 0) {
        setSelectedCategoryIds(supplier.categories.map((c) => Number(c.id)));
      } else if (supplier.suppliedCategories && availableCategories.length > 0) {
        const matchedIds = availableCategories
          .filter((c) => supplier.suppliedCategories.some((sc) => sc.toLowerCase() === c.name.toLowerCase() || sc.toLowerCase() === c.code.toLowerCase()))
          .map((c) => Number(c.id));
        setSelectedCategoryIds(matchedIds);
      } else {
        setSelectedCategoryIds([]);
      }
    }
  }, [supplier, availableCategories]);

  if (!isOpen || !supplier) return null;

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
      : supplier.suppliedCategories;

    const updated: SupplierItem & { categoryIds?: number[] } = {
      ...supplier,
      code: supplier.code, // Immutable business code!
      name: name.trim(),
      contactPerson: contactPerson.trim() || supplier.contactPerson,
      phone: phone.trim() || supplier.phone,
      email: email.trim() || supplier.email,
      address: address.trim() || supplier.address,
      status,
      categoryIds: selectedCategoryIds,
      suppliedCategories: updatedCategoryNames,
      categories: chosenCategories.map((c) => ({ id: Number(c.id), code: c.code, name: c.name })),
    };

    onUpdateSupplier(updated);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cập Nhật Nhà Cung Cấp Đối Tác"
      description={
        <span>
          Mã NCC: <strong className="font-mono text-indigo-600 font-bold">{code}</strong>
        </span>
      }
      icon={<Building2 className="w-5 h-5" />}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supplier Code - Immutable field */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              MÃ NCC (CODE) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                disabled
                readOnly
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono uppercase text-slate-500 font-bold cursor-not-allowed text-sm pl-9"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-1">
              <span>🔒 Mã định danh nghiệp vụ cố định, không thể thay đổi sau khi tạo để bảo toàn lịch sử PO.</span>
            </p>
          </div>

          <InputField
            label="Tên Doanh Nghiệp / Đối Tác"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Người Đại Diện Phụ Trách"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="VD: Nguyễn Văn A"
          />
          <InputField
            label="Số Điện Thoại Hotline / Zalo"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0901234567"
            iconRight={<Phone className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Hòm Thư Điện Tử (Email NCC)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sales@vinamilk.com.vn"
            iconRight={<Mail className="w-4 h-4 text-slate-400" />}
          />

          <SelectField
            label="Trạng thái hợp tác"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
            options={[
              { value: 'ACTIVE', label: 'Đang hợp tác' },
              { value: 'INACTIVE', label: 'Ngưng hợp tác' },
            ]}
          />
        </div>

        <InputField
          label="Địa Chỉ Nhà Máy / Kho Xuất"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="KCN Sóng Thần, Dĩ An, Bình Dương"
          iconRight={<MapPin className="w-4 h-4 text-slate-400" />}
        />

        {/* Structured Multi-Category Linkage */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Ngành Hàng Cung Ứng (Danh Mục Liên Kết Hệ Thống)</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Đã chọn: <strong className="text-indigo-600 font-bold">{selectedCategoryIds.length}</strong> ngành hàng
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-2.5 border border-slate-200 rounded-xl bg-slate-50/60">
            {availableCategories.length === 0 ? (
              <div className="col-span-3 text-xs text-slate-400 p-2 italic text-center">
                Đang tải danh mục từ Master Data...
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
            * Liên kết trực tiếp qua bảng quan hệ wms_supplier_category giúp lọc và phân loại sản phẩm chuẩn xác.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button variant="primary" type="submit" leftIcon={<Save className="w-4 h-4" />}>
            Lưu Thay Đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
};
