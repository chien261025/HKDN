import { apiClient } from '../../../services/api';
import { AiDiagnoseRequest, AiDiagnosisResponse } from '../types';

export interface SmartQueryResponse {
  answer: string;
  sqlQuery: string;
  astStatus: 'VERIFIED' | 'REJECTED' | 'LIMIT_INJECTED';
  executionTimeMs: number;
  tableData: Array<Record<string, unknown>>;
  diagnosis?: AiDiagnosisResponse;
}

export const smartQueryApi = {
  chat: async (question: string, warehouseCode?: string): Promise<SmartQueryResponse> => {
    const response = await apiClient.post<{ data: SmartQueryResponse }>(
      '/smartquery/chat',
      {
        question,
        warehouseCode: warehouseCode && warehouseCode !== 'ALL' ? warehouseCode : undefined,
      },
      { timeout: 65000 }
    );
    return response.data.data;
  },
  diagnose: async (payload: AiDiagnoseRequest): Promise<AiDiagnosisResponse> => {
    const response = await apiClient.post<{ data: AiDiagnosisResponse }>(
      '/smartquery/diagnose',
      {
        ...payload,
        warehouseCode:
          payload.warehouseCode && payload.warehouseCode !== 'ALL' ? payload.warehouseCode : undefined,
      },
      { timeout: 65000 }
    );
    return response.data.data;
  },
};
