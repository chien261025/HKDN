import React, { useEffect, useState } from 'react';
import { LedgerEntryData } from '../../../labels/types';
import {
  History,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  SlidersHorizontal,
  Eye,
  ShieldCheck,
  Search,
  Download,
  Filter,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { Pagination } from '../../../../components/common';

const PAGE_SIZE = 10;

interface RecentLedgerCardProps {
  history: LedgerEntryData[];
  onSelectEntry: (entry: LedgerEntryData) => void;
}

export const RecentLedgerCard: React.FC<RecentLedgerCardProps> = ({
  history,
  onSelectEntry,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState<'ALL' | 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'ADJUSTMENT' | 'INITIAL_BALANCE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Lọc dữ liệu theo loại giao dịch và từ khóa tìm kiếm
  const filteredHistory = history.filter((item) => {
    const matchesType = selectedType === 'ALL' || item.transactionType === selectedType;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.id.toLowerCase().includes(q) ||
      item.referenceCode.toLowerCase().includes(q) ||
      item.productSku.toLowerCase().includes(q) ||
      item.productName.toLowerCase().includes(q) ||
      item.locationBarcode.toLowerCase().includes(q) ||
      item.batchNumber.toLowerCase().includes(q);

    return matchesType && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const visibleHistory = filteredHistory.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setCurrentPage(1), [selectedType, searchQuery]);
  useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

  // Thống kê nhanh theo từng loại giao dịch
  const inboundCount = history.filter((h) => h.transactionType === 'INBOUND').length;
  const outboundCount = history.filter((h) => h.transactionType === 'OUTBOUND').length;
  const transferCount = history.filter((h) => h.transactionType === 'TRANSFER').length;
  const adjustmentCount = history.filter((h) => h.transactionType === 'ADJUSTMENT').length;
  const initialBalanceCount = history.filter((h) => h.transactionType === 'INITIAL_BALANCE').length;

  // Xuất file CSV sổ cái kiểm toán chuẩn UTF-8
  const handleExportCsv = () => {
    const headers = [
      'Mã GD',
      'Thời Gian',
      'Loại Giao Dịch',
      'Mã Đơn Tham Chiếu',
      'Mã SKU',
      'Tên Sản Phẩm',
      'Số Lô (Batch)',
      'Vị Trí Ô Kệ',
      'Biến Động SL',
      'Tồn Trước GD',
      'Tồn Sau GD',
      'Người Thực Hiện',
      'Ghi Chú'
    ];

    const rows = filteredHistory.map((item) => [
      `"${item.id}"`,
      `"${item.timestamp}"`,
      `"${item.transactionType}"`,
      `"${item.referenceCode}"`,
      `"${item.productSku}"`,
      `"${item.productName.replace(/"/g, '""')}"`,
      `"${item.batchNumber}"`,
      `"${item.locationBarcode}"`,
      item.qtyChange > 0 ? `+${item.qtyChange}` : item.qtyChange,
      item.balanceBefore,
      item.balanceAfter,
      `"${item.performedBy}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SmartWMS_Stock_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper render badge loại giao dịch
  const renderTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'INBOUND':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nhập Kho</span>
          </span>
        );
      case 'OUTBOUND':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
            <span>Xuất Kho</span>
          </span>
        );
      case 'TRANSFER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
            <span>Chuyển Vị Trí</span>
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
            <span>Điều Chỉnh</span>
          </span>
        );
      case 'INITIAL_BALANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
            <span>Số Dư Đầu Kỳ</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
      {/* Tiêu đề & Nguyên tắc Bất biến */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Sổ Cái Biến Động Thẻ Kho (Stock Ledger)
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nhật ký bất biến (Append-Only)</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Lưu giữ toàn bộ lịch sử biến động nhập (+), xuất (-), chuyển vị trí (-/+) và điều chỉnh kiểm kê (+/-) theo thời gian thực
            </p>
          </div>
        </div>

        {/* Nút Xuất Báo Cáo Sổ Cái */}
        <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm border border-slate-200 shadow-xs transition-colors cursor-pointer"
            title="Xuất file CSV sổ cái cho kế toán & kiểm toán độc lập"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Xuất Sổ Cái (CSV)</span>
          </button>
        </div>
      </div>

      {/* Banner Nguyên tắc Kiểm toán An Toàn Dữ Liệu */}
      <div className="mx-4 sm:mx-5 p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 flex items-start gap-3 text-xs sm:text-sm leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Quy tắc toàn vẹn dữ liệu:</span> Sổ cái thẻ kho là nhật ký chỉ ghi thêm (Append-Only). CSDL được cấu hình khóa bảo vệ vĩnh viễn (JPA @Immutable), nghiêm cấm người dùng hoặc nhân viên tùy tiện sửa đổi, xóa bỏ dữ liệu đã xác nhận nhằm bảo đảm tính minh bạch khi thanh tra.
        </div>
      </div>

      {/* Toolbar Lọc Loại Giao Dịch & Tìm Kiếm */}
      <div className="px-4 sm:px-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Bộ lọc Tabs loại giao dịch */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setSelectedType('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedType === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({history.length})
          </button>
          <button
            onClick={() => setSelectedType('INBOUND')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedType === 'INBOUND'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Nhập kho ({inboundCount})
          </button>
          <button
            onClick={() => setSelectedType('OUTBOUND')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedType === 'OUTBOUND'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            Xuất kho ({outboundCount})
          </button>
          <button
            onClick={() => setSelectedType('TRANSFER')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedType === 'TRANSFER'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-700'
            }`}
          >
            Chuyển vị trí ({transferCount})
          </button>
          <button
            onClick={() => setSelectedType('ADJUSTMENT')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedType === 'ADJUSTMENT'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            Điều chỉnh ({adjustmentCount})
          </button>
          <button
            onClick={() => setSelectedType('INITIAL_BALANCE')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedType === 'INITIAL_BALANCE'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-sky-700'
            }`}
          >
            Số dư đầu kỳ ({initialBalanceCount})
          </button>
        </div>

        {/* Ô Tìm Kiếm Nhanh */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Mã GD, đơn PO/SO/TRF, SKU, ô kệ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-normal"
          />
        </div>
      </div>

      {/* Bảng Dữ Liệu Sổ Cái Bất Biến */}
      <div className="overflow-x-auto px-4 sm:px-5 pb-4">
        <table className="w-full text-left text-xs sm:text-sm text-slate-800 border-collapse">
          <thead>
            <tr className="bg-slate-50/90 text-slate-500 font-semibold text-xs uppercase tracking-wider border-y border-slate-200">
              <th className="py-3 px-3.5 whitespace-nowrap">Mã GD</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Thời Gian</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Loại Giao Dịch</th>
              <th className="py-3 px-3.5 min-w-[220px]">Sản Phẩm & Lô Hàng</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Vị Trí Ô Kệ</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Biến Động (SL)</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Tồn Trước</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Tồn Sau GD</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Mã Tham Chiếu</th>
              <th className="py-3 px-3.5 text-right whitespace-nowrap">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleHistory.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">Không tìm thấy bản ghi sổ cái nào</p>
                  <p className="text-xs text-slate-400 mt-0.5">Thử đổi bộ lọc hoặc xóa từ khóa tìm kiếm</p>
                </td>
              </tr>
            ) : (
              visibleHistory.map((item) => {
                const isOutbound = item.qtyChange < 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Mã Giao Dịch */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/80 text-xs">
                        #{item.id}
                      </span>
                    </td>

                    {/* Thời Gian */}
                    <td className="py-3 px-3.5 font-mono text-slate-500 text-xs whitespace-nowrap">
                      {item.timestamp}
                    </td>

                    {/* Loại Giao Dịch */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {renderTransactionTypeBadge(item.transactionType)}
                    </td>

                    {/* Mặt Hàng & Lô */}
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-600 transition-colors" title={item.productName}>
                        {item.productName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 font-mono">
                        <span className="text-indigo-600 font-medium">{item.productSku}</span>
                        <span>•</span>
                        <span>Lô: {item.batchNumber}</span>
                      </div>
                    </td>

                    {/* Ô Kệ */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-semibold border border-slate-200">
                        {item.locationBarcode}
                      </span>
                    </td>

                    {/* Biến Động Số Lượng */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-mono font-bold px-2.5 py-0.5 rounded-full text-xs ${
                          isOutbound
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {item.qtyChange > 0 ? `+${item.qtyChange}` : item.qtyChange} SP
                      </span>
                    </td>

                    {/* Tồn Trước GD */}
                    <td className="py-3 px-3.5 text-center font-mono text-slate-600 text-xs sm:text-sm whitespace-nowrap">
                      {item.balanceBefore.toLocaleString('vi-VN')}
                    </td>

                    {/* Tồn Sau GD */}
                    <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                      {item.balanceAfter.toLocaleString('vi-VN')}
                    </td>

                    {/* Mã Đơn Tham Chiếu */}
                    <td className="py-3 px-3.5 font-mono text-indigo-700 font-semibold text-xs whitespace-nowrap">
                      {item.referenceCode}
                    </td>

                    {/* Nút Xem Chứng Từ */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectEntry(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-semibold text-xs transition-colors cursor-pointer border border-indigo-200"
                        title="Xem chi tiết phiếu xuất / nhập / điều chuyển"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem Phiếu</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {filteredHistory.length > PAGE_SIZE && (
          <div className="pt-3">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredHistory.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
