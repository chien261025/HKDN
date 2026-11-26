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

export interface AiDiagnoseRequest {
  question?: string;
  warehouseCode?: string;
  orderCode?: string;
  sku?: string;
  requestedQty?: number;
}

export interface DiagnosisBreakdown {
  orderCode?: string | null;
  sku?: string | null;
  productName?: string | null;
  unit?: string | null;
  requestedQty?: number | null;
  onHandQty?: number | null;
  reservedQty?: number | null;
  unavailableQty?: number | null;
  availableQty?: number | null;
  shortageQty?: number | null;
  consistent: boolean;
}

export interface DiagnosisEvidence {
  type: string;
  code: string;
  qty?: number | null;
  statusLabel: string;
  detail: string;
  link?: string | null;
}

export interface ToolCallLog {
  toolName: string;
  argsSummary: string;
  status: string;
  durationMs: number;
}

export interface ActionLink {
  label: string;
  targetUrl: string;
  variant?: string;
}

export interface AiDiagnosisResponse {
  answer: string;
  engineMode: string;
  warehouseCode?: string | null;
  warehouseName?: string | null;
  breakdown?: DiagnosisBreakdown | null;
  evidences: DiagnosisEvidence[];
  recommendations: string[];
  toolLogs: ToolCallLog[];
  actions: ActionLink[];
  executionTimeMs: number;
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
  diagnosis?: AiDiagnosisResponse;
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
