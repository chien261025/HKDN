import React, { useState, useEffect } from 'react';
import { Save, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { SupplierItem } from '../types';
import { Modal, Button, InputField } from '../../../components/common';

interface EditSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierItem | null;
  onUpdateSupplier: (supplier: SupplierItem) => void;
}

export const EditSupplierModal: React.FC<EditSupplierModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onUpdateSupplier,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (supplier) {
      setCode(supplier.code || '');
      setName(supplier.name || '');
      setContactPerson(supplier.contactPerson || '');
      setPhone(supplier.phone || '');
      setEmail(supplier.email || '');
      setAddress(supplier.address || '');
    }
  }, [supplier]);

  if (!isOpen || !supplier) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: SupplierItem = {
      ...supplier,
      code: code.trim().toUpperCase() || supplier.code,
      name: name.trim(),
      contactPerson: contactPerson.trim() || supplier.contactPerson,
      phone: phone.trim() || supplier.phone,
      email: email.trim() || supplier.email,
      address: address.trim() || supplier.address,
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
          <InputField
            label="Mã NCC (Code)"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono uppercase"
          />
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

        <InputField
          label="Hòm Thư Điện Tử (Email NCC)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="sales@vinamilk.com.vn"
          iconRight={<Mail className="w-4 h-4 text-slate-400" />}
        />

        <InputField
          label="Địa Chỉ Nhà Máy / Kho Xuất"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="KCN Sóng Thần, Dĩ An, Bình Dương"
          iconRight={<MapPin className="w-4 h-4 text-slate-400" />}
        />

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
