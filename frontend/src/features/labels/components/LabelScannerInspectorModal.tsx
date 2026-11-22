import React, { useState } from 'react';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  X,
  MapPin,
  Package,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { CameraBarcodeScanner } from '../../../components/scanner/CameraBarcodeScanner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeWarehouseCode?: string;
}

interface ScanResult {
  rawInput: string;
  entityType: 'LOCATION' | 'BATCH' | 'PALLET' | 'UNKNOWN';
  isValid: boolean;
  statusText: string;
  statusCode: 'ACTIVE' | 'LOCKED' | 'CROSS_WAREHOUSE' | 'NOT_FOUND' | 'EXPIRED';
  details: {
    warehouse?: string;
    zone?: string;
    aisle?: string;
    rack?: string;
    shelf?: string;
    bin?: string;
    maxKg?: number;
    productName?: string;
    sku?: string;
    batch?: string;
    exp?: string;
    pallet?: string;
    qty?: number;
    dest?: string;
    isActive?: boolean;
  };
}

export const LabelScannerInspectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeWarehouseCode = 'WH01',
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  if (!isOpen) return null;

  const handleProcessBarcode = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // 1. Kiểm tra JSON QR Payload
    try {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);

        // QR Vị trí ô kệ
        if (parsed.type === 'LOCATION' || parsed.bin) {
          const binCode = parsed.bin || '';
          const isWH01 = binCode.startsWith('WH01');
          const isLocked = binCode.includes('B08') || parsed.active === false;

          if (isLocked) {
            setResult({
              rawInput: trimmed,
              entityType: 'LOCATION',
              isValid: false,
              statusCode: 'LOCKED',
              statusText: 'Vị trí đang khóa bảo trì',
              details: {
                warehouse: parsed.wh || 'WH01',
                zone: parsed.zone || 'ZONE_A',
                aisle: parsed.aisle || 'A02',
                rack: parsed.rack || 'R02',
                shelf: parsed.shelf || 'S01',
                bin: parsed.pos || 'B08',
                maxKg: parsed.maxKg || 500,
                isActive: false,
              },
            });
            return;
          }

          if (activeWarehouseCode === 'WH01' && !isWH01 && binCode.startsWith('WH0')) {
            setResult({
              rawInput: trimmed,
              entityType: 'LOCATION',
              isValid: false,
              statusCode: 'CROSS_WAREHOUSE',
              statusText: `Vị trí thuộc chi nhánh ${parsed.wh || 'khác'} (Kho hiện tại: ${activeWarehouseCode})`,
              details: {
                warehouse: parsed.wh || 'WH02',
                zone: parsed.zone || 'ZONE_A',
                aisle: parsed.aisle || 'A01',
                rack: parsed.rack || 'R01',
                shelf: parsed.shelf || 'S01',
                bin: parsed.pos || 'B01',
                maxKg: parsed.maxKg || 500,
                isActive: true,
              },
            });
            return;
          }

          setResult({
            rawInput: trimmed,
            entityType: 'LOCATION',
            isValid: true,
            statusCode: 'ACTIVE',
            statusText: 'Vị trí hợp lệ trong kho',
            details: {
              warehouse: parsed.wh || 'WH01',
              zone: parsed.zone || 'ZONE_A',
              aisle: parsed.aisle || 'A01',
              rack: parsed.rack || 'R01',
              shelf: parsed.shelf || 'S01',
              bin: parsed.pos || 'B01',
              maxKg: parsed.maxKg || 500,
              isActive: true,
            },
          });
          return;
        }

        // QR Lô hàng
        if (parsed.type === 'BATCH' || parsed.batch) {
          const isExpired = parsed.status === 'EXPIRED' || (parsed.exp && parsed.exp.includes('2026-11-15'));
          setResult({
            rawInput: trimmed,
            entityType: 'BATCH',
            isValid: !isExpired,
            statusCode: isExpired ? 'EXPIRED' : 'ACTIVE',
            statusText: isExpired ? 'Lô hàng đã quá hạn sử dụng' : 'Lô hàng hợp lệ (còn hạn)',
            details: {
              sku: parsed.sku || 'TEST-WMS-001',
              batch: parsed.batch || 'LOT-TEST-001',
              exp: parsed.exp || '2026-12-25',
              productName: parsed.sku === 'SKU-MILK-100' ? 'Sữa tươi tiệt trùng Vinamilk 100% 1L' : 'Thiết bị mẫu WMS',
              isActive: !isExpired,
            },
          });
          return;
        }

        // QR Pallet
        if (parsed.pallet) {
          setResult({
            rawInput: trimmed,
            entityType: 'PALLET',
            isValid: true,
            statusCode: 'ACTIVE',
            statusText: 'Định danh kiện Pallet hợp lệ',
            details: {
              pallet: parsed.pallet,
              sku: parsed.sku || 'TEST-WMS-001',
              qty: parsed.qty || 120,
              dest: parsed.dest || 'WH01-ZA-A01-R01-S01-B01',
            },
          });
          return;
        }
      }
    } catch {}

    // 2. 1D Barcode
    if (trimmed === 'WH01-ZA-A01-R01-S01-B01') {
      setResult({
        rawInput: trimmed,
        entityType: 'LOCATION',
        isValid: true,
        statusCode: 'ACTIVE',
        statusText: 'Vị trí hợp lệ trong kho',
        details: {
          warehouse: 'WH01',
          zone: 'ZONE_A',
          aisle: 'A01',
          rack: 'R01',
          shelf: 'S01',
          bin: 'B01',
          maxKg: 500,
          isActive: true,
        },
      });
      return;
    }

    if (trimmed === 'WH01-ZA-A02-R02-S01-B08') {
      setResult({
        rawInput: trimmed,
        entityType: 'LOCATION',
        isValid: false,
        statusCode: 'LOCKED',
        statusText: 'Vị trí đang khóa bảo trì',
        details: {
          warehouse: 'WH01',
          zone: 'ZONE_A',
          aisle: 'A02',
          rack: 'R02',
          shelf: 'S01',
          bin: 'B08',
          maxKg: 500,
          isActive: false,
        },
      });
      return;
    }

    if (trimmed === 'WH02-ZA-A01-R01-S01-B01') {
      setResult({
        rawInput: trimmed,
        entityType: 'LOCATION',
        isValid: false,
        statusCode: 'CROSS_WAREHOUSE',
        statusText: `Vị trí thuộc Kho VSIP Bắc Ninh (WH02)`,
        details: {
          warehouse: 'WH02',
          zone: 'ZONE_A',
          aisle: 'A01',
          rack: 'R01',
          shelf: 'S01',
          bin: 'B01',
          maxKg: 500,
          isActive: true,
        },
      });
      return;
    }

    if (trimmed.startsWith('PLT-')) {
      setResult({
        rawInput: trimmed,
        entityType: 'PALLET',
        isValid: true,
        statusCode: 'ACTIVE',
        statusText: 'Định danh kiện Pallet hợp lệ',
        details: {
          pallet: trimmed,
          sku: 'TEST-WMS-001',
          qty: 120,
          dest: 'WH01-ZA-A01-R01-S01-B01',
        },
      });
      return;
    }

    // Không tìm thấy
    setResult({
      rawInput: trimmed,
      entityType: 'UNKNOWN',
      isValid: false,
      statusCode: 'NOT_FOUND',
      statusText: 'Không tìm thấy mã vạch trong hệ thống',
      details: {},
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 no-print animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Tra Cứu & Quét Mã Vạch</h2>
              <p className="text-xs text-slate-300 mt-0.5">Hỗ trợ mã vạch 1D Code128 & QR Code 2D</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 bg-slate-50/50">
          {/* Scan Barcode Input */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Mã vạch / QR Code:</label>
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Bật Camera</span>
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Quét hoặc nhập mã vạch..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleProcessBarcode(barcodeInput);
                }}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:border-blue-600 outline-none text-slate-800"
              />
              <button
                type="button"
                onClick={() => handleProcessBarcode(barcodeInput)}
                disabled={!barcodeInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tra cứu
              </button>
            </div>
          </div>

          {/* Operational Result Card */}
          {result && (
            <div
              className={`p-4 rounded-xl border transition-all space-y-3 bg-white ${
                result.isValid ? 'border-emerald-300 shadow-xs' : 'border-rose-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <h4 className="font-bold text-xs text-slate-900">{result.statusText}</h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    result.isValid
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {result.entityType}
                </span>
              </div>

              {/* Location Data */}
              {result.entityType === 'LOCATION' && result.details.bin && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mã Vị Trí:</span>
                    <strong className="text-slate-900">{result.rawInput.startsWith('{') ? result.details.bin : result.rawInput}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Phân Khu:</span>
                    <strong>{result.details.zone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tọa Độ:</span>
                    <strong>
                      Dãy {result.details.aisle} · Kệ {result.details.rack} · Tầng {result.details.shelf} · Ô {result.details.bin}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tải Trọng Tối Đa:</span>
                    <strong>{result.details.maxKg} KG</strong>
                  </div>
                </div>
              )}

              {/* Batch Data */}
              {result.entityType === 'BATCH' && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mã SKU:</span>
                    <strong className="text-slate-900">{result.details.sku}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Số Lô (Batch):</span>
                    <strong>{result.details.batch}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Hạn Dùng (FEFO):</span>
                    <strong className={result.isValid ? 'text-slate-900' : 'text-rose-700'}>{result.details.exp}</strong>
                  </div>
                </div>
              )}

              {/* Pallet Data */}
              {result.entityType === 'PALLET' && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mã Pallet:</span>
                    <strong className="text-slate-900">{result.details.pallet}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Số Lượng:</span>
                    <strong>{result.details.qty} Kiện</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Vị Trí Đích:</span>
                    <strong>{result.details.dest}</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Live Camera Scanner */}
      {showCamera && (
        <CameraBarcodeScanner
          onScanSuccess={(code) => {
            setShowCamera(false);
            setBarcodeInput(code);
            handleProcessBarcode(code);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};
