import { apiClient } from '../../../services/api';

export interface ReportJobRecord {
  id: string;
  reportName: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export const reportService = {
  async getJobs(month?: string): Promise<ReportJobRecord[]> {
    const response = await apiClient.get('/reports/jobs', { params: month ? { month } : undefined });
    return response.data;
  },
  async downloadJob(id: string): Promise<Blob> {
    const response = await apiClient.get(`/reports/jobs/${id}/download`, { responseType: 'blob' });
    return response.data;
  },
  async deleteJob(id: string): Promise<void> {
    await apiClient.delete(`/reports/jobs/${id}`);
  },
  async downloadTransactionsExcel(month?: string): Promise<Blob> {
    const response = await apiClient.get('/reports/transactions/excel', { params: month ? { month } : undefined, responseType: 'blob' });
    return response.data;
  },
  async downloadInboundExcel(month?: string): Promise<Blob> {
    const response = await apiClient.get('/reports/inbound/excel', { params: month ? { month } : undefined, responseType: 'blob' });
    return response.data;
  },
  async downloadExpiryExcel(month?: string): Promise<Blob> {
    const response = await apiClient.get('/reports/expiry/excel', { params: month ? { month } : undefined, responseType: 'blob' });
    return response.data;
  },
  async downloadSlottingExcel(month?: string): Promise<Blob> {
    const response = await apiClient.get('/reports/slotting/excel', { params: month ? { month } : undefined, responseType: 'blob' });
    return response.data;
  },
  async downloadFulfillmentExcel(month?: string): Promise<Blob> {
    const response = await apiClient.get('/reports/fulfillment/excel', { params: month ? { month } : undefined, responseType: 'blob' });
    return response.data;
  },
};
