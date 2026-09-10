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
    <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl p-4 border border-slate-800/80 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Hạ Tầng Xử Lý Ngầm
        </h3>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
          <CheckCircle2 className="w-3 h-3" /> 100% ONLINE
        </span>
      </div>

      {/* 1. RabbitMQ Broker */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span>Hàng Đợi RabbitMQ (AMQP 5672)</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-[11px] font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Queue:</span>
            <span className="text-amber-300 font-bold">{telemetry.queueName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Consumers:</span>
            <span className="text-emerald-400 font-bold">{telemetry.consumerCount} Active Workers</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tốc độ:</span>
            <span className="text-slate-300">{telemetry.messageRate}</span>
          </div>
        </div>

        <a
          href="http://localhost:15672"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-1.5 p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-[11px] transition-all"
        >
          <span>RabbitMQ Dashboard (Port 15672)</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* 2. SXSSF Streaming */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>SXSSF Streaming (RAM &lt; 50MB)</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-[11px] font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">RAM Heap hiện tại:</span>
            <span className="text-emerald-400 font-bold">{telemetry.currentHeapMb} MB / {telemetry.memoryLimitMb} MB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Cửa sổ trượt:</span>
            <span className="text-slate-300">100 dòng đệm đĩa</span>
          </div>
        </div>
      </div>

      {/* 3. MinIO S3 */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
          <span>Lưu Trữ MinIO S3 Storage</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-[11px] font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Bucket:</span>
            <span className="text-cyan-300 font-bold">{telemetry.minioBucket}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Chữ ký URL:</span>
            <span className="text-slate-300">Presigned 24 giờ</span>
          </div>
        </div>

        <a
          href="http://localhost:9001"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-1.5 p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-[11px] transition-all"
        >
          <span>MinIO Console (Port 9001)</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
