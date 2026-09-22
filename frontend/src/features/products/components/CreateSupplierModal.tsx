import React, { useState } from 'react';
import { Plus, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { SupplierItem } from '../types';
import { Modal, Button, InputField } from '../../../components/common';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm Nhà Cung Cấp Đối Tác Mới"
      description="Liên kết dữ liệu đối tác cho đơn nhập kho PO & EDI"
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

        <InputField
          label="Các Ngành Hàng Cung Ứng (ngăn cách bằng dấu phẩy)"
          placeholder="Thực phẩm, Đồ uống, Bao bì"
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
          helperText="Nhập các ngành hàng phân tách bởi dấu phẩy"
        />

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
