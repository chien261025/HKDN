export type UserRole = 'ROLE_ADMIN' | 'ROLE_WAREHOUSE_MANAGER' | 'ROLE_MANAGER' | 'ROLE_OPERATOR';

export type UserStatus = 'ACTIVE' | 'LOCKED' | 'SUSPENDED';

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  assignedWarehouse: string;
  status: UserStatus;
  lastLoginAt: string;
  lastLoginIp: string;
  createdAt: string;
}

export interface BackendUserResponse {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  roleDescription: string;
  isActive: boolean;
  status: 'ACTIVE' | 'LOCKED';
  assignedWarehouse: string;
  createdAt: string;
  updatedAt: string;
}

export interface RbacModulePermission {
  moduleId: string;
  moduleName: string;
  desktopRoute: string;
  adminAllowed: boolean;
  managerAllowed: boolean;
  operatorAllowed: boolean;
  description: string;
}
