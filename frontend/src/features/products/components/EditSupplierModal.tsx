import React, { useState, useEffect } from 'react';
import { Save, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { SupplierItem } from '../types';
import { Modal, Button, InputField, SelectField } from '../../../components/common';

interface EditSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierItem | null;
  onUpdateSupplier: (supplier: SupplierItem) => Promise<void>;
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
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const receiver = supplier?.partnerRole === 'RECEIVER';

  useEffect(() => {
    if (supplier) {
      setError('');
      setCode(supplier.code || '');
      setName(supplier.name || '');
      setContactPerson(supplier.contactPerson || '');
      setPhone(supplier.phone || '');
      setEmail(supplier.email || '');
      setAddress(supplier.address || '');
      setStatus(supplier.status || 'ACTIVE');
    }
  }, [supplier]);

  if (!isOpen || !supplier) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;

    const updated: SupplierItem = {
      ...supplier,
      code: code.trim().toUpperCase() || supplier.code,
      name: name.trim(),
      contactPerson: contactPerson.trim() || supplier.contactPerson,
      phone: phone.trim() || supplier.phone,
      email: email.trim() || supplier.email,
      address: address.trim() || supplier.address,
      status,
    };

    setSaving(true);
    setError('');
    try { await onUpdateSupplier(updated); onClose(); }
    catch (err: any) { setError(err.response?.data?.message || 'Không thể cập nhật đối tác.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={receiver ? 'Cập Nhật Bên Nhận Hàng' : 'Cập Nhật Nhà Cung Cấp Đối Tác'}
      description={
        <span>
          {receiver ? 'Mã bên nhận: ' : 'Mã NCC: '}<strong className="font-mono text-indigo-600 font-bold">{code}</strong>
        </span>
      }
      icon={<Building2 className="w-5 h-5" />}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">Loại đối tác: <strong>{receiver ? 'Bên nhận hàng' : 'Nhà cung cấp'}</strong></p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label={receiver ? 'Mã bên nhận (Code)' : 'Mã NCC (Code)'}
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
          label={receiver ? 'Email bên nhận hàng' : 'Hòm Thư Điện Tử (Email NCC)'}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="sales@vinamilk.com.vn"
          iconRight={<Mail className="w-4 h-4 text-slate-400" />}
        />

        <SelectField label="Trạng thái hợp tác" value={status} onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')} options={[{ value: 'ACTIVE', label: 'Đang hợp tác' }, { value: 'INACTIVE', label: 'Ngưng hợp tác' }]} />

        <InputField
          label={receiver ? 'Địa chỉ nhận hàng' : 'Địa Chỉ Nhà Máy / Kho Xuất'}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="KCN Sóng Thần, Dĩ An, Bình Dương"
          iconRight={<MapPin className="w-4 h-4 text-slate-400" />}
        />

        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button variant="primary" type="submit" disabled={saving} leftIcon={<Save className="w-4 h-4" />}>
            {saving ? 'Đang lưu…' : 'Lưu Thay Đổi'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
