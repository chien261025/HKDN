import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Printer,
  CheckSquare,
  Square,
  Search,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  MapPin,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  HardDrive,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { BinLabelCard, BinLabelData } from './BinLabelCard';
import { apiClient } from '../../../services/api';
import { locationService } from '../../masterdata/services/locationService';
import { warehouseService, DEFAULT_WAREHOUSES } from '../../masterdata/services/warehouseService';
import { WarehouseItem } from '../../masterdata/types';
import { Pagination } from '../../../components/common';

const PAGE_SIZE = 10;

export const BinLabelPrintSection: React.FC = () => {
  const [searchParams] = useSearchParams();
  const targetBinParam = searchParams.get('bin');

  const [binsList, setBinsList] = useState<BinLabelData[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>(DEFAULT_WAREHOUSES);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(
    () => (targetBinParam ? 'ALL' : warehouseService.getActiveWarehouseId() || 'ALL')
  );
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedAisle, setSelectedAisle] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Mảng chứa danh sách các tem được chọn để in
  const [selectedBins, setSelectedBins] = useState<string[]>(
    targetBinParam ? [targetBinParam] : []
  );

  // Tem được chọn để hiển thị trên Live Preview Panel
  const [previewBinBarcode, setPreviewBinBarcode] = useState<string>('');

  const [paperFormat, setPaperFormat] = useState<'100x60' | 'A4'>('100x60');
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Load locations từ backend API
  useEffect(() => {
    const fetchRealLocations = async () => {
      setIsLoading(true);
      try {
        const [res, whList] = await Promise.all([
          apiClient.get<{ success: boolean; data: any[] }>('/masterdata/locations'),
          warehouseService.getWarehouses(),
        ]);
        if (whList.length > 0) setWarehouses(whList);
        if (res.data?.data && Array.isArray(res.data.data)) {
          const whById = new Map(whList.map((w) => [Number(w.id), w]));
          const mapped: BinLabelData[] = res.data.data.map((item) => {
            const whId =
              item.warehouseId ||
              (item.binBarcode.startsWith('WH02')
                ? 2
                : item.binBarcode.startsWith('WH03')
                ? 3
                : item.binBarcode.startsWith('WH04')
                ? 4
                : 1);
            const matchedWh = whById.get(Number(whId));
            const whCode = matchedWh?.code || (whId === 2 ? 'WH02' : whId === 3 ? 'WH03' : whId === 4 ? 'WH04' : 'WH01');
            const whName = (matchedWh?.name || 'KHO VẬN').toUpperCase();
            const isDbInactive = item.isActive === false || item.is_active === 0;
            return {
              id: item.id,
              binBarcode: item.binBarcode,
              zoneCode: item.zoneCode || 'ZONE_A',
              aisle: item.aisle || 'A01',
              rack: item.rack || 'R01',
              shelf: item.shelf || 'S01',
              bin: item.bin || 'B01',
              maxWeightKg: item.maxWeightKg || 500,
              warehouseId: whId,
              warehouseCode: whCode,
              warehouseName: whName,
              isActive: !isDbInactive,
            };
          });
          setBinsList(mapped);

          if (targetBinParam) {
            setSelectedBins([targetBinParam]);
            setPreviewBinBarcode(targetBinParam);
          } else if (mapped.length > 0) {
            setPreviewBinBarcode(mapped[0].binBarcode);
          }
        }
      } catch (err) {
        console.warn('Lỗi khi tải danh sách ô kệ từ API:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRealLocations();
  }, [targetBinParam]);

  // Đồng bộ kho khi đổi trên Global Header
  useEffect(() => {
    const onWhChanged = (e: Event) => {
      const custom = e as CustomEvent<string>;
      setSelectedWarehouse(custom.detail || warehouseService.getActiveWarehouseId() || 'ALL');
    };
    window.addEventListener('smart_wms_warehouse_changed', onWhChanged);
    return () => window.removeEventListener('smart_wms_warehouse_changed', onWhChanged);
  }, []);

  // Danh sách các Dãy có trong danh sách hiện tại để đưa vào bộ lọc Dãy
  const availableAisles = useMemo(() => {
    return Array.from(new Set(binsList.map((b) => b.aisle).filter(Boolean))).sort();
  }, [binsList]);

  // Bộ lọc dữ liệu đa điều kiện
  const filteredLabels = useMemo(() => {
    return binsList.filter((b) => {
      const matchWarehouse =
        selectedWarehouse === 'ALL' ||
        b.warehouseCode === selectedWarehouse ||
        b.binBarcode.startsWith(selectedWarehouse);
      const matchZone = selectedZone === 'ALL' || b.zoneCode === selectedZone;
      const matchAisle = selectedAisle === 'ALL' || b.aisle === selectedAisle;
      const matchStatus =
        selectedStatus === 'ALL'
          ? true
          : selectedStatus === 'ACTIVE'
          ? b.isActive !== false
          : b.isActive === false;
      const matchQuery =
        !searchQuery ||
        b.binBarcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.aisle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bin.toLowerCase().includes(searchQuery.toLowerCase());
      return matchWarehouse && matchZone && matchAisle && matchStatus && matchQuery;
    });
  }, [binsList, selectedWarehouse, selectedZone, selectedAisle, selectedStatus, searchQuery]);

  useEffect(() => {
    if (filteredLabels.length > 0 && !filteredLabels.some((b) => b.binBarcode === previewBinBarcode)) {
      setPreviewBinBarcode(filteredLabels[0].binBarcode);
    }
  }, [filteredLabels, previewBinBarcode]);

  const totalPages = Math.max(1, Math.ceil(filteredLabels.length / PAGE_SIZE));
  const visibleLabels = filteredLabels.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedWarehouse, selectedZone, selectedAisle, selectedStatus, searchQuery]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  // Tìm thông tin đối tượng tem đang hiển thị trên Live Preview
  const activePreviewData = useMemo(() => {
    const found = binsList.find((b) => b.binBarcode === previewBinBarcode);
    return found || filteredLabels[0] || binsList[0];
  }, [binsList, previewBinBarcode, filteredLabels]);

  // Toggle chọn 1 tem
  const toggleSelectBin = (barcode: string) => {
    setSelectedBins((prev) =>
      prev.includes(barcode) ? prev.filter((b) => b !== barcode) : [...prev, barcode]
    );
    setPreviewBinBarcode(barcode);
  };

  // Chọn toàn bộ theo bộ lọc hiện tại
  const selectAllFiltered = () => {
    const allFilteredCodes = filteredLabels.map((b) => b.binBarcode);
    setSelectedBins(allFilteredCodes);
  };

  // Bỏ chọn toàn bộ
  const deselectAll = () => {
    setSelectedBins([]);
  };

  // Chuyển đổi trạng thái Khóa / Mở Khóa ô kệ trên cơ sở dữ liệu
  const handleToggleLockBin = async (barcode: string) => {
    const target = binsList.find((b) => b.binBarcode === barcode);
    if (!target?.id) return;
    const nextActive = target.isActive === false;
    try {
      await locationService.updateLocationStatus(target.id, nextActive);
      setBinsList((prev) =>
        prev.map((b) => (b.binBarcode === barcode ? { ...b, isActive: nextActive } : b))
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể cập nhật trạng thái ô kệ!');
    }
  };

  // Lệnh in hàng loạt
  const handlePrintSelected = () => {
    if (selectedBins.length === 0) return;
    window.print();
  };

  // Lệnh in riêng 1 tem
  const handlePrintSingle = (barcode: string) => {
    setSelectedBins([barcode]);
    setPreviewBinBarcode(barcode);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Danh sách đầy đủ các tem đã chọn để in
  const selectedLabelsToPrint = binsList.filter((b) => selectedBins.includes(b.binBarcode));

  return (
    <div className="space-y-4">
      {/* 1. TOP CONTROL BAR: BỘ LỌC ĐA TIÊU CHÍ (ENTERPRISE FILTER TOOLBAR) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                In Tem Vị Trí Ô Kệ
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Quản lý {binsList.length} vị trí ô kệ · Đang hiển thị {filteredLabels.length} kết quả · Đã chọn {selectedBins.length} tem
              </p>
            </div>
          </div>

          {/* Quick Stats Chips */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
              Tổng ô: {binsList.length}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              Hoạt động: {binsList.filter((b) => b.isActive !== false).length}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-bold border border-rose-200">
              Khóa: {binsList.filter((b) => b.isActive === false).length}
            </span>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
          {/* Warehouse */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chi nhánh kho:</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-blue-600 outline-none"
            >
              <option value="ALL">Toàn bộ chi nhánh kho ({binsList.length})</option>
              {warehouses.map((w) => {
                const count = binsList.filter((b) => b.warehouseCode === w.code || Number(b.warehouseId) === Number(w.id)).length;
                return (
                  <option key={w.code} value={w.code}>
                    {w.shortName || w.name} ({w.code} - {count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Zone */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Phân khu (Zone):</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-blue-600 outline-none"
            >
              <option value="ALL">Tất cả phân khu</option>
              <option value="ZONE_A">Khu A (Hàng Khô & Thiết bị)</option>
              <option value="ZONE_B">Khu B (Kho Lạnh / Mát 2-8°C)</option>
            </select>
          </div>

          {/* Aisle */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dãy kệ (Aisle):</label>
            <select
              value={selectedAisle}
              onChange={(e) => setSelectedAisle(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-blue-600 outline-none"
            >
              <option value="ALL">Tất cả các dãy ({availableAisles.length} dãy)</option>
              {availableAisles.map((aisle) => (
                <option key={aisle} value={aisle}>
                  Dãy {aisle}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Trạng thái ô kệ:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-blue-600 outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">🟢 Đang hoạt động</option>
              <option value="LOCKED">🔴 Đang khóa bảo trì</option>
            </select>
          </div>

          {/* Search text */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tìm kiếm nhanh:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nhập mã vị trí, ô..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:border-blue-600 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: BỐ CỤC 2 CỘT CHUẨN DOANH NGHIỆP (TABLE 65% + PREVIEW & SPOOLER 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (8 COLS): BẢNG DỮ LIỆU ĐIỀU HÀNH IN TEM (ENTERPRISE DATA TABLE) */}
        <div className="lg:col-span-8 space-y-3 no-print">
          {/* Action Toolbar on Top of Table */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllFiltered}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Chọn tất cả ({filteredLabels.length})
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Bỏ chọn
              </button>
              <span className="text-xs text-slate-500 ml-1">
                Đã đánh dấu: <strong className="text-blue-700 font-bold">{selectedBins.length}</strong> / {filteredLabels.length} ô
              </span>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              * Nhấp vào dòng để xem ngay mẫu tem ở khung bên phải
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
                        onClick={selectedBins.length === filteredLabels.length ? deselectAll : selectAllFiltered}
                        className="cursor-pointer"
                        title={selectedBins.length === filteredLabels.length ? 'Bỏ chọn toàn bộ' : 'Chọn toàn bộ'}
                      >
                        {selectedBins.length > 0 && selectedBins.length === filteredLabels.length ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </th>
                    <th className="p-3">Mã Vị Trí Ô Kệ</th>
                    <th className="p-3">Phân Khu</th>
                    <th className="p-3">Tọa Độ (Dãy-Kệ-Tầng-Ô)</th>
                    <th className="p-3 text-center">Tải Trọng</th>
                    <th className="p-3 text-center">Trạng Thái</th>
                    <th className="p-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleLabels.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 space-y-2">
                        <Search className="w-6 h-6 mx-auto text-slate-300" />
                        <div className="font-bold text-slate-600">Không tìm thấy vị trí ô kệ nào phù hợp</div>
                        <p className="text-xs text-slate-400">
                          Thử thay đổi từ khóa hoặc điều chỉnh bộ lọc Dãy / Phân khu.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    visibleLabels.map((row) => {
                      const isSelected = selectedBins.includes(row.binBarcode);
                      const isPreviewing = previewBinBarcode === row.binBarcode;

                      return (
                        <tr
                          key={row.binBarcode}
                          onClick={() => setPreviewBinBarcode(row.binBarcode)}
                          className={`transition-colors cursor-pointer ${
                            isPreviewing
                              ? 'bg-blue-50/70 font-medium'
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
                              toggleSelectBin(row.binBarcode);
                            }}
                          >
                            <button type="button" className="cursor-pointer">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </td>

                          {/* Mã Vị Trí */}
                          <td className="p-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPreviewing ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-transparent'
                              }`}
                            />
                            <span>{row.binBarcode}</span>
                          </td>

                          {/* Zone */}
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase ${
                                row.zoneCode.includes('ZB') || row.zoneCode.includes('ZONE_B')
                                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}
                            >
                              {row.zoneCode}
                            </span>
                          </td>

                          {/* Tọa độ */}
                          <td className="p-3 font-mono text-slate-700">
                            <span className="text-slate-400">Dãy </span>
                            <strong>{row.aisle}</strong> · <span className="text-slate-400">Kệ </span>
                            <strong>{row.rack}</strong> · <span className="text-slate-400">Tầng </span>
                            <strong className="text-blue-700">{row.shelf}</strong> ·{' '}
                            <span className="text-slate-400">Ô </span>
                            <strong>{row.bin}</strong>
                          </td>

                          {/* Tải trọng */}
                          <td className="p-3 text-center font-mono font-semibold text-slate-800">
                            {row.maxWeightKg} KG
                          </td>

                          {/* Trạng thái */}
                          <td className="p-3 text-center">
                            {row.isActive === false ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                Khóa Bảo Trì
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                Hoạt Động
                              </span>
                            )}
                          </td>

                          {/* Thao tác */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {/* Xem mẫu */}
                              <button
                                type="button"
                                onClick={() => setPreviewBinBarcode(row.binBarcode)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Xem trước mẫu tem này ở khung bên phải"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* In riêng 1 tem */}
                              <button
                                type="button"
                                onClick={() => handlePrintSingle(row.binBarcode)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="In ngay 1 tem này"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Khóa / Mở khóa nhanh */}
                              <button
                                type="button"
                                onClick={() => handleToggleLockBin(row.binBarcode)}
                                className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                  row.isActive === false
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                                title={row.isActive === false ? 'Bấm để MỞ KHÓA ô kệ này' : 'Bấm để KHÓA BẢO TRÌ ô kệ này'}
                              >
                                {row.isActive === false ? <Lock className="w-3 h-3 text-rose-600" /> : <Unlock className="w-3 h-3 text-slate-400" />}
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
                totalItems={filteredLabels.length}
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
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    Xem Trước Mẫu Tem Ô Kệ
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {paperFormat === '100x60'
                      ? 'Tỷ lệ 100×60 mm · 300 DPI (Decal nhiệt)'
                      : 'Khổ Decal A4 · 6 nhãn/trang · 300 DPI'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold">
                {filteredLabels.length > 0
                  ? `${Math.max(1, filteredLabels.findIndex((b) => b.binBarcode === previewBinBarcode) + 1)} / ${filteredLabels.length}`
                  : '0 / 0'}
              </span>
            </div>

            {/* LIVE PREVIEW CARD (RENDER DUY NHẤT 1 TEM CHUẨN) */}
            <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200 flex justify-center">
              {activePreviewData ? (
                <BinLabelCard data={activePreviewData} />
              ) : (
                <div className="py-10 px-4 text-center text-xs text-slate-500">
                  {isLoading ? 'Đang tải vị trí ô kệ từ máy chủ...' : 'Chưa có ô kệ nào được chọn để hiển thị mẫu tem.'}
                </div>
              )}
            </div>

            {/* Tùy chọn khổ giấy & số lượng in */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Khổ giấy:</label>
                  <select
                    value={paperFormat}
                    onChange={(e) => setPaperFormat(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="100x60">Decal 100×60 mm</option>
                    <option value="A4">Decal A4 (6 tem/trang)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Số bản/tem:</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={printCopies}
                    onChange={(e) => setPrintCopies(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={selectedBins.length === 0}
                onClick={handlePrintSelected}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {selectedBins.length > 0
                    ? `XUẤT LỆNH IN (${selectedBins.length * printCopies} TEM)`
                    : 'CHƯA CHỌN TEM NÀO (0)'}
                </span>
              </button>

              <button
                type="button"
                disabled={selectedBins.length === 0}
                onClick={() => setShowPreviewModal(true)}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-300 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Xem trước toàn bộ trang in ({selectedBins.length * printCopies})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KHỐI CHUYÊN DỤNG CHO LỆNH IN (@media print) - TỰ ĐỘNG PHÂN TRANG KHI ĐẦY */}
      <div className="hidden print:flex print:flex-wrap print:gap-3 print:w-full print:overflow-visible print-decal-grid">
        {selectedLabelsToPrint.map((label) =>
          Array.from({ length: printCopies }).map((_, idx) => (
            <div
              key={`print-${label.binBarcode}-${idx}`}
              className="print-decal-item break-inside-avoid page-break-inside-avoid"
              style={{ width: 'calc(50% - 6px)' }}
            >
              <BinLabelCard data={label} />
            </div>
          ))
        )}
      </div>

      {/* 4. MODAL PRINT PREVIEW TOÀN BỘ CÁC TEM ĐÃ CHỌN */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print animate-in fade-in">
          <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold">
                    Xem trước bản in thực tế ({selectedBins.length * printCopies} tem vị trí ô kệ)
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Định dạng: <strong className="text-blue-300">{paperFormat === '100x60' ? 'Decal dầm kệ 100×60 mm' : 'Giấy Decal A4 (6 nhãn/trang)'}</strong>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 justify-items-center">
                {selectedLabelsToPrint.map((label) =>
                  Array.from({ length: printCopies }).map((_, idx) => (
                    <BinLabelCard key={`preview-${label.binBarcode}-${idx}`} data={label} />
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
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-100 transition-all cursor-pointer"
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
