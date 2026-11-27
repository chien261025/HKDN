import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Printer,
  CheckSquare,
  Square,
  Search,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Package,
  Layers,
  Calendar,
  Warehouse,
  Filter,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ProductBatchLabelCard, ProductBatchLabelData } from './ProductBatchLabelCard';
import { apiClient } from '../../../services/api';
import { inventoryService } from '../../inventory/services/inventoryService';
import { Pagination } from '../../../components/common';

const PAGE_SIZE = 10;

export interface ProductBatchItem extends ProductBatchLabelData {
  id: string;
  stockQuantity: number;
  warehouseCode: string;
  warehouseName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'NEAR_EXPIRY';
}

export const INITIAL_BATCHES: ProductBatchItem[] = [
  {
    id: 'B01',
    batchNumber: 'LOT-TEST-001',
    sku: 'TEST-WMS-001',
    productName: 'Thiết bị mẫu kiểm thử WMS (TEST-WMS-001)',
    barcode: '8930000000001',
    manufactureDate: '2026-01-01',
    expiryDate: '2026-12-25',
    storageZone: 'ZONE_A (KHÔ & THIẾT BỊ)',
    supplierName: 'Smart WMS Authorized Supplier',
    stockQuantity: 120,
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    status: 'ACTIVE',
  },
  {
    id: 'B02',
    batchNumber: 'LOT-TEST-002',
    sku: 'TEST-WMS-001',
    productName: 'Thiết bị mẫu kiểm thử WMS (TEST-WMS-001)',
    barcode: '8930000000001',
    manufactureDate: '2025-11-15',
    expiryDate: '2026-11-15',
    storageZone: 'ZONE_A (KHÔ & THIẾT BỊ)',
    supplierName: 'Smart WMS Authorized Supplier',
    stockQuantity: 80,
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    status: 'EXPIRED',
  },
  {
    id: 'B03',
    batchNumber: 'BATCH-MILK-26A',
    sku: 'SKU-MILK-100',
    productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
    barcode: '8934567890123',
    manufactureDate: '2026-06-01',
    expiryDate: '2026-09-25',
    storageZone: 'ZONE_B (MÁT 2-8°C)',
    supplierName: 'Vinamilk Việt Nam',
    stockQuantity: 500,
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    status: 'EXPIRED',
  },
  {
    id: 'B04',
    batchNumber: 'BATCH-MILK-26B',
    sku: 'SKU-MILK-100',
    productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
    barcode: '8934567890123',
    manufactureDate: '2026-07-01',
    expiryDate: '2026-11-30',
    storageZone: 'ZONE_B (MÁT 2-8°C)',
    supplierName: 'Vinamilk Việt Nam',
    stockQuantity: 420,
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    status: 'NEAR_EXPIRY',
  },
  {
    id: 'B05',
    batchNumber: 'BATCH-VNM-MILK-01',
    sku: 'SKU-MILK-100',
    productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
    barcode: '8934567890123',
    manufactureDate: '2026-11-17',
    expiryDate: '2027-04-15',
    storageZone: 'ZONE_B (MÁT 2-8°C)',
    supplierName: 'Vinamilk Việt Nam',
    stockQuantity: 650,
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    status: 'ACTIVE',
  },
  {
    id: 'B06',
    batchNumber: 'BATCH-S24-01',
    sku: 'SKU-SAMS-S24',
    productName: 'Điện thoại Samsung Galaxy S24 Ultra 256GB',
    barcode: '8806091234567',
    manufactureDate: '2026-01-10',
    expiryDate: '2028-01-10',
    storageZone: 'ZONE_A (KHÔ & ĐIỆN TỬ)',
    supplierName: 'Samsung Electronics Vina',
    stockQuantity: 150,
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    status: 'ACTIVE',
  },
  {
    id: 'B07',
    batchNumber: 'BATCH-OMO-01',
    sku: 'SKU-OMO-MATIC',
    productName: 'Nước giặt OMO Matic Cửa Trên 3.6kg',
    barcode: '8931234567890',
    manufactureDate: '2026-03-01',
    expiryDate: '2027-03-01',
    storageZone: 'ZONE_A (KHÔ & THIẾT BỊ)',
    supplierName: 'Unilever Việt Nam',
    stockQuantity: 200,
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    status: 'ACTIVE',
  },
  {
    id: 'B08',
    batchNumber: 'BATCH-OMO-2026-NEAR',
    sku: 'SKU-OMO-MATIC',
    productName: 'Nước giặt OMO Matic Cửa Trên 3.6kg',
    barcode: '8931234567890',
    manufactureDate: '2025-11-01',
    expiryDate: '2026-11-01',
    storageZone: 'ZONE_A (KHÔ & THIẾT BỊ)',
    supplierName: 'Unilever Việt Nam',
    stockQuantity: 40,
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    status: 'EXPIRED',
  },
  {
    id: 'B09',
    batchNumber: 'BATCH-YOG-26A',
    sku: 'SKU-YOGURT-04',
    productName: 'Sữa chua Vinamilk có đường Lốc 4 hộp',
    barcode: '8934567890456',
    manufactureDate: '2026-10-01',
    expiryDate: '2026-11-15',
    storageZone: 'ZONE_B (MÁT 2-8°C)',
    supplierName: 'Vinamilk Việt Nam',
    stockQuantity: 180,
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    status: 'EXPIRED',
  },
  {
    id: 'B10',
    batchNumber: 'BATCH-YOG-26B',
    sku: 'SKU-YOGURT-04',
    productName: 'Sữa chua Vinamilk có đường Lốc 4 hộp',
    barcode: '8934567890456',
    manufactureDate: '2026-10-15',
    expiryDate: '2026-12-25',
    storageZone: 'ZONE_B (MÁT 2-8°C)',
    supplierName: 'Vinamilk Việt Nam',
    stockQuantity: 320,
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    status: 'ACTIVE',
  },
  {
    id: 'B11',
    batchNumber: 'BATCH-HEIN-26A',
    sku: 'SKU-BEER-330',
    productName: 'Bia Heineken Sleek lon 330ml',
    barcode: '8935001234567',
    manufactureDate: '2026-05-10',
    expiryDate: '2027-05-10',
    storageZone: 'ZONE_A (KHÔ & THIẾT BỊ)',
    supplierName: 'Heineken Trading Vietnam',
    stockQuantity: 800,
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    status: 'ACTIVE',
  },
  {
    id: 'B12',
    batchNumber: 'BATCH-COCA-26A',
    sku: 'SKU-COCA-330',
    productName: 'Nước giải khát Coca-Cola lon 330ml',
    barcode: '8935123456789',
    manufactureDate: '2026-06-01',
    expiryDate: '2027-06-01',
    storageZone: 'ZONE_A (KHÔ & THIẾT BỊ)',
    supplierName: 'Coca-Cola Beverages Vietnam',
    stockQuantity: 950,
    warehouseCode: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình',
    status: 'ACTIVE',
  },
];

export const BatchLabelPrintSection: React.FC = () => {
  const [searchParams] = useSearchParams();
  const targetSkuParam = searchParams.get('sku');
  const targetBatchParam = searchParams.get('batch');

  const [batchesList, setBatchesList] = useState<ProductBatchItem[]>(INITIAL_BATCHES);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedFefoStatus, setSelectedFefoStatus] = useState<'ALL' | 'ACTIVE' | 'NEAR_EXPIRY' | 'EXPIRED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Danh sách mã lô được chọn để in
  const [selectedBatches, setSelectedBatches] = useState<string[]>(
    targetBatchParam ? [targetBatchParam] : []
  );

  // Lô đang hiển thị ở khung Live Preview
  const [previewBatchNumber, setPreviewBatchNumber] = useState<string>(
    targetBatchParam || INITIAL_BATCHES[0].batchNumber
  );

  const [paperFormat, setPaperFormat] = useState<'100x60' | 'A4'>('100x60');
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Load danh sách lô hàng thực tế từ kho
  useEffect(() => {
    const fetchRealBatches = async () => {
      try {
        const stocks = await inventoryService.getInventoryBalances();
        if (stocks && stocks.length > 0) {
          const grouped = new Map<string, ProductBatchItem>();
          const now = new Date();
          stocks.forEach((s, idx) => {
            const batchNum = s.batchNumber || `LOT-${s.sku}-${idx + 1}`;
            const locWhPrefix = s.locationBarcode?.split('-')[0];
            const whCode =
              (locWhPrefix && locWhPrefix.startsWith('WH') ? locWhPrefix : '') ||
              (s.warehouseId ? `WH${String(s.warehouseId).padStart(2, '0')}` : 'WH01');
            const key = `${whCode}__${s.sku}__${batchNum}`;
            const existing = grouped.get(key);
            if (existing) {
              existing.stockQuantity += s.onHandQty || 0;
              return;
            }
            const expStr = s.expiryDate && s.expiryDate !== 'N/A' ? s.expiryDate : '';
            let status: 'ACTIVE' | 'NEAR_EXPIRY' | 'EXPIRED' = 'ACTIVE';
            if (s.isExpired) {
              status = 'EXPIRED';
            } else if (s.isExpiringSoon) {
              status = 'NEAR_EXPIRY';
            } else if (expStr) {
              const diffDays = Math.ceil((new Date(expStr).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays < 0) status = 'EXPIRED';
              else if (diffDays <= 45) status = 'NEAR_EXPIRY';
            }
            const locUpper = (s.locationBarcode || '').toUpperCase();
            const storageZone = locUpper.includes('-ZB-')
              ? 'ZONE_B (MÁT 2-8°C)'
              : locUpper.includes('-ZC-')
              ? 'ZONE_C (ĐÔNG/HÓA)'
              : 'ZONE_A (KHÔ & THIẾT BỊ)';

            grouped.set(key, {
              id: `STK-${s.id || idx}`,
              batchNumber: batchNum,
              sku: s.sku,
              productName: s.name,
              barcode: s.barcode || s.sku,
              manufactureDate: s.manufactureDate || '',
              expiryDate: expStr || 'Không thời hạn',
              storageZone,
              supplierName: 'Nhà cung cấp chuẩn',
              stockQuantity: s.onHandQty || 0,
              warehouseCode: whCode,
              warehouseName: s.warehouseName || whCode,
              status,
            });
          });

          const realList = Array.from(grouped.values());
          setBatchesList(realList);

          if (targetBatchParam) {
            const matched = realList.find((b) => b.batchNumber === targetBatchParam);
            if (matched) {
              setPreviewBatchNumber(matched.batchNumber);
              setSelectedBatches([matched.batchNumber]);
              return;
            }
          }
          if (targetSkuParam) {
            const matched = realList.find((b) => b.sku === targetSkuParam);
            if (matched) {
              setPreviewBatchNumber(matched.batchNumber);
              setSelectedBatches([matched.batchNumber]);
              return;
            }
          }
          if (realList[0]) {
            setPreviewBatchNumber(realList[0].batchNumber);
          }
          return;
        }

        const res = await apiClient.get<{ success: boolean; data: any[] }>('/masterdata/products');
        if (res.data?.data && res.data.data.length > 0) {
          const mapped: ProductBatchItem[] = res.data.data.map((p, idx) => ({
            id: `API-${p.id || idx}`,
            batchNumber: `LOT-${p.sku?.replace(/SKU-/i, '') || '01'}-01`,
            sku: p.sku,
            productName: p.name,
            barcode: p.barcode || p.sku,
            manufactureDate: '',
            expiryDate: '2027-12-31',
            storageZone: 'ZONE_A (KHÔ & THIẾT BỊ)',
            supplierName: p.brand || 'Chính hãng',
            stockQuantity: 0,
            warehouseCode: 'WH01',
            warehouseName: 'Kho Tổng Tân Bình',
            status: 'ACTIVE',
          }));
          setBatchesList(mapped);
          if (mapped[0]) setPreviewBatchNumber(mapped[0].batchNumber);
        }
      } catch (err) {
        console.warn('Lỗi tải danh sách lô hàng thực tế:', err);
      }
    };
    fetchRealBatches();
  }, [targetSkuParam, targetBatchParam]);

  // Bộ lọc dữ liệu đa chiều
  const filteredBatches = useMemo(() => {
    const today = new Date();
    return batchesList.filter((b) => {
      const matchWarehouse = selectedWarehouse === 'ALL' || b.warehouseCode === selectedWarehouse;
      const matchZone =
        selectedZone === 'ALL' ||
        (selectedZone === 'ZONE_A' && b.storageZone?.includes('ZONE_A')) ||
        (selectedZone === 'ZONE_B' && b.storageZone?.includes('ZONE_B'));

      let computedStatus: 'ACTIVE' | 'NEAR_EXPIRY' | 'EXPIRED' = b.status;
      if (b.expiryDate) {
        const expDate = new Date(b.expiryDate);
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) computedStatus = 'EXPIRED';
        else if (diffDays <= 45) computedStatus = 'NEAR_EXPIRY';
        else computedStatus = 'ACTIVE';
      }

      const matchFefo = selectedFefoStatus === 'ALL' || computedStatus === selectedFefoStatus;

      const matchQuery =
        !searchQuery ||
        b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.productName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchWarehouse && matchZone && matchFefo && matchQuery;
    });
  }, [batchesList, selectedWarehouse, selectedZone, selectedFefoStatus, searchQuery]);

  useEffect(() => {
    if (filteredBatches.length > 0 && !filteredBatches.some((b) => b.batchNumber === previewBatchNumber)) {
      setPreviewBatchNumber(filteredBatches[0].batchNumber);
    }
  }, [filteredBatches, previewBatchNumber]);

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / PAGE_SIZE));
  const visibleBatches = filteredBatches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedWarehouse, selectedZone, selectedFefoStatus, searchQuery]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  // Tìm lô hàng đang hiển thị ở Live Preview
  const activePreviewData = useMemo(() => {
    const found = batchesList.find((b) => b.batchNumber === previewBatchNumber);
    return found || filteredBatches[0] || batchesList[0];
  }, [batchesList, previewBatchNumber, filteredBatches]);

  // Toggle chọn 1 lô
  const toggleSelectBatch = (batchNum: string) => {
    setSelectedBatches((prev) =>
      prev.includes(batchNum) ? prev.filter((b) => b !== batchNum) : [...prev, batchNum]
    );
    setPreviewBatchNumber(batchNum);
  };

  // Chọn toàn bộ theo bộ lọc hiện tại
  const selectAllFiltered = () => {
    setSelectedBatches(filteredBatches.map((b) => b.batchNumber));
  };

  // Bỏ chọn toàn bộ
  const deselectAll = () => {
    setSelectedBatches([]);
  };

  // Danh sách các đối tượng lô được chọn để in
  const selectedBatchesToPrint = useMemo(() => {
    return batchesList.filter((b) => selectedBatches.includes(b.batchNumber));
  }, [batchesList, selectedBatches]);

  // Tính thống kê nhanh
  const stats = useMemo(() => {
    const today = new Date('2026-11-21');
    let active = 0;
    let near = 0;
    let expired = 0;

    batchesList.forEach((b) => {
      if (b.expiryDate) {
        const expDate = new Date(b.expiryDate);
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) expired++;
        else if (diffDays <= 45) near++;
        else active++;
      } else {
        active++;
      }
    });

    return { total: batchesList.length, active, near, expired };
  }, [batchesList]);

  // Trigger lệnh in của trình duyệt
  const handlePrintSelected = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* 1. FILTER TOOLBAR & CONTROL CENTER */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                In Tem Lô Hàng &amp; Hạn Sử Dụng
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Quản lý {batchesList.length} số lô hàng hóa · Đang hiển thị {filteredBatches.length} kết quả · Đã chọn {selectedBatches.length} lô
              </p>
            </div>
          </div>

          {/* Quick Statistics Pills */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
              Tổng lô: {stats.total}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              Còn hạn: {stats.active}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
              Cận hạn: {stats.near}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-bold border border-rose-200">
              Quá hạn: {stats.expired}
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
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-emerald-600 outline-none"
            >
              <option value="ALL">Toàn bộ chi nhánh kho ({batchesList.length})</option>
              <option value="WH01">WH01 - Kho Tổng Tân Bình</option>
              <option value="WH02">WH02 - Kho VSIP Bắc Ninh</option>
            </select>
          </div>

          {/* Storage Zone */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Phân khu lưu trữ:</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-emerald-600 outline-none"
            >
              <option value="ALL">Tất cả phân khu</option>
              <option value="ZONE_A">Khu A (Hàng Khô & Thiết bị)</option>
              <option value="ZONE_B">Khu B (Kho Lạnh / Mát 2-8°C)</option>
            </select>
          </div>

          {/* FEFO Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Trạng thái hạn dùng (FEFO):</label>
            <select
              value={selectedFefoStatus}
              onChange={(e) => setSelectedFefoStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:border-emerald-600 outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">🟢 Còn hạn an toàn (Safe)</option>
              <option value="NEAR_EXPIRY">🟡 Cận hạn (&lt; 45 ngày)</option>
              <option value="EXPIRED">🔴 Đã quá hạn (Expired / Cách ly)</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tìm kiếm nhanh:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nhập mã số lô, SKU, tên hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:border-emerald-600 outline-none"
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
                Chọn tất cả ({filteredBatches.length})
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Bỏ chọn
              </button>
              <span className="text-xs text-slate-500 ml-1">
                Đã đánh dấu: <strong className="text-emerald-700 font-bold">{selectedBatches.length}</strong> / {filteredBatches.length} lô
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
                        onClick={selectedBatches.length === filteredBatches.length ? deselectAll : selectAllFiltered}
                        className="cursor-pointer"
                        title={selectedBatches.length === filteredBatches.length ? 'Bỏ chọn toàn bộ' : 'Chọn toàn bộ'}
                      >
                        {selectedBatches.length > 0 && selectedBatches.length === filteredBatches.length ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </th>
                    <th className="p-3">Mã Số Lô (Batch / Lot)</th>
                    <th className="p-3">Mã SKU & Sản Phẩm</th>
                    <th className="p-3">Hạn Dùng (FEFO)</th>
                    <th className="p-3 text-center">Phân Khu / Tồn</th>
                    <th className="p-3 text-center">Trạng Thái FEFO</th>
                    <th className="p-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleBatches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 space-y-2">
                        <Search className="w-6 h-6 mx-auto text-slate-300" />
                        <div className="font-bold text-slate-600">Không tìm thấy lô hàng nào phù hợp</div>
                        <p className="text-xs text-slate-400">
                          Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc hạn dùng FEFO.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    visibleBatches.map((row) => {
                      const isSelected = selectedBatches.includes(row.batchNumber);
                      const isPreviewing = previewBatchNumber === row.batchNumber;

                      // Tính hạn dùng
                      const today = new Date('2026-11-21');
                      const expDate = row.expiryDate ? new Date(row.expiryDate) : null;
                      const diffDays = expDate ? Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 999;
                      const isExpired = diffDays < 0;
                      const isNear = diffDays >= 0 && diffDays <= 45;

                      return (
                        <tr
                          key={row.id}
                          onClick={() => setPreviewBatchNumber(row.batchNumber)}
                          className={`transition-colors cursor-pointer ${
                            isPreviewing
                              ? 'bg-emerald-50/70 font-medium'
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
                              toggleSelectBatch(row.batchNumber);
                            }}
                          >
                            <button type="button" className="cursor-pointer">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </td>

                          {/* Mã Số Lô */}
                          <td className="p-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPreviewing ? 'bg-emerald-600 ring-2 ring-emerald-200' : 'bg-transparent'
                              }`}
                            />
                            <span>{row.batchNumber}</span>
                          </td>

                          {/* SKU & Sản phẩm */}
                          <td className="p-3 max-w-[220px]">
                            <div className="font-mono font-bold text-slate-800 text-[11px]">{row.sku}</div>
                            <div className="text-slate-600 truncate text-[11px]" title={row.productName}>
                              {row.productName}
                            </div>
                          </td>

                          {/* Hạn Dùng */}
                          <td className="p-3 font-mono text-xs">
                            <div className={`font-bold ${isExpired ? 'text-rose-700' : isNear ? 'text-amber-700' : 'text-slate-900'}`}>
                              {row.expiryDate || 'Không giới hạn'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {isExpired ? `Quá hạn ${Math.abs(diffDays)} ngày` : `Còn ${diffDays} ngày`}
                            </div>
                          </td>

                          {/* Phân Khu & Số Lượng */}
                          <td className="p-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase ${
                                row.storageZone?.includes('ZONE_B')
                                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}
                            >
                              {row.storageZone?.includes('ZONE_B') ? 'ZONE_B (LẠNH)' : 'ZONE_A (KHÔ)'}
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Tồn: <strong>{row.stockQuantity}</strong>
                            </div>
                          </td>

                          {/* Trạng Thái FEFO */}
                          <td className="p-3 text-center">
                            {isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>Đã hết hạn</span>
                              </span>
                            ) : isNear ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Cận hạn</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Đạt chuẩn</span>
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
                                  setPreviewBatchNumber(row.batchNumber);
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                                title="Xem trước mẫu tem"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBatches([row.batchNumber]);
                                  setPreviewBatchNumber(row.batchNumber);
                                  setTimeout(() => window.print(), 100);
                                }}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                                title="In nhanh tem lô này"
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
                totalItems={filteredBatches.length}
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
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    Xem Trước Tem Lô Hàng
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Khổ Decal 100×60 mm · Barcode Code128 + QR FEFO
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold">
                1 / {filteredBatches.length}
              </span>
            </div>

            {/* LIVE PREVIEW CARD (RENDER DUY NHẤT 1 TEM CHUẨN) */}
            <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200 flex justify-center">
              {activePreviewData ? (
                <ProductBatchLabelCard data={activePreviewData} />
              ) : (
                <div className="py-10 px-4 text-center text-xs text-slate-500">
                  Chưa có lô hàng nào được chọn để hiển thị mẫu tem.
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
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
                  >
                    <option value="100x60">Decal 100×60 mm</option>
                    <option value="A4">Decal A4 (6 tem/trang)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Số tem / mỗi lô:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={printCopies}
                    onChange={(e) => setPrintCopies(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none focus:border-emerald-600"
                    title="Số lượng tem in cho mỗi lô hàng đã chọn"
                  />
                </div>
              </div>
              <div className="text-[10px] text-slate-500 italic">
                * Công thức: {selectedBatches.length} lô × {printCopies} tem/lô = {selectedBatches.length * printCopies} tem in.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={selectedBatches.length === 0}
                onClick={handlePrintSelected}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-200 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {selectedBatches.length > 0
                    ? `XUẤT LỆNH IN (${selectedBatches.length} LÔ · TỔNG ${selectedBatches.length * printCopies} TEM)`
                    : 'CHƯA CHỌN LÔ NÀO (0)'}
                </span>
              </button>

              <button
                type="button"
                disabled={selectedBatches.length === 0}
                onClick={() => setShowPreviewModal(true)}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-300 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Xem trước toàn bộ trang in ({selectedBatches.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KHỐI CHUYÊN DỤNG CHO LỆNH IN (@media print) - TỰ ĐỘNG PHÂN TRANG KHI ĐẦY */}
      <div className="hidden print:flex print:flex-wrap print:gap-3 print:w-full print:overflow-visible print-decal-grid">
        {selectedBatchesToPrint.map((batch) =>
          Array.from({ length: printCopies }).map((_, idx) => (
            <div
              key={`print-batch-${batch.batchNumber}-${idx}`}
              className="print-decal-item break-inside-avoid page-break-inside-avoid"
              style={{ width: 'calc(50% - 6px)' }}
            >
              <ProductBatchLabelCard data={batch} />
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
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold">
                    Xem trước bản in thực tế ({selectedBatches.length} lô · {selectedBatches.length * printCopies} tem)
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Định dạng: <strong className="text-emerald-300">{paperFormat === '100x60' ? 'Decal sản phẩm 100×60 mm' : 'Giấy Decal A4 (6 nhãn/trang)'}</strong>
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
                {selectedBatchesToPrint.map((batch) =>
                  Array.from({ length: printCopies }).map((_, idx) => (
                    <div key={`preview-batch-${batch.batchNumber}-${idx}`} className="flex flex-col items-center">
                      <ProductBatchLabelCard data={batch} />
                      {printCopies > 1 && (
                        <span className="text-[10px] font-mono font-bold text-slate-500 mt-1">
                          Tem {idx + 1} / {printCopies}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                * Toàn bộ thanh menu, nút bấm sẽ tự động ẩn khi gửi tới máy in vật lý.
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
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-100 transition-all cursor-pointer"
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
