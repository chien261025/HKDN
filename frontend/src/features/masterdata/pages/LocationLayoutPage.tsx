import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BinLocation } from '../types';
import { LayoutHeader } from '../components/layout/LayoutHeader';
import { WarehouseFloorPlan2D } from '../components/layout/WarehouseFloorPlan2D';
import { RackElevationGrid } from '../components/layout/RackElevationGrid';
import { BinDetailPanel } from '../components/layout/BinDetailPanel';
import { StockTransferModal } from '../../inventory/components/StockTransferModal';
import { locationService } from '../services/locationService';
import { warehouseService, DEFAULT_WAREHOUSES, filterWarehousesForCurrentUser } from '../services/warehouseService';
import { WarehouseItem } from '../types';
import { StockItem } from '../../labels/types';

export const LocationLayoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialZone = searchParams.get('zone') || 'ALL';
  const initialWh = searchParams.get('warehouse') || warehouseService.getActiveWarehouseId();
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>(() => initialWh);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>(DEFAULT_WAREHOUSES);
  const [locations, setLocations] = useState<BinLocation[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>(() => initialZone);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EMPTY' | 'OCCUPIED' | 'EXPIRING'>('ALL');
  const [selectedBinId, setSelectedBinId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [viewMode, setViewMode] = useState<'FLOOR_PLAN' | 'RACK_ELEVATION'>('FLOOR_PLAN');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const zone = searchParams.get('zone');
    if (zone) setSelectedZone(zone);
    const wh = searchParams.get('warehouse');
    if (wh) {
      setActiveWarehouseId(wh);
      warehouseService.setActiveWarehouseId(wh);
    }
    const q = searchParams.get('search');
    if (q !== null) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  // Modal điều chuyển ô kệ trực tiếp
  const [transferSourceItem, setTransferSourceItem] = useState<StockItem | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const [locs, whs] = await Promise.all([
        locationService.getLocations(),
        warehouseService.getWarehouses(),
      ]);
      const scopedWhs = filterWarehousesForCurrentUser(whs);
      setLocations(locs);
      setWarehouses(scopedWhs);
      // Nếu kho đang chọn không nằm trong phạm vi quản lý của user hiện tại, tự động chuyển về kho hợp lệ đầu tiên
      if (
        activeWarehouseId &&
        activeWarehouseId !== 'ALL' &&
        scopedWhs.length > 0 &&
        !scopedWhs.some((w) => w.code === activeWarehouseId || String(w.id) === String(activeWarehouseId))
      ) {
        setActiveWarehouseId(scopedWhs[0].code);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();

    const handleWhChanged = (e: any) => {
      const newWh = e.detail || warehouseService.getActiveWarehouseId();
      setActiveWarehouseId(newWh);
    };

    const handleWhUpdated = async () => {
      const whs = await warehouseService.getWarehouses();
      setWarehouses(filterWarehousesForCurrentUser(whs));
    };

    const handleGlobalSearch = (e: any) => {
      if (typeof e.detail === 'string') {
        setSearchTerm(e.detail);
      }
    };

    window.addEventListener('smart_wms_warehouse_changed', handleWhChanged);
    window.addEventListener('smart_wms_warehouses_updated', handleWhUpdated);
    window.addEventListener('smart_wms_global_search', handleGlobalSearch);

    return () => {
      window.removeEventListener('smart_wms_warehouse_changed', handleWhChanged);
      window.removeEventListener('smart_wms_warehouses_updated', handleWhUpdated);
      window.removeEventListener('smart_wms_global_search', handleGlobalSearch);
    };
  }, []);

  const handleSelectWarehouse = (code: string) => {
    setActiveWarehouseId(code);
    warehouseService.setActiveWarehouseId(code);
  };

  // Lọc nghiêm ngặt theo đúng Chi nhánh kho đang chọn (Tuyệt đối không lẫn mã kho)
  const branchLocations = useMemo(() => {
    const isAll = !activeWarehouseId || activeWarehouseId === 'ALL';
    const targetWhId =
      activeWarehouseId === 'WH01'
        ? 1
        : activeWarehouseId === 'WH02'
        ? 2
        : activeWarehouseId === 'WH03'
        ? 3
        : activeWarehouseId === 'WH04'
        ? 4
        : isAll
        ? 1 // Nếu chọn ALL, mặc định hiển thị kho chính Tân Bình
        : Number(activeWarehouseId);

    const targetCode =
      targetWhId === 2
        ? 'WH02'
        : targetWhId === 3
        ? 'WH03'
        : targetWhId === 4
        ? 'WH04'
        : 'WH01';

    return locations.filter((l) => {
      if (l.warehouseId) {
        return l.warehouseId === targetWhId;
      }
      if (l.warehouseCode) {
        return l.warehouseCode === targetCode;
      }
      if (l.barcode) {
        return l.barcode.startsWith(targetCode);
      }
      return targetWhId === 1;
    });
  }, [locations, activeWarehouseId]);

  // Thông tin chi nhánh hiện tại
  const currentWarehouse = useMemo(() => {
    const isAll = !activeWarehouseId || activeWarehouseId === 'ALL';
    if (isAll) {
      return warehouses.find((w) => w.code === 'WH01') || warehouses[0] || DEFAULT_WAREHOUSES[0];
    }
    return (
      warehouses.find(
        (w) =>
          w.code === activeWarehouseId ||
          String(w.id) === String(activeWarehouseId)
      ) || warehouses[0]
    );
  }, [warehouses, activeWarehouseId]);

  // Các Zone có thực tế trong kho này
  const availableZones = useMemo(() => {
    return Array.from(new Set(branchLocations.map((l) => l.zone).filter(Boolean)));
  }, [branchLocations]);

  // Bộ đếm trạng thái cho thanh lọc 1 chạm
  const counts = useMemo(() => {
    const total = branchLocations.length;
    const empty = branchLocations.filter((l) => l.status === 'EMPTY').length;
    const occupied = branchLocations.filter((l) => l.status !== 'EMPTY').length;
    const expiring = branchLocations.filter((l) => l.status === 'EXPIRING').length;
    return { total, empty, occupied, expiring };
  }, [branchLocations]);

  // Lọc theo Phân Khu, Trạng Thái, và Từ Khóa Tìm Kiếm
  const filteredLocations = useMemo(() => {
    return branchLocations.filter((l) => {
      // 1. Phân khu
      const matchZone = selectedZone === 'ALL' || l.zone === selectedZone;

      // 2. Trạng thái
      let matchStatus = true;
      if (statusFilter === 'EMPTY') {
        matchStatus = l.status === 'EMPTY';
      } else if (statusFilter === 'OCCUPIED') {
        matchStatus = l.status !== 'EMPTY';
      } else if (statusFilter === 'EXPIRING') {
        matchStatus = l.status === 'EXPIRING';
      }

      // 3. Từ khóa tìm kiếm
      const term = searchTerm.trim().toLowerCase();
      const matchSearch =
        !term ||
        l.barcode.toLowerCase().includes(term) ||
        (l.productName && l.productName.toLowerCase().includes(term)) ||
        (l.sku && l.sku.toLowerCase().includes(term));

      return matchZone && matchStatus && matchSearch;
    });
  }, [branchLocations, selectedZone, statusFilter, searchTerm]);

  // Tự động chọn ô hợp lệ đầu tiên khi danh sách lọc thay đổi
  useEffect(() => {
    if (filteredLocations.length > 0) {
      const exists = filteredLocations.some((l) => l.id === selectedBinId);
      if (!exists) {
        setSelectedBinId(filteredLocations[0].id);
      }
    } else {
      setSelectedBinId(null);
    }
  }, [filteredLocations, selectedBinId]);

  const selectedBin = branchLocations.find((l) => l.id === selectedBinId) || null;

  // Xử lý mở Modal điều chuyển ô kệ từ Panel chi tiết
  const handleOpenTransfer = (bin: BinLocation) => {
    const onHand = bin.onHandQty != null ? bin.onHandQty : (bin.qty || 0);
    const reserved = bin.reservedQty != null ? bin.reservedQty : (bin.status === 'RESERVED' ? onHand : 0);
    const available = bin.availableQty != null ? bin.availableQty : Math.max(0, onHand - reserved);

    const stockItem: StockItem = {
      id: bin.id,
      productId: bin.productId || 1,
      batchId: bin.batchId,
      warehouseId: bin.warehouseId || (bin.barcode?.startsWith('WH02') ? 2 : bin.barcode?.startsWith('WH03') ? 3 : bin.barcode?.startsWith('WH04') ? 4 : 1),
      locationId: bin.id,
      sku: bin.sku || 'SKU-GENERAL',
      name: bin.productName || 'Hàng hóa lưu kho',
      locationBarcode: bin.barcode,
      batchNumber: bin.batch || 'BATCH-01',
      expiryDate: bin.expiry || 'N/A',
      onHandQty: onHand,
      reservedQty: reserved,
      availableQty: available,
      isExpired: bin.isExpired || false,
    };
    setTransferSourceItem(stockItem);
    setIsTransferModalOpen(true);
  };

  const handleTransferSuccess = () => {
    fetchLocations();
    setIsTransferModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-10">
      {/* 1. Header & Bộ Chọn Kho / Phân Khu / Trạng Thái / Tìm Kiếm */}
      <LayoutHeader
        currentWarehouse={currentWarehouse}
        warehouses={warehouses}
        onSelectWarehouse={handleSelectWarehouse}
        selectedZone={selectedZone}
        onSelectZone={setSelectedZone}
        zones={availableZones}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        counts={counts}
      />

      {/* 2. Bố Cục 2 Cột: Sơ Đồ Mặt Bằng (8 Cols) & Bảng Inspector Chi Tiết (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (8 COLS): SƠ ĐỒ MẶT BẰNG 2D HOẶC MẶT CẮT KỆ */}
        <div className="lg:col-span-8">
          {viewMode === 'FLOOR_PLAN' ? (
            <WarehouseFloorPlan2D
              locations={filteredLocations}
              selectedBinId={selectedBinId}
              onSelectBin={(bin) => setSelectedBinId(bin.id)}
              warehouseName={currentWarehouse?.name || 'Kho Vận'}
              onResetFilters={() => {
                setSelectedZone('ALL');
                setStatusFilter('ALL');
                setSearchTerm('');
              }}
            />
          ) : (
            <RackElevationGrid
              locations={filteredLocations}
              selectedBinId={selectedBinId}
              onSelectBin={(bin) => setSelectedBinId(bin.id)}
              onResetFilters={() => {
                setSelectedZone('ALL');
                setStatusFilter('ALL');
                setSearchTerm('');
              }}
            />
          )}
        </div>

        {/* CỘT PHẢI (4 COLS): BẢNG GIÁM SÁT TẢI TRỌNG & THAO TÁC TRỰC TIẾP */}
        <div className="lg:col-span-4">
          <BinDetailPanel
            selectedBin={selectedBin}
            totalLocationsCount={branchLocations.length}
            occupiedCount={counts.occupied}
            onOpenTransferModal={handleOpenTransfer}
            onRefreshLocations={fetchLocations}
          />
        </div>
      </div>

      {/* Modal Điều Chuyển Hàng Giữa 2 Ô Kệ */}
      {isTransferModalOpen && (
        <StockTransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          sourceItem={transferSourceItem as any}
          availableLocations={branchLocations}
          onSuccess={handleTransferSuccess}
        />
      )}
    </div>
  );
};
