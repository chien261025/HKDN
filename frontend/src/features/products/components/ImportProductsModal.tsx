import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  FileText,
  AlertTriangle,
  RotateCcw,
  Check,
  Building2,
} from 'lucide-react';
import { ProductItem, ProductCategory, StorageZoneReq, ProductTrackingMethod, SupplierItem } from '../types';
import { calculateEan13CheckDigit } from '../utils/barcodeUtils';

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSkus: string[];
  existingBarcodes?: string[];
  suppliers?: SupplierItem[];
  onConfirmImport: (products: Partial<ProductItem>[]) => Promise<void>;
}

interface ParsedImportRow {
  rowNumber: number;
  data: Partial<ProductItem>;
  isValid: boolean;
  errorMessages: string[];
}

function buildDeterministicEan13(seedStr: string): string {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) | 0;
  }
  const body = String(Math.abs(hash) % 1000000000).padStart(9, '0');
  const first12 = `893${body}`;
  return first12 + String(calculateEan13CheckDigit(first12));
}

export const ImportProductsModal: React.FC<ImportProductsModalProps> = ({
  isOpen,
  onClose,
  existingSkus,
  existingBarcodes = [],
  suppliers = [],
  onConfirmImport,
}) => {
  // Chỉ lấy nhà cung cấp thực thụ (SUP-*), loại bỏ khách hàng B2B (CUST-*)
  const activeSuppliers = useMemo(() => {
    const procurement = suppliers.filter(
      (s) => s.status === 'ACTIVE' && !s.code?.toUpperCase().startsWith('CUST-')
    );
    return procurement.length > 0 ? procurement : suppliers.filter((s) => s.status === 'ACTIVE');
  }, [suppliers]);

  const [defaultSupplierId, setDefaultSupplierId] = useState<string>(activeSuppliers[0]?.id || '');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setParsedRows([]);
      setSubmitError(null);
      setIsParsing(false);
      setIsSubmitting(false);
      setIsDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeSuppliers.length > 0 && !activeSuppliers.some((s) => s.id === defaultSupplierId)) {
      setDefaultSupplierId(activeSuppliers[0].id);
    }
  }, [activeSuppliers, defaultSupplierId]);

  if (!isOpen) return null;

  // 1. Tải file mẫu CSV chuẩn sẵn sàng Import (không trùng SKU mẫu sẵn có)
  const handleDownloadTemplate = () => {
    const headers = [
      'Mã SKU (*)',
      'Tên Sản Phẩm (*)',
      'Mã Barcode GS1 (Để trống tự sinh)',
      'Đơn Vị Tính (*)',
      'Thương Hiệu',
      'Xuất Xứ',
      'Ngành Hàng (FOOD_BEVERAGE/ELECTRONICS/CHEMICAL/PHARMACEUTICAL/FASHION/GENERAL)',
      'Vùng Lưu Kho (ZONE_A/ZONE_B/ZONE_C/ZONE_D)',
      'Phương Thức Quản Lý (FEFO_BATCH/SERIAL_IMEI/STANDARD)',
      'Trọng Lượng (kg)',
      'Giá Vốn (VNĐ)',
      'Giá Bán (VNĐ)',
      'Tồn An Toàn (Min)',
      'Điểm Đặt Hàng (ROP)',
      'Tồn Tối Đa (Max)',
      'Nhà Cung Cấp',
    ];

    const sampleRows = [
      [
        'SKU-IMP-S25-01',
        'Điện thoại Samsung Galaxy S25 256GB (Mẫu Import)',
        buildDeterministicEan13('SKU-IMP-S25-01'),
        'Chiếc',
        'Samsung',
        'Việt Nam',
        'ELECTRONICS',
        'ZONE_D',
        'SERIAL_IMEI',
        '0.22',
        '21500000',
        '24990000',
        '10',
        '25',
        '100',
        'Công ty TNHH Điện tử Samsung Vina',
      ],
      [
        'SKU-IMP-MILK-02',
        'Sữa hạt hạnh nhân Vinamilk 1L (Mẫu Import)',
        buildDeterministicEan13('SKU-IMP-MILK-02'),
        'Hộp',
        'Vinamilk',
        'Việt Nam',
        'FOOD_BEVERAGE',
        'ZONE_B',
        'FEFO_BATCH',
        '1.05',
        '32000',
        '39000',
        '40',
        '100',
        '500',
        'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
      ],
      [
        'SKU-IMP-FURN-03',
        'Kệ lưu trữ đa năng 4 tầng (Mẫu Import)',
        '',
        'Cái',
        'Hòa Phát',
        'Việt Nam',
        'GENERAL',
        'ZONE_A',
        'STANDARD',
        '12.5',
        '650000',
        '890000',
        '5',
        '15',
        '80',
        'Công ty Cổ phần Nội Thất Hòa Phát',
      ],
    ];

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'WMS_Mau_Import_SanPham.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Parse CSV thô thành các dòng
  const parseCsvText = (text: string): string[][] => {
    const cleanText = text.replace(/^\uFEFF/, '');
    const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    return lines.map((line) => {
      const row: string[] = [];
      let inQuotes = false;
      let currentValue = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            currentValue += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      row.push(currentValue.trim());
      return row;
    });
  };

  // 3. Xử lý đọc tệp và kiểm tra đối soát chặt chẽ từng dòng
  const processSelectedFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setSubmitError(null);
    setIsParsing(true);

    try {
      const text = await selectedFile.text();
      const rawRows = parseCsvText(text);

      if (rawRows.length <= 1) {
        setSubmitError('File dữ liệu không có dòng sản phẩm nào ngoài dòng tiêu đề!');
        setParsedRows([]);
        setIsParsing(false);
        return;
      }

      const dataRows = rawRows.slice(1);
      const existingSkuSet = new Set(existingSkus.map((s) => s.trim().toUpperCase()));
      const existingBcSet = new Set(existingBarcodes.map((b) => b.trim()));
      const fileSkuSet = new Set<string>();
      const fileBcSet = new Set<string>();

      const parsed: ParsedImportRow[] = dataRows.map((cols, idx) => {
        const rowNumber = idx + 2;
        const errors: string[] = [];

        const sku = (cols[0] || '').trim().toUpperCase();
        const name = (cols[1] || '').trim();
        let barcode = (cols[2] || '').trim();
        if (!barcode && sku) {
          barcode = buildDeterministicEan13(sku);
        }
        const unit = (cols[3] || 'Cái').trim();
        const brand = (cols[4] || '').trim();
        const origin = (cols[5] || 'Việt Nam').trim();
        const rawCategory = (cols[6] || 'GENERAL').trim().toUpperCase();
        const rawZone = (cols[7] || 'ZONE_A').trim().toUpperCase();
        const rawTracking = (cols[8] || '').trim().toUpperCase();

        const rawWeight = cols[9] !== undefined && cols[9].trim() !== '' ? Number(cols[9]) : 1;
        const rawPurchase = cols[10] !== undefined && cols[10].trim() !== '' ? Number(cols[10]) : 0;
        const rawSelling = cols[11] !== undefined && cols[11].trim() !== '' ? Number(cols[11]) : 0;
        const rawSafety = cols[12] !== undefined && cols[12].trim() !== '' ? parseInt(cols[12], 10) : 10;
        const rawRop = cols[13] !== undefined && cols[13].trim() !== '' ? parseInt(cols[13], 10) : 25;
        const rawMax = cols[14] !== undefined && cols[14].trim() !== '' ? parseInt(cols[14], 10) : 500;
        const rawSupplier = (cols[15] || '').trim();

        const weightKg = Number.isFinite(rawWeight) ? rawWeight : -1;
        const purchasePrice = Number.isFinite(rawPurchase) ? rawPurchase : -1;
        const sellingPrice = Number.isFinite(rawSelling) ? rawSelling : -1;
        const safetyStock = Number.isFinite(rawSafety) ? rawSafety : -1;
        const reorderPoint = Number.isFinite(rawRop) ? rawRop : -1;
        const maxStock = Number.isFinite(rawMax) ? rawMax : -1;

        // Khớp nhà cung cấp chuẩn (loại trừ CUST-*)
        let matchedSupplier = activeSuppliers.find(
          (s) =>
            (rawSupplier && s.code.toUpperCase() === rawSupplier.toUpperCase()) ||
            (rawSupplier && s.name.toLowerCase().includes(rawSupplier.toLowerCase())) ||
            (rawSupplier && rawSupplier.toLowerCase().includes(s.name.toLowerCase()))
        );
        if (!matchedSupplier) {
          matchedSupplier = activeSuppliers.find((s) => s.id === defaultSupplierId) || activeSuppliers[0];
        }

        const supplierId = matchedSupplier?.id;
        const supplierName = matchedSupplier?.name || rawSupplier || 'Nhà Cung Cấp Mặc Định';
        const supplierCode = matchedSupplier?.code || 'SUP-GEN';

        // Kiểm tra SKU
        if (!sku) {
          errors.push('Thiếu mã SKU');
        } else if (existingSkuSet.has(sku)) {
          errors.push(`Trùng SKU "${sku}" trong kho`);
        } else if (fileSkuSet.has(sku)) {
          errors.push(`Trùng SKU "${sku}" trong file`);
        } else {
          fileSkuSet.add(sku);
        }

        // Kiểm tra Barcode
        if (barcode) {
          if (existingBcSet.has(barcode)) {
            errors.push(`Trùng Barcode "${barcode}" trong kho`);
          } else if (fileBcSet.has(barcode)) {
            errors.push(`Trùng Barcode "${barcode}" trong file`);
          } else {
            fileBcSet.add(barcode);
          }
        }

        // Kiểm tra Tên
        if (!name || name.length < 2) {
          errors.push('Tên SP tối thiểu 2 ký tự');
        }

        // Kiểm tra Trọng lượng, Giá & MRP
        if (weightKg <= 0) {
          errors.push('Trọng lượng phải > 0 kg');
        }
        if (purchasePrice < 0 || sellingPrice < 0) {
          errors.push('Giá vốn / Giá bán không được âm');
        }
        if (safetyStock < 0 || reorderPoint < 0 || maxStock < 1) {
          errors.push('Định mức tồn không hợp lệ');
        } else if (safetyStock > reorderPoint) {
          errors.push(`Tồn tối thiểu (${safetyStock}) > Ngưỡng đặt (${reorderPoint})`);
        } else if (reorderPoint > maxStock) {
          errors.push(`Ngưỡng đặt (${reorderPoint}) > Tồn tối đa (${maxStock})`);
        }

        // Chuẩn hóa Category
        const validCategories: ProductCategory[] = [
          'FOOD_BEVERAGE',
          'CHEMICAL',
          'ELECTRONICS',
          'PHARMACEUTICAL',
          'FASHION',
          'GENERAL',
        ];
        const category = validCategories.includes(rawCategory as ProductCategory)
          ? (rawCategory as ProductCategory)
          : 'GENERAL';

        // Chuẩn hóa Zone & Condition
        const validZones: StorageZoneReq[] = ['ZONE_A', 'ZONE_B', 'ZONE_C', 'ZONE_D'];
        const storageZone = validZones.includes(rawZone as StorageZoneReq)
          ? (rawZone as StorageZoneReq)
          : 'ZONE_A';
        const storageCondition =
          storageZone === 'ZONE_B'
            ? 'COOL'
            : storageZone === 'ZONE_C'
            ? 'COLD'
            : storageZone === 'ZONE_D'
            ? 'SECURE'
            : 'AMBIENT';

        // Chuẩn hóa Tracking Method
        const validTracking: ProductTrackingMethod[] = ['FEFO_BATCH', 'SERIAL_IMEI', 'STANDARD'];
        const trackingMethod = validTracking.includes(rawTracking as ProductTrackingMethod)
          ? (rawTracking as ProductTrackingMethod)
          : category === 'ELECTRONICS'
          ? 'SERIAL_IMEI'
          : category === 'FOOD_BEVERAGE' || category === 'PHARMACEUTICAL' || category === 'CHEMICAL'
          ? 'FEFO_BATCH'
          : 'STANDARD';

        return {
          rowNumber,
          isValid: errors.length === 0,
          errorMessages: errors,
          data: {
            sku,
            name,
            barcode,
            unit,
            brand,
            origin,
            category,
            storageZone,
            storageCondition,
            trackingMethod,
            weightKg,
            purchasePrice,
            sellingPrice,
            safetyStock,
            reorderPoint,
            maxStock,
            supplierId,
            supplierCode,
            supplierName,
            currentStock: 0,
            status: 'ACTIVE',
            isBatchManaged: trackingMethod === 'FEFO_BATCH',
            isExpiryManaged: trackingMethod === 'FEFO_BATCH',
            shelfLifeDays: trackingMethod === 'FEFO_BATCH' ? (storageZone === 'ZONE_B' ? 45 : 365) : 0,
            outboundStrategy: trackingMethod === 'FEFO_BATCH' ? 'FEFO' : 'FIFO',
            businessStatus: 'ACTIVE',
          },
        };
      });

      setParsedRows(parsed);
    } catch (err: any) {
      console.error('Lỗi phân tích file CSV:', err);
      setSubmitError('Không thể đọc file CSV. Vui lòng đảm bảo file lưu theo bảng mã UTF-8!');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processSelectedFile(selectedFile);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    if (!droppedFile.name.toLowerCase().endsWith('.csv')) {
      setSubmitError('Định dạng không hỗ trợ. Vui lòng kéo thả tệp .CSV chuẩn UTF-8.');
      return;
    }
    await processSelectedFile(droppedFile);
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const handleConfirm = async () => {
    if (validRows.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const productsToCreate = validRows.map((r) => r.data);
      await onConfirmImport(productsToCreate);
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || 'Lỗi khi nhập hàng loạt sản phẩm vào hệ thống!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFile = () => {
    setFile(null);
    setParsedRows([]);
    setSubmitError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold shadow-2xs">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Nhập Sản Phẩm Hàng Loạt (CSV)
              </h3>
              <p className="text-xs text-slate-500">
                Kiểm tra trùng mã và định mức tồn trước khi lưu danh sách sản phẩm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng cửa sổ nhập file"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step Guidance & Download Template */}
          <div className="bg-gradient-to-r from-emerald-50/70 to-blue-50/70 p-4 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Hướng Dẫn Nhập Dữ Liệu:</span>
              </div>
              <p className="text-xs text-slate-600">
                1. Tải file mẫu CSV &bull; 2. Nhập thông tin sản phẩm &bull; 3. Tải file lên để hệ thống đối soát và lưu vào kho.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-300 text-xs shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Tải File Mẫu (.CSV)</span>
            </button>
          </div>

          {/* Default Supplier Selector if suppliers available */}
          {activeSuppliers.length > 0 && !file && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Nhà cung cấp mặc định (áp dụng khi dòng trong file để trống):</span>
              </div>
              <select
                value={defaultSupplierId}
                onChange={(e) => setDefaultSupplierId(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-2xs"
              >
                {activeSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Upload Dropzone */}
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/40 scale-[1.01]'
                  : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400">
                <Upload className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {isParsing ? 'Đang phân tích dữ liệu CSV...' : 'Nhấn để chọn tệp CSV hoặc kéo thả vào đây'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Định dạng được hỗ trợ: .CSV (Mã hóa chuẩn UTF-8 có dấu tiếng Việt)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 px-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{file.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {(file.size / 1024).toFixed(1)} KB &bull; {parsedRows.length} dòng dữ liệu
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetFile}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Chọn tệp khác</span>
                </button>
              </div>

              {/* Validation Summary Badges */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-500 font-medium">Tổng số dòng nạp:</div>
                  <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">{parsedRows.length}</div>
                </div>

                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <div className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hợp lệ sẵn sàng nạp:</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-emerald-700 mt-0.5">{validRows.length} mặt hàng</div>
                </div>

                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <div className="text-rose-700 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Lỗi kiểm soát / Trùng mã:</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-rose-700 mt-0.5">{invalidRows.length} dòng</div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10 uppercase tracking-wider text-2xs">
                    <tr>
                      <th className="py-2.5 px-3 w-14 text-center">Dòng</th>
                      <th className="py-2.5 px-3">Trạng Thái Đối Soát</th>
                      <th className="py-2.5 px-3">Mã SKU &amp; Barcode</th>
                      <th className="py-2.5 px-3">Tên Sản Phẩm</th>
                      <th className="py-2.5 px-3">ĐVT / Định Mức</th>
                      <th className="py-2.5 px-3">Quản Lý</th>
                      <th className="py-2.5 px-3 text-right">Giá Vốn / Bán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {parsedRows.map((r) => (
                      <tr
                        key={r.rowNumber}
                        className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50/60'}
                      >
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">{r.rowNumber}</td>
                        <td className="py-2.5 px-3">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3" /> Hợp lệ
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-50 text-rose-700 border border-rose-200"
                                title={r.errorMessages.join('; ')}
                              >
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>{r.errorMessages[0]}</span>
                              </span>
                              {r.errorMessages.length > 1 && (
                                <div className="text-[10px] text-rose-600 pl-1">
                                  + {r.errorMessages.slice(1).join('; ')}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <div className="font-bold text-blue-700">{r.data.sku || '(Trống)'}</div>
                          <div className="text-[10px] text-slate-500">{r.data.barcode}</div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[190px] truncate" title={r.data.name}>
                          {r.data.name || '(Chưa nhập tên)'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          <div>{r.data.unit} ({r.data.weightKg}kg)</div>
                          <div className="text-[10px] text-slate-400">
                            {r.data.safetyStock}/{r.data.reorderPoint}/{r.data.maxStock}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              r.data.trackingMethod === 'SERIAL_IMEI'
                                ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                : r.data.trackingMethod === 'STANDARD'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}
                          >
                            {r.data.trackingMethod === 'SERIAL_IMEI'
                              ? 'Serial/IMEI'
                              : r.data.trackingMethod === 'STANDARD'
                              ? 'Tiêu Chuẩn'
                              : 'FEFO/Lô'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                          <div className="text-emerald-700 font-bold">
                            {(r.data.purchasePrice || 0).toLocaleString()} ₫
                          </div>
                          <div className="text-blue-700">
                            {(r.data.sellingPrice || 0).toLocaleString()} ₫
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {submitError && (
            <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            {validRows.length > 0
              ? `Sẵn sàng lưu ${validRows.length} sản phẩm hợp lệ.`
              : 'Chọn tệp CSV để kiểm tra.'}
          </p>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={validRows.length === 0 || isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-sm shadow-emerald-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Đang nạp dữ liệu...' : `Xác Nhận Nạp (${validRows.length} Mặt Hàng)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
