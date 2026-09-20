import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ScanLine, Keyboard, Smartphone, Camera, Check, ArrowRight, Zap, Info } from 'lucide-react';

interface Props {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const CameraBarcodeScanner: React.FC<Props> = ({ onScanSuccess, onClose }) => {
  const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'CAMERA' | 'MOBILE'>('SIMULATOR');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Danh sách mã vạch mẫu có sẵn trong database để test 1 chạm
  const demoBarcodes = [
    { code: '8934673123456', name: 'Sữa tươi Vinamilk 100% 1L', type: 'SKU Barcode', category: 'Sản phẩm' },
    { code: '8806091234567', name: 'Samsung Galaxy S24 Ultra', type: 'SKU Barcode', category: 'Sản phẩm' },
    { code: '8934868765432', name: 'Nước giặt OMO Matic 3.6kg', type: 'SKU Barcode', category: 'Sản phẩm' },
    { code: 'ZA-A01-R01-S01-B01', name: 'Khu A - Dãy 1 - Kệ 1 - Tầng Trệt', type: 'Bin Barcode', category: 'Vị trí kệ' },
    { code: 'ZB-B01-R01-S01-B05', name: 'Khu B - Dãy 1 - Kệ 1 - Hàng cận date', type: 'Bin Barcode', category: 'Vị trí kệ' },
  ];

  useEffect(() => {
    if (activeTab !== 'CAMERA') return;

    let scanner: Html5QrcodeScanner | null = null;
    try {
      scanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        false
      );

      scanner.render(
        (text) => {
          scanner?.clear();
          onScanSuccess(text);
        },
        (error) => {
          // Bỏ qua lỗi scan frame
        }
      );
    } catch (err: any) {
      setCameraError('Máy tính không phát hiện webcam hoặc chưa cấp quyền camera.');
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [activeTab, onScanSuccess]);

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ScanLine className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Bộ Đọc Mã Vạch Barcode / QR Code</h3>
              <p className="text-xs text-slate-500 font-medium">Hỗ trợ thiết bị máy quét cầm tay, camera điện thoại và test trên PC</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'SIMULATOR'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Súng Quét / Mẫu</span>
          </button>

          <button
            onClick={() => setActiveTab('CAMERA')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'CAMERA'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera Webcam</span>
          </button>

          <button
            onClick={() => setActiveTab('MOBILE')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'MOBILE'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Điện Thoại</span>
          </button>
        </div>

        {/* TAB 1: Súng Quét Mã & Mã Mẫu */}
        {activeTab === 'SIMULATOR' && (
          <div className="space-y-4 pt-1">
            {/* Giả lập súng quét USB */}
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Gõ mã hoặc Bắn súng quét USB (Chế độ HID Keyboard):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Nhập mã vạch (VD: 8934673123456)..."
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 italic font-medium">
                * Thực tế tại kho: Súng quét mã USB sẽ tự động điền mã vào ô này và gửi tín hiệu Enter trong 0.1 giây.
              </p>
            </form>

            {/* Các mã mẫu có sẵn để click 1 chạm */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Mã vạch mẫu trong kho (Bấm 1 chạm để quét thử):
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {demoBarcodes.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onScanSuccess(item.code)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {item.name}
                      </div>
                      <div className="text-xs font-mono text-slate-500 mt-0.5">
                        Mã: <span className="font-bold text-indigo-700">{item.code}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 group-hover:border-indigo-300 group-hover:text-indigo-700 transition-colors font-medium">
                      {item.category} →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Camera / Webcam */}
        {activeTab === 'CAMERA' && (
          <div className="space-y-3 pt-1">
            {cameraError ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                <p className="font-bold">Không tìm thấy Camera trên PC:</p>
                <p className="text-xs leading-relaxed text-slate-600 font-medium">
                  {cameraError} Nếu máy tính của bạn không gắn webcam rời, vui lòng sử dụng tab <strong>"Súng Quét / Mẫu"</strong> hoặc tab <strong>"Điện Thoại"</strong>.
                </p>
              </div>
            ) : (
              <div>
                <div id="reader" className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900 min-h-[220px]" />
                <p className="text-xs text-center text-slate-500 mt-2 font-mono font-medium">
                  Đưa mã vạch tem sản phẩm hoặc ô kệ trước ống kính webcam
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Mở Bằng Điện Thoại Cùng Wi-Fi */}
        {activeTab === 'MOBILE' && (
          <div className="space-y-4 pt-1 text-xs">
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>Cách dùng Camera thật của Điện Thoại:</span>
              </div>
              <p className="text-slate-700 leading-relaxed text-xs font-medium">
                1. Đảm bảo điện thoại và máy tính của bạn đang kết nối <strong>cùng một mạng Wi-Fi</strong>.
              </p>
              <p className="text-slate-700 leading-relaxed text-xs font-medium">
                2. Mở trình duyệt (Safari hoặc Chrome) trên điện thoại và gõ địa chỉ IP máy tính:
              </p>
              <div className="p-3 bg-white rounded-xl border border-indigo-200 text-center font-mono text-indigo-700 font-black text-sm tracking-wider select-all shadow-2xs">
                http://192.168.1.18:3000
              </div>
              <p className="text-slate-500 text-xs italic font-medium">
                3. Bấm "Mở Camera Quét Mã" trên điện thoại để dùng trực tiếp camera sau quét bất kỳ sản phẩm nào bên ngoài!
              </p>
            </div>
          </div>
        )}

        {/* Footer Close */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
