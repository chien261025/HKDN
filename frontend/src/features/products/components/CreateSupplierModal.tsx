import React, { useEffect, useState } from 'react';
import { Plus, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { PartnerRole, SupplierItem } from '../types';
import { Modal, Button, InputField } from '../../../components/common';

interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSupplier: (supplier: SupplierItem) => Promise<void>;
  defaultRole?: PartnerRole;
}

export const CreateSupplierModal: React.FC<CreateSupplierModalProps> = ({
  isOpen,
  onClose,
  onAddSupplier,
  defaultRole = 'SUPPLIER',
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [categories, setCategories] = useState('Thực Phẩm, Đồ Uống');
  const [partnerRole, setPartnerRole] = useState<PartnerRole>(defaultRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const receiver = partnerRole === 'RECEIVER';

  useEffect(() => {
    if (isOpen) { setPartnerRole(defaultRole); setError(''); }
  }, [isOpen, defaultRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;

    const newSupplier: SupplierItem = {
      id: 'sup_' + Date.now(),
      partnerRole,
      code: code.trim().toUpperCase() || `${receiver ? 'REC' : 'SUP'}-${Date.now()}`,
      name: name.trim(),
      contactPerson: contactPerson.trim() || (receiver ? '' : 'Người Đại Diện'),
      phone: phone.trim() || (receiver ? '' : '0900000000'),
      email: email.trim() || (receiver ? '' : 'contact@supplier.com'),
      address: address.trim() || (receiver ? '' : 'Khu Công Nghiệp Tân Bình, TP.HCM'),
      suppliedCategories: receiver ? [] : categories.split(',').map((c) => c.trim()).filter(Boolean),
      activeProductsCount: 0,
      status: 'ACTIVE',
    };

    setSaving(true);
    setError('');
    try {
      await onAddSupplier(newSupplier);
      onClose();
      setCode(''); setName(''); setContactPerson(''); setPhone(''); setEmail(''); setAddress('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể lưu đối tác. Vui lòng thử lại.');
    } finally { setSaving(false); }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={receiver ? 'Thêm Bên Nhận Hàng Mới' : 'Thêm Nhà Cung Cấp Đối Tác Mới'}
      icon={<Building2 className="w-5 h-5" />}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">Loại đối tác
          <select aria-label="Loại đối tác" value={partnerRole} onChange={e => setPartnerRole(e.target.value as PartnerRole)} disabled={saving} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm">
            <option value="SUPPLIER">Nhà cung cấp (nhập hàng)</option>
            <option value="RECEIVER">Bên nhận hàng (xuất hàng)</option>
          </select>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label={receiver ? 'Mã bên nhận (Code)' : 'Mã NCC (Code)'}
            placeholder={receiver ? 'VD: REC-WINMART' : 'VD: SUP-VINAMILK'}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono uppercase"
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
          label={receiver ? 'Email liên hệ nhận hàng' : 'Email Trao Đổi Đơn Hàng PO'}
          type="email"
          placeholder="VD: supplychain@vinamilk.com.vn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          iconRight={<Mail className="w-4 h-4 text-slate-400" />}
        />

        <InputField
          label={receiver ? 'Địa chỉ nhận hàng' : 'Địa Chỉ Trụ Sở / Tổng Kho'}
          placeholder="VD: Số 10 Tân Trào, P. Tân Phú, Quận 7, TP.HCM"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          iconRight={<MapPin className="w-4 h-4 text-slate-400" />}
        />

        {!receiver && <InputField
          label="Các Ngành Hàng Cung Ứng (ngăn cách bằng dấu phẩy)"
          placeholder="Thực phẩm, Đồ uống, Bao bì"
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
          helperText="Nhập các ngành hàng phân tách bởi dấu phẩy"
        />}

        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Hủy Bỏ
          </Button>
          <Button variant="primary" type="submit" disabled={saving} leftIcon={<Plus className="w-4 h-4" />}>
            {saving ? 'Đang lưu…' : receiver ? 'Thêm Bên Nhận Hàng' : 'Thêm Nhà Cung Cấp'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
