import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Building2, Phone, Mail, MapPin, Layers, Check, AlertCircle } from 'lucide-react';
import { CategoryItem, SupplierItem } from '../types';
import { Modal, Button, InputField } from '../../../components/common';

interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSupplier: (supplier: SupplierItem & { categoryIds?: number[] }) => Promise<void> | void;
  availableCategories?: CategoryItem[];
  existingCodes?: string[];
}

export const CreateSupplierModal: React.FC<CreateSupplierModalProps> = ({
  isOpen,
  onClose,
  onAddSupplier,
  availableCategories = [],
  existingCodes = [],
}) => {
  const activeCategories = useMemo(
    () => availableCategories.filter((c) => c.status !== 'DELETED'),
    [availableCategories]
  );

  const defaultCatIds = useMemo(() => {
    const activeOnly = activeCategories.filter((c) => c.status === 'ACTIVE');
    return activeOnly.length > 0 ? [Number(activeOnly[0].id)] : [];
  }, [activeCategories]);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(defaultCatIds);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setSelectedCategoryIds(defaultCatIds);
      setFormError('');
      setIsSubmitting(false);
    }
  }, [isOpen, defaultCatIds]);

  if (!isOpen) return null;

  const cleanCode = code.trim().toUpperCase();
  const isDuplicateCode =
    !!cleanCode && existingCodes.some((c) => c.trim().toUpperCase() === cleanCode);

  const toggleCategory = (catId: number, isDisabled: boolean) => {
    if (isDisabled) return;
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setFormError('Vui lòng nhập Tên Doanh Nghiệp / Đối Tác (tối thiểu 2 ký tự)!');
      return;
    }
    if (cleanCode && cleanCode.startsWith('CUST-')) {
      setFormError('Mã bắt đầu bằng "CUST-" dành riêng cho Khách hàng B2B! Nhà cung cấp phải dùng tiền tố khác (VD: SUP-*).');
      return;
    }
    if (isDuplicateCode) {
      setFormError(`Mã nhà cung cấp "${cleanCode}" đã tồn tại trong hệ thống! Vui lòng nhập mã khác.`);
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Địa chỉ Email PO không đúng định dạng hợp lệ!');
      return;
    }

    const chosenCategories = activeCategories.filter((c) => selectedCategoryIds.includes(Number(c.id)));
    const updatedCategoryNames =
      chosenCategories.length > 0 ? chosenCategories.map((c) => c.name) : ['Chưa phân loại'];

    const newSupplier: SupplierItem & { categoryIds?: number[] } = {
      id: 'sup_' + Date.now(),
      code: cleanCode || 'SUP-' + Math.floor(100 + Math.random() * 900),
      name: cleanName,
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

    setIsSubmitting(true);
    setFormError('');
    try {
      await onAddSupplier(newSupplier);
      onClose();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Không thể đăng ký nhà cung cấp mới.');
    } finally {
      setIsSubmitting(false);
    }
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
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Mã Nhà Cung Cấp"
            placeholder="VD: SUP-VINAMILK"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setFormError('');
            }}
            error={
              isDuplicateCode
                ? `Mã "${cleanCode}" đã tồn tại!`
                : cleanCode.startsWith('CUST-')
                ? 'Không dùng tiền tố CUST- cho Nhà cung cấp!'
                : undefined
            }
            className="font-mono uppercase"
            helperText="* Không thể thay đổi sau khi tạo (để trống sẽ tự sinh)."
          />
          <InputField
            label="Tên Doanh Nghiệp"
            required
            placeholder="VD: Công ty Cổ phần Sữa Việt Nam"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFormError('');
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Người Phụ Trách"
            placeholder="VD: Nguyễn Văn Nam"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />
          <InputField
            label="Số Điện Thoại"
            placeholder="VD: 0912 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            iconRight={<Phone className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <InputField
          label="Email Liên Hệ"
          type="email"
          placeholder="VD: supplychain@vinamilk.com.vn"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFormError('');
          }}
          iconRight={<Mail className="w-4 h-4 text-slate-400" />}
        />

        <InputField
          label="Địa Chỉ"
          placeholder="VD: Số 10 Tân Trào, P. Tân Phú, Quận 7, TP.HCM"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
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
            {activeCategories.length === 0 ? (
              <div className="col-span-3 text-xs text-slate-400 p-2 italic text-center">
                Đang tải danh mục...
              </div>
            ) : (
              activeCategories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(Number(cat.id));
                const isCatInactive = cat.status !== 'ACTIVE';
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={isCatInactive}
                    onClick={() => toggleCategory(Number(cat.id), isCatInactive)}
                    title={
                      isCatInactive
                        ? `${cat.name} đang tạm ngưng — không thể gán cho NCC mới`
                        : cat.name
                    }
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                      isCatInactive
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
                    <span className="truncate">
                      {cat.name}
                      {isCatInactive ? ' (Tạm ngưng)' : ''}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            * Chỉ chọn được danh mục đang hoạt động.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<Plus className="w-4 h-4" />}>
            Thêm Nhà Cung Cấp
          </Button>
        </div>
      </form>
    </Modal>
  );
};
