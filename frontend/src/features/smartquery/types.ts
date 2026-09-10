export interface TableColumn {
  name: string;
  type: string;
  description: string;
}

export interface TableSchema {
  tableName: string;
  displayName: string;
  description: string;
  columns: TableColumn[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  timestamp: string;
  text: string;
  sqlQuery?: string;
  astStatus?: 'VERIFIED' | 'REJECTED' | 'LIMIT_INJECTED';
  astRejectionReason?: string;
  executionTimeMs?: number;
  tableData?: Array<Record<string, any>>;
  actionPayload?: {
    label: string;
    targetUrl: string;
    type?: 'primary' | 'warning' | 'info';
  };
}

export interface SecurityRule {
  id: string;
  name: string;
  status: 'ACTIVE' | 'ENFORCING';
  description: string;
  icon: string;
}
