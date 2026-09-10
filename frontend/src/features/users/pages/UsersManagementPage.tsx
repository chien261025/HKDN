import React, { useState } from 'react';
import { UsersHeader } from '../components/UsersHeader';
import { UserListTable } from '../components/UserListTable';
import { RbacMatrixTable } from '../components/RbacMatrixTable';
import { CreateUserModal } from '../components/CreateUserModal';
import { UserAccount } from '../types';

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'u-1',
    username: 'admin',
    fullName: 'Trần Trưởng Kho (Chief Admin)',
    email: 'admin@smartwms.vn',
    phone: '0909 112 233',
    role: 'ROLE_ADMIN',
    assignedWarehouse: 'Kho Tổng Tân Bình (ZONE A & B)',
    status: 'ACTIVE',
    lastLoginAt: '10/09/2026 23:30',
    lastLoginIp: '192.168.1.105',
    createdAt: '01/01/2026',
  },
  {
    id: 'u-2',
    username: 'manager_kien',
    fullName: 'Nguyễn Văn Kiên (Điều Phối Kho)',
    email: 'kien.nguyen@smartwms.vn',
    phone: '0918 334 455',
    role: 'ROLE_MANAGER',
    assignedWarehouse: 'Kho Tổng Tân Bình (ZONE A & B)',
    status: 'ACTIVE',
    lastLoginAt: '10/09/2026 22:15',
    lastLoginIp: '192.168.1.112',
    createdAt: '15/01/2026',
  },
  {
    id: 'u-3',
    username: 'operator_nam',
    fullName: 'Lê Hoàng Nam (Thủ Kho Barcode)',
    email: 'nam.le@smartwms.vn',
    phone: '0933 556 677',
    role: 'ROLE_OPERATOR',
    assignedWarehouse: 'Kho Mát Thực Phẩm (ZONE B)',
    status: 'ACTIVE',
    lastLoginAt: '10/09/2026 23:10',
    lastLoginIp: '10.0.4.15 (PDA Honeywell)',
    createdAt: '01/02/2026',
  },
  {
    id: 'u-4',
    username: 'operator_tuan',
    fullName: 'Phạm Anh Tuấn (Vận Hành Xe Nâng)',
    email: 'tuan.pham@smartwms.vn',
    phone: '0977 889 900',
    role: 'ROLE_OPERATOR',
    assignedWarehouse: 'Kho Khô & Điện Tử (ZONE A)',
    status: 'ACTIVE',
    lastLoginAt: '10/09/2026 21:40',
    lastLoginIp: '10.0.4.18 (PDA Zebra)',
    createdAt: '10/02/2026',
  },
  {
    id: 'u-5',
    username: 'audit_linh',
    fullName: 'Vũ Mai Linh (Thanh Tra & Kiểm Kê)',
    email: 'linh.vu@smartwms.vn',
    phone: '0944 667 788',
    role: 'ROLE_MANAGER',
    assignedWarehouse: 'Kho Tổng Tân Bình (ZONE A & B)',
    status: 'ACTIVE',
    lastLoginAt: '10/09/2026 19:20',
    lastLoginIp: '192.168.1.120',
    createdAt: '01/03/2026',
  },
  {
    id: 'u-6',
    username: 'temp_viet',
    fullName: 'Hoàng Quốc Việt (Thực Tập Sinh Kho)',
    email: 'viet.hoang@smartwms.vn',
    phone: '0922 445 566',
    role: 'ROLE_OPERATOR',
    assignedWarehouse: 'Kho Khô & Điện Tử (ZONE A)',
    status: 'LOCKED',
    lastLoginAt: '05/09/2026 14:10',
    lastLoginIp: '10.0.4.22',
    createdAt: '15/08/2026',
  },
];

export const UsersManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'RBAC_MATRIX'>('ACCOUNTS');
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleResetPassword = (user: UserAccount) => {
    alert(`Đã gửi email khôi phục mật khẩu tạm thời đến: ${user.email} (Username: ${user.username})`);
  };

  const handleAddUser = (newUser: UserAccount) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner & Security KPI */}
      <UsersHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        users={users}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Body Tab */}
      {activeTab === 'ACCOUNTS' ? (
        <UserListTable
          users={users}
          onToggleStatus={handleToggleStatus}
          onResetPassword={handleResetPassword}
        />
      ) : (
        <RbacMatrixTable />
      )}

      {/* Create Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddUser={handleAddUser}
      />
    </div>
  );
};
