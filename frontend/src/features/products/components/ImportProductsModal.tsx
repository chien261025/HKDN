import React, { useState, useRef } from 'react';
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
  Package,
  Building2,
} from 'lucide-react';
import { ProductItem, ProductCategory, StorageZoneReq, ProductTrackingMethod, SupplierItem } from '../types';

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSkus: string[];
  suppliers?: SupplierItem[];
  onConfirmImport: (products: Partial<ProductItem>[]) => Promise<void>;
}

interface ParsedImportRow {
  rowNumber: number;
  data: Partial<ProductItem>;
  isValid: boolean;
  errorMessages: string[];
}

export const ImportProductsModal: React.FC<ImportProductsModalProps> = ({
  isOpen,
  onClose,
  existingSkus,
  suppliers = [],
  onConfirmImport,
}) => {
  const activeSuppliers = suppliers.filter((s) => s.status === 'ACTIVE');
  const [defaultSupplierId, setDefaultSupplierId] = useState<string>(activeSuppliers[0]?.id || '');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync default supplier when suppliers load
  React.useEffect(() => {
    if (activeSuppliers.length > 0 && !defaultSupplierId) {
      setDefaultSupplierId(activeSuppliers[0].id);
    }
  }, [activeSuppliers, defaultSupplierId]);

  if (!isOpen) return null;

  // 1. Tải file mẫu CSV chuẩn
  const handleDownloadTemplate = () => {
    const headers = [
      'Mã SKU (*)',
      'Tên Sản Phẩm (*)',
      'Mã Barcode GS1',
      'Đơn Vị Tính (*)',
      'Thương Hiệu',
      'Xuất Xứ',
      'Ngành Hàng (FOOD_BEVERAGE/ELECTRONICS/CHEMICAL/PHARMACEUTICAL/GENERAL)',
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
        'SKU-SAMS-S24',
        'Điện thoại Samsung Galaxy S24 Ultra 256GB',
        '8806095312345',
        'Chiếc',
        'Samsung',
        'Việt Nam',
        'ELECTRONICS',
        'ZONE_A',
        'SERIAL_IMEI',
        '0.23',
        '21500000',
        '24990000',
        '10',
        '25',
        '100',
        'Công ty TNHH Điện tử Samsung Vina',
      ],
      [
        'SKU-MILK-100',
        'Sữa tươi tiệt trùng Vinamilk 100% 1L',
        '8934673123456',
        'Hộp',
        'Vinamilk',
        'Việt Nam',
        'FOOD_BEVERAGE',
        'ZONE_A',
        'FEFO_BATCH',
        '1.05',
        '32000',
        '38000',
        '50',
        '120',
        '500',
        'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
      ],
      [
        'SKU-HEIN-330',
        'Bia Heineken Sleek lon 330ml',
        '8934822123456',
        'Thùng',
        'Heineken',
        'Việt Nam',
        'FOOD_BEVERAGE',
        'ZONE_A',
        'FEFO_BATCH',
        '8.5',
        '385000',
        '430000',
        '30',
        '80',
        '300',
        'Công ty TNHH Nhà Máy Bia Heineken Việt Nam',
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

  // 3. Xử lý tải tệp và kiểm tra đối soát
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setSubmitError(null);
    setIsParsing(true);

    try {
      const text = await selectedFile.text();
      const rawRows = parseCsvText(text);

      if (rawRows.length <= 1) {
        setSubmitError('File dữ liệu không có dòng sản phẩm nào ngoài tiêu đề!');
        setIsParsing(false);
        return;
      }

      // Bỏ dòng tiêu đề
      const dataRows = rawRows.slice(1);
      const existingSkuSet = new Set(existingSkus.map((s) => s.trim().toUpperCase()));
      const fileSkuSet = new Set<string>();

      const parsed: ParsedImportRow[] = dataRows.map((cols, idx) => {
        const rowNumber = idx + 2; // Dòng thực tế trong file Excel (bắt đầu từ dòng 2)
        const errors: string[] = [];

        const sku = (cols[0] || '').trim().toUpperCase();
        const name = (cols[1] || '').trim();
        const barcode = (cols[2] || '').trim() || (sku ? `893${Math.abs(hashString(sku)) % 10000000000}` : '');
        const unit = (cols[3] || 'Cái').trim();
        const brand = (cols[4] || '').trim();
        const origin = (cols[5] || 'Việt Nam').trim();
        const rawCategory = (cols[6] || 'GENERAL').trim().toUpperCase();
        const rawZone = (cols[7] || 'ZONE_A').trim().toUpperCase();
        const rawTracking = (cols[8] || 'FEFO_BATCH').trim().toUpperCase();
        const weightKg = parseFloat(cols[9]) || 1;
        const purchasePrice = parseFloat(cols[10]) || 0;
        const sellingPrice = parseFloat(cols[11]) || 0;
        const safetyStock = parseInt(cols[12], 10) || 10;
        const reorderPoint = parseInt(cols[13], 10) || 25;
        const maxStock = parseInt(cols[14], 10) || 500;
        const rawSupplier = (cols[15] || '').trim();

        // Khớp nhà cung cấp từ file hoặc lấy theo nhà cung cấp mặc định
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
        const supplierCode = matchedSupplier?.code || 'NCC-GEN';

        // Kiểm tra hợp lệ SKU
        if (!sku) {
          errors.push('Thiếu mã SKU');
        } else if (existingSkuSet.has(sku)) {
          errors.push(`Mã SKU "${sku}" đã tồn tại trong kho`);
        } else if (fileSkuSet.has(sku)) {
          errors.push(`Mã SKU "${sku}" bị trùng lặp trong file`);
        } else {
          fileSkuSet.add(sku);
        }

        // Kiểm tra hợp lệ Tên
        if (!name) {
          errors.push('Thiếu tên sản phẩm');
        }

        // Kiểm tra logic giá
        if (purchasePrice < 0) {
          errors.push('Giá vốn không được âm');
        }
        if (sellingPrice < 0) {
          errors.push('Giá bán không được âm');
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

        // Chuẩn hóa Zone
        const validZones: StorageZoneReq[] = ['ZONE_A', 'ZONE_B', 'ZONE_C', 'ZONE_D'];
        const storageZone = validZones.includes(rawZone as StorageZoneReq)
          ? (rawZone as StorageZoneReq)
          : 'ZONE_A';

        // Chuẩn hóa Tracking Method
        const validTracking: ProductTrackingMethod[] = ['FEFO_BATCH', 'SERIAL_IMEI', 'STANDARD'];
        const trackingMethod = validTracking.includes(rawTracking as ProductTrackingMethod)
          ? (rawTracking as ProductTrackingMethod)
          : (category === 'FOOD_BEVERAGE' || category === 'PHARMACEUTICAL' ? 'FEFO_BATCH' : 'STANDARD');

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
      setSubmitError(err.message || 'Lỗi khi nhập hàng loạt sản phẩm vào hệ thống!');
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

  function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

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
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>Nhập Dữ Liệu Sản Phẩm Hàng Loạt (Excel / CSV)</span>
                <span className="px-2 py-0.5 text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  Dữ Liệu Excel / CSV
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Tự động kiểm tra trùng mã sản phẩm, chuẩn hóa danh mục và tạo sản phẩm hàng loạt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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
                1. Tải file mẫu CSV &bull; 2. Nhập thông tin sản phẩm &bull; 3. Tải file lên để hệ thống kiểm tra và lưu vào kho.
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
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
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
                  Nhấn để chọn tệp CSV hoặc kéo thả vào đây
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
                  <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                    {parsedRows.length}
                  </div>
                </div>

                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <div className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hợp lệ sẵn sàng nạp:</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-emerald-700 mt-0.5">
                    {validRows.length} mặt hàng
                  </div>
                </div>

                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <div className="text-rose-700 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Lỗi / Trùng mã SKU:</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-rose-700 mt-0.5">
                    {invalidRows.length} dòng
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10 uppercase tracking-wider text-2xs">
                    <tr>
                      <th className="py-2.5 px-3 w-16 text-center">Dòng</th>
                      <th className="py-2.5 px-3">Trạng Thái Đối Soát</th>
                      <th className="py-2.5 px-3">Mã SKU</th>
                      <th className="py-2.5 px-3">Tên Sản Phẩm</th>
                      <th className="py-2.5 px-3">ĐVT</th>
                      <th className="py-2.5 px-3">Quản Lý</th>
                      <th className="py-2.5 px-3 text-right">Giá Vốn</th>
                      <th className="py-2.5 px-3 text-right">Giá Bán</th>
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
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-50 text-rose-700 border border-rose-200"
                              title={r.errorMessages.join(', ')}
                            >
                              <AlertCircle className="w-3 h-3" /> {r.errorMessages[0]}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{r.data.sku}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[200px] truncate" title={r.data.name}>
                          {r.data.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{r.data.unit}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                            r.data.trackingMethod === 'SERIAL_IMEI'
                              ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                              : r.data.trackingMethod === 'STANDARD'
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {r.data.trackingMethod === 'SERIAL_IMEI' ? 'Serial/IMEI' : r.data.trackingMethod === 'STANDARD' ? 'Tiêu Chuẩn' : 'FEFO/Lô'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                          {(r.data.purchasePrice || 0).toLocaleString()} ₫
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-blue-700">
                          {(r.data.sellingPrice || 0).toLocaleString()} ₫
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            {validRows.length > 0
              ? `Sẵn sàng nạp ${validRows.length} mặt hàng hợp lệ vào Master Data.`
              : 'Chọn tệp CSV để kiểm tra đối soát.'}
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

