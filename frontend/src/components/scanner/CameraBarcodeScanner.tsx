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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-700 text-slate-200 space-y-4">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <ScanLine className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-white text-base">Bộ Đọc Mã Vạch Barcode / QR Code</h3>
              <p className="text-[11px] text-slate-400">Hỗ trợ thiết bị máy quét cầm tay, camera điện thoại và test trên PC</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-lg p-1">
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'SIMULATOR'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Súng Quét / Mã Mẫu</span>
          </button>

          <button
            onClick={() => setActiveTab('CAMERA')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'CAMERA'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Webcam</span>
          </button>

          <button
            onClick={() => setActiveTab('MOBILE')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'MOBILE'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mở Bằng Điện Thoại</span>
          </button>
        </div>

        {/* TAB 1: Súng Quét Mã & Mã Mẫu (Lý tưởng nhất khi code trên PC) */}
        {activeTab === 'SIMULATOR' && (
          <div className="space-y-4 pt-1">
            {/* Giả lập súng quét USB */}
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Gõ mã hoặc Bắn súng quét USB (Chế độ HID Keyboard):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Nhập mã vạch (VD: 8934673123456)..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Xác Nhận</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                * Thực tế tại kho: Súng quét mã USB sẽ tự động điền mã vào ô này và gửi tín hiệu Enter trong 0.1 giây.
              </p>
            </form>

            {/* Các mã mẫu có sẵn để click 1 chạm */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Mã vạch mẫu trong kho (Bấm 1 chạm để quét thử):
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {demoBarcodes.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onScanSuccess(item.code)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                        Mã: <span className="font-bold">{item.code}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-colors">
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
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 space-y-2">
                <p className="font-bold">Không tìm thấy Camera trên PC:</p>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  {cameraError} Nếu máy tính của bạn không gắn webcam rời, vui lòng sử dụng tab <strong>"Súng Quét / Mã Mẫu"</strong> hoặc tab <strong>"Mở Bằng Điện Thoại"</strong>.
                </p>
              </div>
            ) : (
              <div>
                <div id="reader" className="overflow-hidden rounded-xl border border-slate-700 bg-black min-h-[220px]" />
                <p className="text-xs text-center text-slate-400 mt-2 font-mono">
                  Đưa mã vạch tem sản phẩm hoặc ô kệ trước ống kính webcam
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Mở Bằng Điện Thoại Cùng Wi-Fi */}
        {activeTab === 'MOBILE' && (
          <div className="space-y-4 pt-1 text-xs">
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <Zap className="w-4 h-4" />
                <span>Cách dùng Camera thật của Điện Thoại:</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                1. Đảm bảo điện thoại và máy tính của bạn đang kết nối <strong>cùng một mạng Wi-Fi</strong>.
              </p>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                2. Mở trình duyệt (Safari hoặc Chrome) trên điện thoại và gõ địa chỉ IP máy tính:
              </p>
              <div className="p-3 bg-black/60 rounded-xl border border-slate-700 text-center font-mono text-cyan-400 font-extrabold text-sm tracking-wider select-all">
                http://192.168.1.18:3000
              </div>
              <p className="text-slate-400 text-[10px] italic">
                3. Bấm "Mở Camera Quét Mã" trên điện thoại để dùng trực tiếp camera sau quét bất kỳ sản phẩm nào bên ngoài!
              </p>
            </div>
          </div>
        )}

        {/* Footer Close */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
