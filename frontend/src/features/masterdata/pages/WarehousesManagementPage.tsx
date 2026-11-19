import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Boxes,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { WarehouseItem } from '../types';
import { warehouseService } from '../services/warehouseService';
import { CreateWarehouseModal } from '../components/warehouse/CreateWarehouseModal';

export const WarehousesManagementPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>(() => warehouseService.getActiveWarehouseId());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchWarehouses = async () => {
    setLoading(true);
    const list = await warehouseService.getWarehouses();
    setWarehouses(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchWarehouses();

    const handleUpdated = () => {
      fetchWarehouses();
      setActiveWarehouseId(warehouseService.getActiveWarehouseId());
    };
    const handleChanged = (e: any) => {
      setActiveWarehouseId(e.detail || warehouseService.getActiveWarehouseId());
    };

    window.addEventListener('smart_wms_warehouses_updated', handleUpdated);
    window.addEventListener('smart_wms_warehouse_changed', handleChanged);

    return () => {
      window.removeEventListener('smart_wms_warehouses_updated', handleUpdated);
      window.removeEventListener('smart_wms_warehouse_changed', handleChanged);
    };
  }, []);

  const handleSelectActive = (codeOrId: string) => {
    warehouseService.setActiveWarehouseId(codeOrId);
    setActiveWarehouseId(codeOrId);
  };

  const handleAddWarehouse = async (data: Partial<WarehouseItem>) => {
    await warehouseService.createWarehouse(data);
    await fetchWarehouses();
  };

  const totalCapacity = warehouses.reduce((acc, w) => acc + (w.capacityPallets || 2500), 0);
  const totalZones = warehouses.reduce((acc, w) => acc + (w.totalZones || 3), 0);

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'CENTRAL':
        return { label: 'Kho Tổng Trung Tâm', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'HUB':
        return { label: 'Kho Trung Chuyển (Hub)', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'COLD_STORAGE':
        return { label: 'Kho Lạnh Chuyên Dụng', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      default:
        return { label: 'Kho Phân Phối Vùng', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 ring-4 ring-blue-50 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Hệ Thống Chi Nhánh Kho Hàng (Warehouses)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                {warehouses.length} Kho Toàn Quốc
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Khai báo mạng lưới kho tổng, kho phân phối, kho trung chuyển & định vị vận hành đa chi nhánh
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-200 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Chi Nhánh Kho Mới</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Tổng Chi Nhánh</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1.5 tabular-nums">
                {warehouses.length}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">Bắc - Trung - Nam</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Đang Hoạt Động</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono mt-1.5 tabular-nums">
                {warehouses.filter((w) => w.isActive).length}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium">100% Sẵn sàng xuất nhập</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">Sức Chứa Pallet</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono mt-1.5 tabular-nums">
                {totalCapacity.toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Boxes className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600 font-medium">Thiết kế tiêu chuẩn</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block">Phân Khu Ô Kệ</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 font-mono mt-1.5 tabular-nums">
                {totalZones} Zones
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Layers className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-indigo-600 font-medium">Zone A, B, C...</div>
        </div>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warehouses.map((wh) => {
          const typeBadge = getTypeLabel(wh.type);
          const isSelected = activeWarehouseId === wh.code || activeWarehouseId === String(wh.id);

          return (
            <div
              key={wh.id}
              className={`bg-white rounded-2xl border p-5 transition-all relative overflow-hidden shadow-xs hover:shadow-md ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Kho Đang Được Chọn</span>
                </div>
              )}

              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0 pr-16">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {wh.code}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${typeBadge.bg}`}>
                      {typeBadge.label}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5 truncate" title={wh.name}>
                    {wh.name}
                  </h3>
                </div>
              </div>

              {/* Details */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{wh.address || 'Chưa cập nhật địa chỉ'}</span>
                </div>

                {wh.contactPhone && (
                  <div className="flex items-center gap-2 text-slate-600 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{wh.contactPhone}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-slate-500 pt-1">
                  <span>Sức chứa: <strong className="text-slate-800 font-mono">{(wh.capacityPallets || 2500).toLocaleString()}</strong> pallet</span>
                  <span>Phân khu: <strong className="text-slate-800 font-mono">{wh.totalZones || 3}</strong> zones</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Đang hoạt động
                </span>

                <button
                  type="button"
                  onClick={() => handleSelectActive(wh.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{isSelected ? 'Đang kích hoạt' : 'Chọn chi nhánh này'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      <CreateWarehouseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onAddWarehouse={handleAddWarehouse}
        existingCount={warehouses.length}
      />
    </div>
  );
};

