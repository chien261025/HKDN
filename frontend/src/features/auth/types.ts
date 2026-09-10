export type UserRole = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_OPERATOR';

export interface AuthSession {
  token: string;
  username: string;
  fullName: string;
  role: UserRole;
  warehouse: string;
  expiresAt: string;
}

export interface DemoAccount {
  role: UserRole;
  roleTitle: string;
  badge: string;
  color: string;
  username: string;
  fullName: string;
  targetRoute: string;
  deviceType: string;
  description: string;
}
