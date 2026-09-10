import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Database,
  ChevronDown,
  ChevronRight,
  AlertOctagon,
  Flame,
  CheckCircle2,
  TableProperties,
  Info
} from 'lucide-react';
import { TableSchema } from '../types';

interface AstSecuritySidebarProps {
  onSimulateAttack: (attackSql: string) => void;
  disabled: boolean;
}

const WAREHOUSE_SCHEMA: TableSchema[] = [
  {
    tableName: 'v_stock_summary',
    displayName: 'Tổng Hợp Tồn Kho & Lô',
    description: 'View tổng hợp tồn kho thực tế theo từng SKU, Lô hàng và Vị trí',
    columns: [
      { name: 'sku', type: 'VARCHAR', description: 'Mã định danh sản phẩm' },
      { name: 'batch_number', type: 'VARCHAR', description: 'Mã số lô hàng' },
      { name: 'expiry_date', type: 'DATE', description: 'Ngày hết hạn sử dụng (FEFO)' },
      { name: 'on_hand_qty', type: 'INTEGER', description: 'Tồn kho vật lý thực tế' },
      { name: 'reserved_qty', type: 'INTEGER', description: 'Số lượng đang bị khóa đơn' },
    ],
  },
  {
    tableName: 'wms_location',
    displayName: 'Danh Mục Vị Trí Ô Kệ',
    description: 'Bản đồ tọa độ ô kệ phân chia theo Phân khu, Dãy, Kệ, Tầng',
    columns: [
      { name: 'barcode', type: 'VARCHAR', description: 'Mã vạch ô kệ (VD: ZA-A01-R01-S01)' },
      { name: 'zone_code', type: 'VARCHAR', description: 'Mã phân khu (ZONE_A, ZONE_B)' },
      { name: 'status', type: 'VARCHAR', description: 'EMPTY, OCCUPIED, RESERVED' },
      { name: 'max_weight', type: 'NUMERIC', description: 'Sức chịu tải tối đa (kg)' },
    ],
  },
  {
    tableName: 'stock_ledger',
    displayName: 'Sổ Cái Bất Biến (Audit)',
    description: 'Thẻ kho ghi nhận mọi biến động xuất nhập tồn (Append-Only)',
    columns: [
      { name: 'transaction_type', type: 'VARCHAR', description: 'INBOUND, OUTBOUND, RESERVED' },
      { name: 'delta_qty', type: 'INTEGER', description: 'Số lượng biến động (+/-)' },
      { name: 'reference_code', type: 'VARCHAR', description: 'Mã phiếu xuất / nhập' },
      { name: 'created_at', type: 'TIMESTAMP', description: 'Thời khắc phát sinh giao dịch' },
    ],
  },
];

export const AstSecuritySidebar: React.FC<AstSecuritySidebarProps> = ({
  onSimulateAttack,
  disabled,
}) => {
  const [openTable, setOpenTable] = useState<string | null>('v_stock_summary');

  return (
    <div className="space-y-4">
      {/* 1. Card: Cơ Chế Kiểm Duyệt Cú Pháp AST */}
      <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl p-4.5 border border-slate-800/80 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Hàng Rào Bảo Vệ AST JSqlParser
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
            100% SECURE
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Mọi câu SQL do AI sinh ra đều được phân tích thành cây cú pháp trừu tượng (Abstract Syntax Tree) trước khi cấp phép gửi đến PostgreSQL:
        </p>

        <div className="space-y-2 text-[11px] font-mono">
          <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Chỉ chấp nhận lệnh SELECT:</strong>
              <p className="text-slate-500 text-[10px]">Chặn đứng 100% DROP, TRUNCATE, DELETE, UPDATE, ALTER.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Ép buộc tiêm LIMIT 50:</strong>
              <p className="text-slate-500 text-[10px]">Tự động duyệt cây AST để chèn LimitClause, ngăn tràn RAM.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Kiểm tra Danh mục Bảng (Whitelist):</strong>
              <p className="text-slate-500 text-[10px]">Chỉ cho phép đọc các bảng kho, cấm bảng hệ thống và mật khẩu.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Card: Demo Thử Nghiệm Tấn Công (SQL Injection Sandbox) */}
      <div className="bg-[#120a10]/80 backdrop-blur-xl rounded-2xl p-4.5 border border-rose-900/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-rose-900/30">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Thử Nghiệm Tấn Công (AST Defense)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-bold">
            Sandbox Test
          </span>
        </div>

        <p className="text-[11px] text-slate-400">
          Bấm vào các nút bên dưới để thử gửi các câu lệnh SQL độc hại nhằm kiểm chứng khả năng tự phòng thủ của AST:
        </p>

        <div className="space-y-1.5 pt-1">
          <button
            onClick={() => onSimulateAttack("DROP TABLE wms_location CASCADE;--")}
            disabled={disabled}
            className="w-full text-left p-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 hover:border-rose-700 text-rose-300 font-mono text-[11px] flex items-center justify-between transition-all group disabled:opacity-50"
          >
            <span className="truncate">DROP TABLE wms_location;--</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 ml-1 group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={() => onSimulateAttack("UPDATE stock_summary SET on_hand_qty=99999 WHERE 1=1;")}
            disabled={disabled}
            className="w-full text-left p-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 hover:border-rose-700 text-rose-300 font-mono text-[11px] flex items-center justify-between transition-all group disabled:opacity-50"
          >
            <span className="truncate">UPDATE stock SET qty=99999;</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 ml-1 group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={() => onSimulateAttack("DELETE FROM stock_ledger;")}
            disabled={disabled}
            className="w-full text-left p-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 hover:border-rose-700 text-rose-300 font-mono text-[11px] flex items-center justify-between transition-all group disabled:opacity-50"
          >
            <span className="truncate">DELETE FROM stock_ledger;</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 ml-1 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* 3. Card: Từ Điển Lược Đồ Bảng (Schema Explorer) */}
      <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl p-4.5 border border-slate-800/80 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TableProperties className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Lược Đồ Cơ Sở Dữ Liệu Tra Cứu
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">3 Bảng Chính</span>
        </div>

        <div className="space-y-2">
          {WAREHOUSE_SCHEMA.map((table) => {
            const isOpen = openTable === table.tableName;
            return (
              <div
                key={table.tableName}
                className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60 transition-all"
              >
                <button
                  onClick={() => setOpenTable(isOpen ? null : table.tableName)}
                  className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
                >
                  <div>
                    <div className="font-mono text-xs font-bold text-indigo-300">
                      {table.tableName}
                    </div>
                    <div className="text-[10px] text-slate-400">{table.displayName}</div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 space-y-1.5 text-[11px] font-mono">
                    <p className="text-[10px] text-slate-400 font-sans italic pb-1">
                      {table.description}
                    </p>
                    {table.columns.map((col) => (
                      <div
                        key={col.name}
                        className="flex items-center justify-between py-1 px-1.5 rounded bg-slate-950/60 text-slate-300"
                      >
                        <span className="text-cyan-400 font-bold">{col.name}</span>
                        <span className="text-[10px] text-slate-500">{col.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
