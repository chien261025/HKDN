import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck,
  Printer,
  CheckSquare,
  Square,
  Search,
  Eye,
  X,
  CheckCircle2,
  Clock,
  Archive,
  Layers,
  MapPin,
  Box,
  FileText,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PalletLabelCard, PalletLabelData } from './PalletLabelCard';
import { Pagination } from '../../../components/common';

const PAGE_SIZE = 8;

export interface PalletItem extends PalletLabelData {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  status: 'QC_PASSED' | 'PENDING_PUTAWAY' | 'STOCKED';
}

export const INITIAL_PALLETS: PalletItem[] = [
  {
    id: 'PLT-01',
    palletCode: 'PLT-TEST-001',
    orderCode: 'PO-2026-001',
    productName: 'Thiết bị mẫu kiểm thử WMS (TEST-WMS-001)',
    sku: 'TEST-WMS-001',
    totalQuantity: 120,
    unit: 'Kiện A6 (120 Hộp)',
    grossWeightKg: 450,
    destinationLocation: 'WH01-ZA-A01-R01-S01-B01',
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    dateCreated: '21/11/2026',
    inspectorName: 'Nguyễn Quản Trị',
    status: 'QC_PASSED',
  },
  {
    id: 'PLT-02',
    palletCode: 'PLT-TEST-002',
    orderCode: 'PO-2026-001',
    productName: 'Thiết bị mẫu kiểm thử WMS (TEST-WMS-001)',
    sku: 'TEST-WMS-001',
    totalQuantity: 80,
    unit: 'Kiện A6 (80 Hộp)',
    grossWeightKg: 320,
    destinationLocation: 'WH01-ZA-A01-R01-S02-B02',
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    dateCreated: '21/11/2026',
    inspectorName: 'Trần Thủ Kho',
    status: 'PENDING_PUTAWAY',
  },
  {
    id: 'PLT-03',
    palletCode: 'PLT-MILK-2026-01',
    orderCode: 'INB-2026-001',
    productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
    sku: 'SKU-MILK-100',
    totalQuantity: 150,
    unit: 'Kiện A6 (600 Hộp)',
    grossWeightKg: 650,
    destinationLocation: 'WH01-ZB-B01-R01-S01-B05',
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    dateCreated: '20/11/2026',
    inspectorName: 'Lê Nhân Viên',
    status: 'STOCKED',
  },
  {
    id: 'PLT-04',
    palletCode: 'PLT-MILK-2026-02',
    orderCode: 'PO-VINAMILK-001',
    productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
    sku: 'SKU-MILK-100',
    totalQuantity: 120,
    unit: 'Kiện A6 (480 Hộp)',
    grossWeightKg: 520,
    destinationLocation: 'WH01-ZB-B01-R01-S02-B06',
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    dateCreated: '21/11/2026',
    inspectorName: 'Nguyễn Quản Trị',
    status: 'PENDING_PUTAWAY',
  },
  {
    id: 'PLT-05',
    palletCode: 'PLT-SAMS-2026-01',
    orderCode: 'INB-2026-002',
    productName: 'Điện thoại Samsung Galaxy S24 Ultra 256GB',
    sku: 'SKU-SAMS-S24',
    totalQuantity: 60,
    unit: 'Kiện A6 (120 Máy)',
    grossWeightKg: 180,
    destinationLocation: 'WH01-ZA-A02-R01-S01-B04',
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    dateCreated: '19/11/2026',
    inspectorName: 'Trần Thủ Kho',
    status: 'STOCKED',
  },
  {
    id: 'PLT-06',
    palletCode: 'PLT-OMO-2026-01',
    orderCode: 'PO-202610-088',
    productName: 'Nước giặt OMO Matic Cửa Trên 3.6kg',
    sku: 'SKU-OMO-MATIC',
    totalQuantity: 80,
    unit: 'Kiện A6 (160 Can)',
    grossWeightKg: 620,
    destinationLocation: 'WH01-ZA-A01-R02-S01-B03',
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    dateCreated: '18/11/2026',
    inspectorName: 'Nguyễn Quản Trị',
    status: 'STOCKED',
  },
  {
    id: 'PLT-07',
    palletCode: 'PLT-BEER-2026-01',
    orderCode: 'PO-202610-088',
    productName: 'Bia Heineken Sleek lon 330ml',
    sku: 'SKU-BEER-330',
    totalQuantity: 200,
    unit: 'Kiện A6 (400 Thùng)',
    grossWeightKg: 850,
    destinationLocation: 'WH01-ZA-A02-R01-S01-B07',
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    dateCreated: '21/11/2026',
    inspectorName: 'Lê Nhân Viên',
    status: 'QC_PASSED',
  },
  {
    id: 'PLT-08',
    palletCode: 'PLT-YOG-2026-01',
    orderCode: 'PO-202610-089',
    productName: 'Sữa chua Vinamilk có đường Lốc 4 hộp',
    sku: 'SKU-YOGURT-04',
    totalQuantity: 100,
    unit: 'Kiện A6 (500 Lốc)',
    grossWeightKg: 410,
    destinationLocation: 'WH01-ZB-B01-R01-S01-B05',
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    dateCreated: '21/11/2026',
    inspectorName: 'Trần Thủ Kho',
    status: 'PENDING_PUTAWAY',
  },
];

export const CustomLabelPrintSection: React.FC = () => {
  const [searchParams] = useSearchParams();
  const targetPalletParam = searchParams.get('pallet');

  const [palletsList, setPalletsList] = useState<PalletItem[]>(INITIAL_PALLETS);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'QC_PASSED' | 'PENDING_PUTAWAY' | 'STOCKED'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Danh sách pallet được chọn để in
  const [selectedPallets, setSelectedPallets] = useState<string[]>(
    targetPalletParam ? [targetPalletParam] : []
  );

  // Pallet đang hiển thị ở khung Live Preview
  const [previewPalletCode, setPreviewPalletCode] = useState<string>(
    targetPalletParam || INITIAL_PALLETS[0].palletCode
  );

  const [paperFormat, setPaperFormat] = useState<'A6' | 'A4'>('A6');
  const [printCopies, setPrintCopies] = useState<number>(2); // 2 bản dán 2 mặt theo chuẩn giao nhận
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Danh sách các đơn hàng có trong hệ thống để đưa vào bộ lọc Đơn hàng
  const availableOrders = useMemo(() => {
    return Array.from(new Set(palletsList.map((p) => p.orderCode).filter(Boolean))).sort();
  }, [palletsList]);

  // Bộ lọc dữ liệu đa chiều
  const filteredPallets = useMemo(() => {
    return palletsList.filter((p) => {
      const matchWarehouse = selectedWarehouse === 'ALL' || p.warehouseCode === selectedWarehouse;
      const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      const matchOrder = selectedOrder === 'ALL' || p.orderCode === selectedOrder;

      const matchQuery =
        !searchQuery ||
        p.palletCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.destinationLocation.toLowerCase().includes(searchQuery.toLowerCase());

      return matchWarehouse && matchStatus && matchOrder && matchQuery;
    });
  }, [palletsList, selectedWarehouse, selectedStatus, selectedOrder, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPallets.length / PAGE_SIZE));
  const visiblePallets = filteredPallets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedWarehouse, selectedStatus, selectedOrder, searchQuery]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  // Tìm pallet đang hiển thị ở Live Preview
  const activePreviewData = useMemo(() => {
    const found = palletsList.find((p) => p.palletCode === previewPalletCode);
    return found || filteredPallets[0] || palletsList[0];
  }, [palletsList, previewPalletCode, filteredPallets]);

  // Toggle chọn 1 pallet
  const toggleSelectPallet = (code: string) => {
    setSelectedPallets((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
    setPreviewPalletCode(code);
  };

  // Chọn toàn bộ theo bộ lọc hiện tại
  const selectAllFiltered = () => {
    setSelectedPallets(filteredPallets.map((p) => p.palletCode));
  };

  // Bỏ chọn toàn bộ
  const deselectAll = () => {
    setSelectedPallets([]);
  };

  // Danh sách các đối tượng pallet được chọn để in
  const selectedPalletsToPrint = useMemo(() => {
    return palletsList.filter((p) => selectedPallets.includes(p.palletCode));
  }, [palletsList, selectedPallets]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    let qc = 0;
    let pending = 0;
    let stocked = 0;
    palletsList.forEach((p) => {
      if (p.status === 'QC_PASSED') qc++;
      else if (p.status === 'PENDING_PUTAWAY') pending++;
      else if (p.status === 'STOCKED') stocked++;
    });
    return { total: palletsList.length, qc, pending, stocked };
  }, [palletsList]);

  const handlePrintSelected = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* 1. FILTER TOOLBAR & CONTROL CENTER */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                In Phiếu Kiện Pallet (Khổ A6)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Quản lý {palletsList.length} kiện Pallet · Đang hiển thị {filteredPallets.length} kết quả · Đã chọn {selectedPallets.length} kiện
              </p>
            </div>
          </div>

          {/* Quick Statistics Pills */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
              Tổng kiện: {stats.total}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              Đạt QC: {stats.qc}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
              Chờ cất hàng: {stats.pending}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200">
              Đã lưu kho: {stats.stocked}
            </span>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Warehouse */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chi nhánh kho:</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-indigo-600 outline-none"
            >
              <option value="ALL">Toàn bộ chi nhánh kho ({palletsList.length})</option>
              <option value="WH01">WH01 - Kho Tổng Tân Bình</option>
              <option value="WH02">WH02 - Kho VSIP Bắc Ninh</option>
            </select>
          </div>

          {/* Order Code Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Đơn hàng tham chiếu:</label>
            <select
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-indigo-600 outline-none"
            >
              <option value="ALL">Tất cả đơn hàng ({availableOrders.length} đơn)</option>
              {availableOrders.map((ord) => (
                <option key={ord} value={ord}>
                  {ord}
                </option>
              ))}
            </select>
          </div>

          {/* Logistics Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Trạng thái luân chuyển:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-indigo-600 outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="QC_PASSED">🟢 Đã kiểm soát QC</option>
              <option value="PENDING_PUTAWAY">🟡 Chờ cất hàng vào kệ</option>
              <option value="STOCKED">🔵 Đã cất vào ô kệ</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tìm kiếm nhanh:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nhập mã pallet, PO, tên hàng, ô đích..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:border-indigo-600 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: BỐ CỤC 2 CỘT CHUẨN DOANH NGHIỆP (TABLE 65% + PREVIEW & SPOOLER 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (8 COLS): BẢNG DỮ LIỆU ĐIỀU HÀNH IN PHIẾU PALLET */}
        <div className="lg:col-span-8 space-y-3 no-print">
          {/* Action Toolbar on Top of Table */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllFiltered}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Chọn tất cả ({filteredPallets.length})
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Bỏ chọn
              </button>
              <span className="text-xs text-slate-500 ml-1">
                Đã đánh dấu: <strong className="text-indigo-700 font-bold">{selectedPallets.length}</strong> / {filteredPallets.length} kiện
              </span>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              * Nhấp vào dòng để xem ngay mẫu phiếu ở khung bên phải
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={selectedPallets.length === filteredPallets.length ? deselectAll : selectAllFiltered}
                        className="cursor-pointer"
                        title={selectedPallets.length === filteredPallets.length ? 'Bỏ chọn toàn bộ' : 'Chọn toàn bộ'}
                      >
                        {selectedPallets.length > 0 && selectedPallets.length === filteredPallets.length ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </th>
                    <th className="p-3">Mã Pallet</th>
                    <th className="p-3">Đơn Hàng PO</th>
                    <th className="p-3">Hàng Hóa & Số Lượng</th>
                    <th className="p-3">Vị Trí Đích & Tải Trọng</th>
                    <th className="p-3 text-center">Trạng Thái</th>
                    <th className="p-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visiblePallets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 space-y-2">
                        <Search className="w-6 h-6 mx-auto text-slate-300" />
                        <div className="font-bold text-slate-600">Không tìm thấy kiện Pallet nào phù hợp</div>
                        <p className="text-xs text-slate-400">
                          Thử thay đổi từ khóa hoặc điều chỉnh bộ lọc đơn hàng / trạng thái.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    visiblePallets.map((row) => {
                      const isSelected = selectedPallets.includes(row.palletCode);
                      const isPreviewing = previewPalletCode === row.palletCode;

                      return (
                        <tr
                          key={row.palletCode}
                          onClick={() => setPreviewPalletCode(row.palletCode)}
                          className={`transition-colors cursor-pointer ${
                            isPreviewing
                              ? 'bg-indigo-50/70 font-medium'
                              : isSelected
                              ? 'bg-slate-50/80 hover:bg-slate-100/60'
                              : 'hover:bg-slate-50/60'
                          }`}
                        >
                          {/* Checkbox */}
                          <td
                            className="p-3 text-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectPallet(row.palletCode);
                            }}
                          >
                            <button type="button" className="cursor-pointer">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </td>

                          {/* Mã Pallet */}
                          <td className="p-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPreviewing ? 'bg-indigo-600 ring-2 ring-indigo-200' : 'bg-transparent'
                              }`}
                            />
                            <span>{row.palletCode}</span>
                          </td>

                          {/* Đơn Hàng PO */}
                          <td className="p-3 font-mono font-bold text-indigo-700">
                            {row.orderCode}
                          </td>

                          {/* Hàng Hóa & Quy Cách */}
                          <td className="p-3 max-w-[210px]">
                            <div className="font-mono font-bold text-slate-800 text-[11px]">{row.sku}</div>
                            <div className="text-slate-600 truncate text-[11px]" title={row.productName}>
                              {row.productName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {row.unit}
                            </div>
                          </td>

                          {/* Vị Trí Đích & Trọng Lượng */}
                          <td className="p-3 font-mono text-xs">
                            <div className="font-bold text-slate-800 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{row.destinationLocation}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Tải trọng: <strong>{row.grossWeightKg} KG</strong>
                            </div>
                          </td>

                          {/* Trạng Thái Vận Hành */}
                          <td className="p-3 text-center">
                            {row.status === 'QC_PASSED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Đã kiểm QC</span>
                              </span>
                            ) : row.status === 'PENDING_PUTAWAY' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Chờ cất hàng</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <Archive className="w-3 h-3 text-blue-600" />
                                <span>Đã lưu kho</span>
                              </span>
                            )}
                          </td>

                          {/* Thao Tác */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewPalletCode(row.palletCode);
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-700 transition-colors cursor-pointer"
                                title="Xem trước mẫu phiếu"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPallets([row.palletCode]);
                                  setPreviewPalletCode(row.palletCode);
                                  setTimeout(() => window.print(), 100);
                                }}
                                className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-500 hover:text-indigo-700 transition-colors cursor-pointer"
                                title="In nhanh phiếu Pallet này"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang */}
            <div className="p-3 border-t border-slate-200">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredPallets.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (4 COLS): LIVE PRINT PREVIEW & THIẾT LẬP MÁY IN (STICKY PANEL) */}
        <div className="lg:col-span-4 sticky top-4 space-y-4 no-print">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-4">
            {/* Header Inspector */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    Xem Trước Phiếu Pallet
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Khổ A6 (105 × 148 mm) · Chuẩn GS1 Logistics
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold">
                1 / {filteredPallets.length}
              </span>
            </div>

            {/* LIVE PREVIEW CARD (RENDER DUY NHẤT 1 PHIẾU CHUẨN A6) */}
            <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200 flex justify-center">
              <PalletLabelCard data={activePreviewData} />
            </div>

            {/* Tùy chọn khổ giấy & số lượng in */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Khổ giấy in:</label>
                  <select
                    value={paperFormat}
                    onChange={(e) => setPaperFormat(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600"
                  >
                    <option value="A6">Phiếu A6 (105×148 mm)</option>
                    <option value="A4">Giấy A4 (2 phiếu/trang)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Số bản / pallet:</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={printCopies}
                    onChange={(e) => setPrintCopies(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-600"
                    title="Quy chuẩn GS1: In 2 bản dán 2 mặt đối diện của kiện pallet"
                  />
                </div>
              </div>
              <div className="text-[10px] text-slate-500 italic space-y-0.5">
                <div>* Chuẩn GS1: Mặc định in 2 bản để dán vào 2 mặt liền kề của kiện Pallet.</div>
                <div>* Công thức: {selectedPallets.length} kiện × {printCopies} phiếu/kiện = {selectedPallets.length * printCopies} phiếu in.</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={selectedPallets.length === 0}
                onClick={handlePrintSelected}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {selectedPallets.length > 0
                    ? `XUẤT LỆNH IN (${selectedPallets.length} KIỆN · TỔNG ${selectedPallets.length * printCopies} PHIẾU)`
                    : 'CHƯA CHỌN PALLET NÀO (0)'}
                </span>
              </button>

              <button
                type="button"
                disabled={selectedPallets.length === 0}
                onClick={() => setShowPreviewModal(true)}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-300 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Xem trước toàn bộ trang in ({selectedPallets.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KHỐI CHUYÊN DỤNG CHO LỆNH IN (@media print) */}
      <div className="hidden print:flex print:flex-col print:gap-6 print:w-full print:overflow-visible">
        {selectedPalletsToPrint.map((pallet) =>
          Array.from({ length: printCopies }).map((_, idx) => (
            <div
              key={`print-pallet-${pallet.palletCode}-${idx}`}
              className="break-inside-avoid page-break-after-always p-2 flex justify-center"
            >
              <PalletLabelCard data={pallet} />
            </div>
          ))
        )}
      </div>

      {/* 4. MODAL PRINT PREVIEW TOÀN BỘ CÁC PHIẾU PALLET ĐÃ CHỌN */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print animate-in fade-in">
          <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold">
                    Xem trước bản in thực tế ({selectedPallets.length} kiện · {selectedPallets.length * printCopies} phiếu Pallet A6)
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Định dạng: <strong className="text-indigo-300">{paperFormat === 'A6' ? 'Phiếu Pallet khổ A6 (105 × 148 mm)' : 'Khổ A4 (2 phiếu/trang)'}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-100/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-items-center">
                {selectedPalletsToPrint.map((pallet) =>
                  Array.from({ length: printCopies }).map((_, idx) => (
                    <div key={`preview-pallet-${pallet.palletCode}-${idx}`} className="flex flex-col items-center">
                      <PalletLabelCard data={pallet} />
                      {printCopies > 1 && (
                        <span className="text-[10px] font-mono font-bold text-slate-500 mt-1">
                          Bản {idx + 1} / {printCopies} ({idx === 0 ? 'Mặt trước' : 'Mặt hông'} Pallet)
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                * Toàn bộ thanh menu, nút bấm sẽ tự động ẩn khi gửi tới máy in.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setTimeout(() => window.print(), 200);
                  }}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Xác nhận & Gửi tới máy in</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
