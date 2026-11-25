import React, { useState, useEffect } from 'react';
import { Save, Building2, Phone, Mail, MapPin, Lock, Check, Layers, AlertTriangle, AlertCircle } from 'lucide-react';
import { CategoryItem, SupplierItem } from '../types';
import { Modal, Button, InputField, SelectField } from '../../../components/common';

interface EditSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierItem | null;
  onUpdateSupplier: (supplier: SupplierItem & { categoryIds?: number[] }) => Promise<void> | void;
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
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (supplier) {
      setCode(supplier.code || '');
      setName(supplier.name || '');
      setContactPerson(supplier.contactPerson || '');
      setPhone(supplier.phone || '');
      setEmail(supplier.email || '');
      setAddress(supplier.address || '');
      setStatus(supplier.status || 'ACTIVE');
      setFormError('');
      setIsSubmitting(false);

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
  }, [supplier, availableCategories, isOpen]);

  if (!isOpen || !supplier) return null;

  const initialCatIds = new Set((supplier.categories || []).map((c) => Number(c.id)));
  const visibleCategories = availableCategories.filter(
    (c) => c.status !== 'DELETED' || initialCatIds.has(Number(c.id))
  );

  const toggleCategory = (catId: number, isDisabled: boolean) => {
    if (isDisabled) return;
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setFormError('Tên Doanh Nghiệp / Đối Tác không được để trống (tối thiểu 2 ký tự)!');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Hòm thư điện tử (Email) không đúng định dạng!');
      return;
    }

    const chosenCategories = availableCategories.filter((c) => selectedCategoryIds.includes(Number(c.id)));
    const updatedCategoryNames =
      chosenCategories.length > 0 ? chosenCategories.map((c) => c.name) : ['Chưa phân loại'];

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

    setIsSubmitting(true);
    setFormError('');
    try {
      await onUpdateSupplier(updated);
      onClose();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Không thể cập nhật thông tin nhà cung cấp.');
    } finally {
      setIsSubmitting(false);
    }
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
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {status === 'INACTIVE' && supplier.activeProductsCount > 0 && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Đối tác đang gắn <strong>{supplier.activeProductsCount} sản phẩm</strong>. Khi tạm ngưng, hệ thống sẽ
              khóa tạo sản phẩm mới và đơn nhập hàng từ đối tác này, vẫn giữ nguyên tồn kho cũ.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supplier Code - Immutable field */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Mã Nhà Cung Cấp <span className="text-rose-500">*</span>
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
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Mã cố định, không thể thay đổi sau khi tạo.
            </p>
          </div>

          <InputField
            label="Tên Doanh Nghiệp"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Người Phụ Trách"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="VD: Nguyễn Văn A"
          />
          <InputField
            label="Số Điện Thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0901234567"
            iconRight={<Phone className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Email"
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
          label="Địa Chỉ"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="KCN Sóng Thần, Dĩ An, Bình Dương"
          iconRight={<MapPin className="w-4 h-4 text-slate-400" />}
        />

        {/* Multi-Category Linkage */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Ngành Hàng Cung Cấp</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Đã chọn: <strong className="text-indigo-600 font-bold">{selectedCategoryIds.length}</strong> ngành hàng
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-2.5 border border-slate-200 rounded-xl bg-slate-50/60">
            {visibleCategories.length === 0 ? (
              <div className="col-span-3 text-xs text-slate-400 p-2 italic text-center">
                Đang tải danh mục...
              </div>
            ) : (
              visibleCategories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(Number(cat.id));
                const wasLinked = initialCatIds.has(Number(cat.id));
                const isDisabled = cat.status !== 'ACTIVE' && !wasLinked;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggleCategory(Number(cat.id), isDisabled)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                      isDisabled
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                        : isSelected
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-800 font-semibold shadow-2xs cursor-pointer'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 cursor-pointer'
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
                      {cat.status !== 'ACTIVE' ? ' (Tạm ngưng)' : ''}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<Save className="w-4 h-4" />}>
            Lưu Thay Đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
};
