export type JobStatus = 'INITIALIZING' | 'EXTRACTING' | 'FORMATTING' | 'COMPLETED' | 'FAILED';

export interface ReportJob {
  id: string;
  reportCode: string;
  reportTitle: string;
  category: string;
  format: 'EXCEL' | 'PDF' | 'CSV';
  status: JobStatus;
  statusLabel?: string;
  progress: number;
  totalRows: number;
  fileSize?: string;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  requestedBy: string;
}

export interface ReportTemplate {
  code: string;
  title: string;
  category: string;
  description: string;
  estimatedRows: string;
  estimatedSize: string;
  format: 'EXCEL' | 'PDF';
  badgeColor: 'emerald' | 'blue' | 'indigo' | 'amber';
}

export interface ScheduledReport {
  id: string;
  title: string;
  scheduleDescription: string;
  targetRole: string;
  format: string;
  isEnabled: boolean;
  lastRunAt: string;
}

export interface ReportOverviewStats {
  monthlyReportsCount: number;
  reconciliationAccuracy: string;
  storageUsed: string;
  storageLimit: string;
  avgGenerationTime: string;
}
