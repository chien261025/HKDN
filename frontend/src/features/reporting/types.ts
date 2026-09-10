export type JobStatus = 'QUEUED' | 'STREAMING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';

export interface ReportJob {
  id: string;
  reportCode: string;
  reportTitle: string;
  status: JobStatus;
  progress: number;
  totalRows: number;
  fileSize?: string;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  workerNode: string;
  ramUsageMb: number;
}

export interface ReportTemplate {
  code: string;
  title: string;
  category: string;
  description: string;
  estimatedRows: string;
  estimatedSize: string;
  icon: string;
  colorScheme: 'amber' | 'indigo' | 'emerald' | 'cyan';
}

export interface QueueTelemetry {
  queueName: string;
  exchange: string;
  consumerCount: number;
  messageRate: string;
  memoryLimitMb: number;
  currentHeapMb: number;
  minioBucket: string;
}
