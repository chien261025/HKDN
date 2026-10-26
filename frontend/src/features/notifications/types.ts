export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export type NotificationType =
  | 'AUDIT_DISCREPANCY'
  | 'AUDIT_COMPLETED'
  | 'AUDIT_RECONCILED'
  | 'INBOUND_ORDER_CREATED'
  | 'OUTBOUND_ORDER_CREATED'
  | 'STOCK_LOW'
  | 'STOCK_TRANSFER'
  | 'SYSTEM_ALERT';

export interface NotificationMessage {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  referenceCode?: string;
  link?: string;
  timestamp: string;
  read: boolean;
}

export interface ToastItem extends NotificationMessage {
  toastId: string;
  duration?: number;
}
