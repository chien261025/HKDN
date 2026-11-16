import { apiClient } from '../../../services/api';

export interface SmartQueryResponse {
  answer: string;
  sqlQuery: string;
  astStatus: 'VERIFIED' | 'REJECTED' | 'LIMIT_INJECTED';
  executionTimeMs: number;
  tableData: Array<Record<string, unknown>>;
}

export const smartQueryApi = {
  chat: async (question: string): Promise<SmartQueryResponse> => {
    const response = await apiClient.post<{ data: SmartQueryResponse }>('/smartquery/chat', { question });
    return response.data.data;
  },
};
