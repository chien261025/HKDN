import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Props {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

/**
 * Component quét mã Barcode / QR trực tiếp qua Camera điện thoại hoặc laptop
 */
export const CameraBarcodeScanner: React.FC<Props> = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
      },
      false
    );

    scanner.render(
      (text) => {
        scanner.clear();
        onScanSuccess(text);
      },
      (error) => {
        // Bỏ qua lỗi quét từng frame
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg text-slate-800">Quét mã vạch vị trí / SKU</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold"
          >
            ✕
          </button>
        </div>
        <div id="reader" className="overflow-hidden rounded-xl border border-slate-200" />
        <p className="text-xs text-center text-slate-500 mt-3">
          Hướng camera về phía mã vạch dán trên ô kệ hoặc tem sản phẩm
        </p>
      </div>
    </div>
  );
};
