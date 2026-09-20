import React from 'react';
import {
  Radio,
  HardDrive,
  Cpu,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { QueueTelemetry } from '../types';

interface RabbitMqTelemetryPanelProps {
  telemetry: QueueTelemetry;
}

export const RabbitMqTelemetryPanel: React.FC<RabbitMqTelemetryPanelProps> = ({
  telemetry,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          Hạ Tầng Xử Lý Ngầm
        </h3>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 100% ONLINE
        </span>
      </div>

      {/* 1. RabbitMQ Broker */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Radio className="w-4 h-4 text-amber-600" />
          <span>Hàng Đợi RabbitMQ (AMQP 5672)</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans font-medium">Queue:</span>
            <span className="text-amber-800 font-bold">{telemetry.queueName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans font-medium">Consumers:</span>
            <span className="text-emerald-700 font-bold">{telemetry.consumerCount} Active Workers</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans font-medium">Tốc độ:</span>
            <span className="text-slate-800 font-semibold">{telemetry.messageRate}</span>
          </div>
        </div>

        <a
          href="http://localhost:15672"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold shadow-2xs transition-all"
        >
          <span>RabbitMQ Dashboard (Port 15672)</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>

      {/* 2. SXSSF Streaming */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Cpu className="w-4 h-4 text-emerald-600" />
          <span>SXSSF Streaming (RAM &lt; 50MB)</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans font-medium">RAM Heap hiện tại:</span>
            <span className="text-emerald-700 font-bold">{telemetry.currentHeapMb} MB / {telemetry.memoryLimitMb} MB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans font-medium">Cửa sổ trượt:</span>
            <span className="text-slate-800 font-semibold">100 dòng đệm đĩa</span>
          </div>
        </div>
      </div>

      {/* 3. MinIO S3 */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <HardDrive className="w-4 h-4 text-cyan-600" />
          <span>Lưu Trữ MinIO S3 Storage</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans font-medium">Bucket:</span>
            <span className="text-cyan-800 font-bold">{telemetry.minioBucket}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans font-medium">Chữ ký URL:</span>
            <span className="text-slate-800 font-semibold">Presigned 24 giờ</span>
          </div>
        </div>

        <a
          href="http://localhost:9001"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold shadow-2xs transition-all"
        >
          <span>MinIO Console (Port 9001)</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>
    </div>
  );
};
