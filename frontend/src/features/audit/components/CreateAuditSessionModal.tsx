import React, { useEffect, useState, useMemo } from 'react';
import {
  ClipboardCheck,
  X,
  Building2,
  Layers,
  CheckSquare,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  EyeOff,
  Search,
  Box,
  MapPin,
  Barcode,
} from 'lucide-react';
import { auditService } from '../services/auditService';
import { CreateAuditPayload, AuditScopePreviewResult } from '../types';

interface Props {
  onClose: () => void;
  onCreateSession: (payload: CreateAuditPayload) => Promise<void>;
}

export const CreateAuditSessionModal: React.FC<Props> = ({ onClose, onCreateSession }) => {
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [title, setTitle] = useState('Kiểm kê định kỳ tháng 11/2026');
  const [warehouseId, setWarehouseId] = useState<number>(1);
  const [auditType, setAuditType] = useState<'CYCLE_COUNT' | 'FULL_AUDIT' | 'SPOT_CHECK'>('CYCLE_COUNT');
  const [scopeType, setScopeType] = useState<'ALL' | 'ZONE' | 'BIN' | 'SKU'>('ZONE');
  const [selectedZone, setSelectedZone] = useState('ZONE_A');
  const [selectedBin, setSelectedBin] = useState('');
  const [selectedSku, setSelectedSku] = useState('');
  const [notes, setNotes] = useState('Kiểm tra hàng cận hạn và hàng tồn lâu tại khu B');
  const [blindCount, setBlindCount] = useState(true);
  const [requireRecount, setRequireRecount] = useState(true);
  const [includeEmptyBins, setIncludeEmptyBins] = useState(false);

  const [preview, setPreview] = useState<AuditScopePreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // 1. Tải danh sách kho
  useEffect(() => {
    auditService
      .getWarehouseOptions()
      .then((data) => {
        setWarehouses(data);
        if (data.length > 0) setWarehouseId(data[0].id);
      })
      .catch(() => setError('Không tải được danh sách chi nhánh kho.'));
  }, []);

  // 2. Tải danh mục vị trí và sản phẩm khi kho thay đổi
  useEffect(() => {
    if (!warehouseId) return;

    auditService
      .getWarehouseLocations(warehouseId)
      .then((locs) => {
        setLocations(locs);
        const zones = Array.from(new Set(locs.map((l: any) => l.zoneCode).filter(Boolean)));
        if (zones.length > 0 && (!selectedZone || !zones.includes(selectedZone))) {
          setSelectedZone(zones[0]);
        }
        if (locs.length > 0) {
          setSelectedBin(locs[0].binBarcode);
        }
      })
      .catch((err) => console.warn('Lỗi tải vị trí kho:', err));

    auditService
      .getProducts()
      .then((prods) => {
        setProducts(prods);
        if (prods.length > 0) {
          setSelectedSku(prods[0].sku);
        }
      })
      .catch((err) => console.warn('Lỗi tải danh mục sản phẩm:', err));
  }, [warehouseId]);

  // Các Zone khả dụng trong kho đang chọn
  const availableZones = useMemo(() => {
    return Array.from(new Set(locations.map((l) => l.zoneCode).filter(Boolean)));
  }, [locations]);

  // Xác định scopeValue hiện thời
  const currentScopeValue = useMemo(() => {
    if (scopeType === 'ZONE') return selectedZone;
    if (scopeType === 'BIN') return selectedBin;
    if (scopeType === 'SKU') return selectedSku;
    return '';
  }, [scopeType, selectedZone, selectedBin, selectedSku]);

  // 3. Tự động tính toán Scope Preview khi cấu hình thay đổi
  useEffect(() => {
    if (!warehouseId) return;
    setPreviewLoading(true);

    const timer = setTimeout(() => {
      auditService
        .previewScope({
          warehouseId,
          scopeType,
          scopeValue: currentScopeValue,
          includeEmptyBins,
        })
        .then((res) => {
          setPreview(res);
          setError('');
        })
        .catch((err) => {
          console.warn('Lỗi preview phạm vi:', err);
        })
        .finally(() => setPreviewLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [warehouseId, scopeType, currentScopeValue, includeEmptyBins]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!warehouseId || busy) return;
    setBusy(true);
    setError('');

    try {
      await onCreateSession({
        warehouseId,
        title: title.trim() || `Đợt kiểm kê kho #${warehouseId}`,
        auditType,
        scopeType,
        scopeValue: scopeType !== 'ALL' ? currentScopeValue : undefined,
        notes: notes.trim(),
        blindCount,
        requireRecount,
        includeEmptyBins,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tạo được phiên kiểm kê.');
    } finally {
      setBusy(false);
    }
  };

  const getTypeName = () => {
    switch (auditType) {
      case 'CYCLE_COUNT':
        return 'Định kỳ (Cycle Count)';
      case 'FULL_AUDIT':
        return 'Toàn bộ (Full Count)';
      case 'SPOT_CHECK':
        return 'Đột xuất (Spot Count)';
    }
  };

  const getScopeName = () => {
    switch (scopeType) {
      case 'ALL':
        return 'Toàn kho';
      case 'ZONE':
        return `Khu vực / Zone (${selectedZone || 'Zone'})`;
      case 'BIN':
        return `Vị trí / Bin (${selectedBin || 'Bin'})`;
      case 'SKU':
        return `Sản phẩm / SKU (${selectedSku || 'SKU'})`;
    }
  };

  const selectedWarehouseObj = warehouses.find((w) => w.id === warehouseId);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Tạo Đợt Kiểm Kê Mới</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập phạm vi kiểm đếm, quy tắc kiểm kê mù và cơ chế đối soát sai lệch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs sm:text-sm">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Tên đợt kiểm kê */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tên đợt kiểm kê</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Kiểm kê định kỳ tháng 11/2026"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 font-medium"
            />
          </div>

          {/* 2. Kho kiểm kê */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Kho kiểm kê</label>
            <select
              required
              value={warehouseId || ''}
              onChange={(e) => setWarehouseId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 font-semibold bg-white cursor-pointer"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Loại kiểm kê (Radio options) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">Loại kiểm kê</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'CYCLE_COUNT', label: 'Kiểm kê định kỳ (Cycle Count)' },
                { id: 'FULL_AUDIT', label: 'Kiểm kê toàn bộ (Full Count)' },
                { id: 'SPOT_CHECK', label: 'Kiểm kê đột xuất (Spot Count)' },
              ].map((t) => (
                <label
                  key={t.id}
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    auditType === t.id
                      ? 'bg-blue-50/70 border-blue-500 text-blue-900 font-semibold ring-1 ring-blue-500'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="auditType"
                    checked={auditType === t.id}
                    onChange={() => setAuditType(t.id as any)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs">{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 4. Phạm vi kiểm kê (Scope) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">Phạm vi kiểm kê</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'ALL', label: 'Toàn kho' },
                { id: 'ZONE', label: 'Theo khu vực / Zone' },
                { id: 'BIN', label: 'Theo vị trí / Bin' },
                { id: 'SKU', label: 'Theo sản phẩm / SKU' },
              ].map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    scopeType === s.id
                      ? 'bg-blue-50/70 border-blue-500 text-blue-900 font-semibold ring-1 ring-blue-500'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="scopeType"
                    checked={scopeType === s.id}
                    onChange={() => setScopeType(s.id as any)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs">{s.label}</span>
                </label>
              ))}
            </div>

            {/* Chi tiết bộ chọn phụ cho từng phạm vi */}
            {scopeType === 'ZONE' && (
              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Chọn Phân Khu (Zone) cần kiểm kê:</span>
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {availableZones.map((z) => (
                    <option key={z} value={z}>
                      {z === 'ZONE_A'
                        ? 'ZONE_A (Khu đồ uống & bánh kẹo)'
                        : z === 'ZONE_B'
                        ? 'ZONE_B (Khu thực phẩm & đồ lạnh)'
                        : z === 'ZONE_C'
                        ? 'ZONE_C (Khu hóa mỹ phẩm & hàng tiêu dùng)'
                        : z}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scopeType === 'BIN' && (
              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-blue-600" />
                  <span>Chọn Vị Trí Ô Kệ (Bin Barcode):</span>
                </label>
                <select
                  value={selectedBin}
                  onChange={(e) => setSelectedBin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.binBarcode}>
                      {loc.binBarcode} • Phân khu {loc.zoneCode} (Dãy {loc.aisle} - Kệ {loc.rack} - Tầng {loc.shelf})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scopeType === 'SKU' && (
              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-blue-600" />
                  <span>Chọn Mã Sản Phẩm (SKU) cần kiểm kê:</span>
                </label>
                <select
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.sku}>
                      {p.sku} • {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 5. Chỉ đạo / Mục đích kiểm kê */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Chỉ đạo / Mục đích kiểm kê</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Kiểm tra hàng cận hạn và hàng tồn lâu tại khu B"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900"
            />
          </div>

          {/* 6. Tùy chọn kiểm kê mù & Xác minh chênh lệch & Ô kệ trống */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={blindCount}
                onChange={(e) => setBlindCount(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <div>
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kiểm kê mù (Blind Count) – Không hiển thị số lượng hệ thống cho người đếm</span>
                </span>
                <p className="text-2xs text-slate-500">
                  Nhân viên cầm PDA chỉ thấy vị trí và mặt hàng, buộc phải đếm thực tế thay vì nhập theo số có sẵn.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none pt-2 border-t border-slate-200/80">
              <input
                type="checkbox"
                checked={requireRecount}
                onChange={(e) => setRequireRecount(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <div>
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Yêu cầu xác minh lại các dòng có chênh lệch trước khi ghi sổ cái</span>
                </span>
                <p className="text-2xs text-slate-500">
                  Kích hoạt bước đếm lại vòng 2 và đối soát độc lập theo quy tắc Separation of Duties (SoD).
                </p>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none pt-2 border-t border-slate-200/80">
              <input
                type="checkbox"
                checked={includeEmptyBins}
                onChange={(e) => setIncludeEmptyBins(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <div>
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Bao gồm cả các vị trí ô kệ đang trống (Khảo sát ô trống & hàng để nhầm)</span>
                </span>
                <p className="text-2xs text-slate-500">
                  Cho phép ghi nhận phát hiện hàng tồn đặt nhầm tại các vị trí kệ chưa khai báo tồn (Unexpected Stock).
                </p>
              </div>
            </label>
          </div>

          {/* 7. Preview card cấu hình đang chọn & Dự kiến phạm vi thời gian thực */}
          <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Cấu hình đang chọn:</span>
              </span>
              {previewLoading && (
                <span className="text-2xs text-indigo-600 font-mono animate-pulse">
                  Đang tính toán phạm vi...
                </span>
              )}
            </div>

            <div className="text-indigo-800 font-medium">
              Kho: <strong>{selectedWarehouseObj?.name || 'Kho Tổng Tân Bình'}</strong> • Loại:{' '}
              <strong>{getTypeName()}</strong> • Phạm vi: <strong>{getScopeName()}</strong>
              {blindCount && ' • Đếm mù'}
              {requireRecount && ' • Có bước xác minh chênh lệch'}
            </div>

            {preview && (
              <div className="pt-2 border-t border-indigo-200/60 grid grid-cols-4 gap-2 text-center font-mono">
                <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100">
                  <div className="text-2xs text-slate-500">Vị trí ô kệ</div>
                  <div className="text-sm font-bold text-slate-900">{preview.totalLocations} ô</div>
                </div>
                <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100">
                  <div className="text-2xs text-slate-500">Mã SKU</div>
                  <div className="text-sm font-bold text-indigo-700">{preview.totalProducts} mã</div>
                </div>
                <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100">
                  <div className="text-2xs text-slate-500">Dòng tồn kho</div>
                  <div className="text-sm font-bold text-slate-900">{preview.totalLines} dòng</div>
                </div>
                <div className="bg-white/80 p-1.5 rounded-lg border border-indigo-100">
                  <div className="text-2xs text-slate-500">Tổng tồn lý thuyết</div>
                  <div className="text-sm font-bold text-emerald-700">{preview.totalExpectedStock}</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={busy || !warehouseId || (preview !== null && preview.totalLines === 0)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              {busy ? 'Đang khởi tạo...' : 'Tạo đợt kiểm kê'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
