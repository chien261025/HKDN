import React from 'react';
import {
  Radio,
  HardDrive,
  Cpu,
  Layers,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { QueueTelemetry } from '../types';

interface RabbitMqTelemetryPanelProps {
  telemetry: QueueTelemetry;
}

export const RabbitMqTelemetryPanel: React.FC<RabbitMqTelemetryPanelProps> = ({
  telemetry,
}) => {
  return (
    <div className="space-y-4">
      {/* 1. RabbitMQ Broker & Queue Metrics */}
      <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl p-4.5 border border-slate-800/80 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              RabbitMQ Broker Telemetry
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
            CONNECTED
          </span>
        </div>

        <div className="space-y-2 text-[11px] font-mono">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400">Queue Name:</span>
            <span className="font-bold text-amber-300">{telemetry.queueName}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400">Direct Exchange:</span>
            <span className="font-bold text-cyan-300">{telemetry.exchange}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400">Worker Consumers:</span>
            <span className="font-bold text-emerald-400">{telemetry.consumerCount} Active Threads</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400">Message Throughput:</span>
            <span className="font-bold text-indigo-300">{telemetry.messageRate}</span>
          </div>
        </div>

        <a
          href="http://localhost:15672"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all"
        >
          <span>Mở RabbitMQ Management UI (Port 15672)</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>

      {/* 2. SXSSF Streaming Memory Proof (RAM Guard) */}
      <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl p-4.5 border border-slate-800/80 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              SXSSFWorkbook Stream Guard
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
            RAM &lt; 50MB
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Giải quyết bài toán tràn bộ nhớ JVM (<code className="text-rose-400">OutOfMemoryError</code>) khi xuất hàng chục vạn dòng:
        </p>

        <div className="space-y-2">
          {/* Comparison */}
          <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/40 text-[11px] space-y-1">
            <div className="flex justify-between font-bold text-rose-400">
              <span>Standard POI (XSSF):</span>
              <span>100K Dòng ~ 1.2 GB RAM</span>
            </div>
            <p className="text-[10px] text-rose-300/70">
              Giữ toàn bộ DOM XML trên Heap RAM, dễ gây sập toàn bộ dịch vụ backend.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-[11px] space-y-1">
            <div className="flex justify-between font-bold text-emerald-400">
              <span>Smart WMS (SXSSF):</span>
              <span>Cửa sổ trượt 100 dòng</span>
            </div>
            <p className="text-[10px] text-emerald-300/80">
              Chỉ lưu 100 dòng trên RAM, tự động ghi đệm ra ổ cứng tạm, RAM duy trì <strong className="text-white">~38.4 MB</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 3. MinIO Object Storage */}
      <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl p-4.5 border border-slate-800/80 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              MinIO S3 Object Storage
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
            BUCKET: {telemetry.minioBucket}
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Tệp xuất hoàn chỉnh được stream trực tiếp lên MinIO S3 cluster, bảo đảm phân quyền và tải xuống an toàn qua Presigned URL (hạn 24 giờ).
        </p>

        <a
          href="http://localhost:9001"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all"
        >
          <span>Mở MinIO S3 Console (Port 9001)</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>
    </div>
  );
};
