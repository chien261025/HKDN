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

export interface UpdateUserPayload {
  fullName: string;
  email: string;
  role?: string;
  assignedWarehouse?: string;
  phone?: string;
}

export interface LoginHistoryEntry {
  timestamp: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  status: string;
}

export interface UserSecurityLog {
  userId: number;
  username: string;
  fullName: string;
  role: string;
  status: string;
  isActive: boolean;
  lastLoginAt: string;
  lastLoginIp: string;
  failedLoginAttempts: number;
  riskLevel: string;
  activeSessionsCount: number;
  recentLogins: LoginHistoryEntry[];
}

export interface UserDeviceSession {
  id: string;
  userId: number;
  username: string;
  deviceName: string;
  deviceType: 'DESKTOP' | 'MOBILE_PDA' | 'TABLET';
  ipAddress: string;
  locationName: string;
  isActive: boolean;
  isCurrentSession: boolean;
  createdAt: string;
  lastActiveAt: string;
  revokedReason?: string;
}


