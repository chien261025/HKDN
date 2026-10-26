import React, { useState } from 'react';
import { Package, Printer, Plus, Minus, Tag } from 'lucide-react';
import { ProductBatchLabelCard, ProductBatchLabelData } from './ProductBatchLabelCard';

const SAMPLE_PRODUCTS: ProductBatchLabelData[] = [
  {
    productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
    sku: 'SKU-MILK-100',
    barcode: '8934567890123',
    batchNumber: 'BATCH-MILK-2026A',
    manufactureDate: '2026-03-25',
    expiryDate: '2026-09-25',
    storageZone: 'ZONE_B (MÁT 2-8°C)',
    supplierName: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
  },
  {
    productName: 'Điện thoại Samsung Galaxy S24 Ultra 256GB',
    sku: 'SKU-SAMS-S24',
    barcode: '8806091234567',
    batchNumber: 'BATCH-S24-01',
    manufactureDate: '2026-01-10',
    expiryDate: '2028-01-10',
    storageZone: 'ZONE_A (KHÔ & ĐIỆN TỬ)',
    supplierName: 'Công ty TNHH Điện tử Samsung Vina',
  },
  {
    productName: 'Nước giặt OMO Matic Cửa Trên 3.6kg',
    sku: 'SKU-OMO-MATIC',
    barcode: '8931234567890',
    batchNumber: 'BATCH-OMO-01',
    manufactureDate: '2025-03-01',
    expiryDate: '2027-03-01',
    storageZone: 'ZONE_A (KHÔ & THIẾT BỊ)',
    supplierName: 'Unilever Việt Nam',
  },
];

export const BatchLabelPrintSection: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductBatchLabelData>(SAMPLE_PRODUCTS[0]);
  const [batchNumber, setBatchNumber] = useState(selectedProduct.batchNumber);
  const [expiryDate, setExpiryDate] = useState(selectedProduct.expiryDate || '');
  const [printCopies, setPrintCopies] = useState<number>(4);

  const handleProductChange = (sku: string) => {
    const prod = SAMPLE_PRODUCTS.find((p) => p.sku === sku);
    if (prod) {
      setSelectedProduct(prod);
      setBatchNumber(prod.batchNumber);
      setExpiryDate(prod.expiryDate || '');
    }
  };

  const currentLabelData: ProductBatchLabelData = {
    ...selectedProduct,
    batchNumber,
    expiryDate,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Control Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase">Cấu hình in tem lô hàng & HSD</h3>
              <p className="text-xs text-slate-500 font-medium">Tạo mã vạch và QR code chứa đầy đủ thông tin FEFO</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In {printCopies} Bản Tem Nhãn</span>
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
          <div>
            <label className="text-2xs font-bold text-slate-600 uppercase">Sản phẩm:</label>
            <select
              value={selectedProduct.sku}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
            >
              {SAMPLE_PRODUCTS.map((p) => (
                <option key={p.sku} value={p.sku}>
                  {p.productName} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-2xs font-bold text-slate-600 uppercase">Số Lô Hàng (Batch):</label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="text-2xs font-bold text-slate-600 uppercase">Hạn Dùng (FEFO Expiry):</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-600 font-semibold"
            />
          </div>

          <div>
            <label className="text-2xs font-bold text-slate-600 uppercase">Số Lượng Tem Cần In:</label>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setPrintCopies((c) => Math.max(1, c - 1))}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="flex-1 text-center font-mono font-bold text-sm text-slate-900 bg-slate-50 py-1.5 rounded-xl border border-slate-300">
                {printCopies} tem
              </span>
              <button
                type="button"
                onClick={() => setPrintCopies((c) => Math.min(24, c + 1))}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print-label-sheet">
        {Array.from({ length: printCopies }).map((_, idx) => (
          <div key={idx} className="relative">
            <span className="absolute top-1.5 right-2 z-10 text-3xs font-mono font-bold text-slate-400 no-print">
              #{idx + 1}
            </span>
            <ProductBatchLabelCard data={currentLabelData} />
          </div>
        ))}
      </div>
    </div>
  );
};
