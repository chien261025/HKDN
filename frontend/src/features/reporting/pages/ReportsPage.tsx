import React, { useState } from 'react';
import { ReportsHeader } from '../components/ReportsHeader';
import { ReportTemplateSelector } from '../components/ReportTemplateSelector';
import { ReportJobsFeed } from '../components/ReportJobsFeed';
import { RabbitMqTelemetryPanel } from '../components/RabbitMqTelemetryPanel';
import { ReportJob, ReportTemplate, QueueTelemetry } from '../types';

export const ReportsPage: React.FC = () => {
  const [jobs, setJobs] = useState<ReportJob[]>([
    {
      id: 'job-9821a-4c',
      reportCode: 'RPT-LEDGER',
      reportTitle: 'Báo Cáo Sổ Cái Biến Động Kho (Stock Ledger)',
      status: 'COMPLETED',
      progress: 100,
      totalRows: 50000,
      createdAt: '15 phút trước',
      completedAt: '15 phút trước',
      fileSize: '4.2 MB (50,000 dòng)',
      workerNode: 'worker-node-01',
      ramUsageMb: 38.4,
      downloadUrl: '#',
    },
    {
      id: 'job-7734b-1e',
      reportCode: 'RPT-EXPIRY',
      reportTitle: 'Cân Đối Tồn & Hạn Dùng FEFO',
      status: 'COMPLETED',
      progress: 100,
      totalRows: 15000,
      createdAt: '1 giờ trước',
      completedAt: '1 giờ trước',
      fileSize: '1.8 MB (15,000 dòng)',
      workerNode: 'worker-node-02',
      ramUsageMb: 34.2,
      downloadUrl: '#',
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);

  const [telemetry] = useState<QueueTelemetry>({
    queueName: 'wms.report.task.queue',
    exchange: 'wms.direct',
    consumerCount: 4,
    messageRate: '18 msg/s',
    memoryLimitMb: 512,
    currentHeapMb: 38.4,
    minioBucket: 'wms-reports',
  });

  const handleTriggerExport = (template: ReportTemplate) => {
    setIsProcessing(true);
    const newJobId = `job-${Math.random().toString(36).substring(2, 7)}-${Date.now().toString().slice(-4)}`;

    const newJob: ReportJob = {
      id: newJobId,
      reportCode: template.code,
      reportTitle: template.title,
      status: 'QUEUED',
      progress: 15,
      totalRows: parseInt(template.estimatedRows.replace(/\D/g, '')) || 10000,
      createdAt: 'Vừa xong',
      workerNode: 'worker-node-01',
      ramUsageMb: 36.8,
    };

    setJobs((prev) => [newJob, ...prev]);

    // Stage 2: SXSSF Streaming
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJobId
            ? { ...j, status: 'STREAMING', progress: 55, ramUsageMb: 38.2 }
            : j
        )
      );
    }, 1000);

    // Stage 3: MinIO Uploading
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJobId
            ? { ...j, status: 'UPLOADING', progress: 85, ramUsageMb: 39.1 }
            : j
        )
      );
    }, 2000);

    // Stage 4: Completed
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJobId
            ? {
                ...j,
                status: 'COMPLETED',
                progress: 100,
                fileSize: `${template.estimatedSize} (${template.estimatedRows})`,
                completedAt: 'Vừa xong',
                downloadUrl: '#',
                ramUsageMb: 38.4,
              }
            : j
        )
      );
      setIsProcessing(false);
    }, 3200);
  };

  const handleDownload = (job: ReportJob) => {
    alert(`Bắt đầu tải xuống tệp Excel: ${job.reportTitle}.xlsx\nNguồn: MinIO S3 bucket 'wms-reports' (Presigned URL)`);
  };

  const handleRemoveJob = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const completedCount = jobs.filter((j) => j.status === 'COMPLETED').length;
  const activeCount = jobs.filter((j) => j.status !== 'COMPLETED').length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      {/* 1. Header with Architecture Badges */}
      <ReportsHeader
        completedJobsCount={completedCount}
        activeJobsCount={activeCount}
      />

      {/* 2. Grid 8 : 4 Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CỘT TRÁI (8 COLS): DANH MỤC MẪU BÁO CÁO & HÀNG ĐỢI TÁC VỤ RABBITMQ */}
        <div className="lg:col-span-8 space-y-4">
          <ReportTemplateSelector
            onTriggerExport={handleTriggerExport}
            isProcessing={isProcessing}
          />

          <ReportJobsFeed
            jobs={jobs}
            onDownload={handleDownload}
            onRemoveJob={handleRemoveJob}
          />
        </div>

        {/* CỘT PHẢI (4 COLS): ĐỒNG HỒ ĐO TELEMETRY RABBITMQ, SXSSF RAM GUARD & MINIO */}
        <div className="lg:col-span-4">
          <RabbitMqTelemetryPanel telemetry={telemetry} />
        </div>
      </div>
    </div>
  );
};
