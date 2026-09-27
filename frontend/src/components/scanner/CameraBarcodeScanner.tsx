import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { ScanLine, Keyboard, Smartphone, Camera, Check, Upload, AlertCircle, Volume2, VolumeX, Sparkles, SwitchCamera } from 'lucide-react';
import { playScanSuccessBeep } from './scannerAudio';

interface Props {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const CameraBarcodeScanner: React.FC<Props> = ({ onScanSuccess, onClose }) => {
  const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'CAMERA' | 'MOBILE'>('SIMULATOR');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onScanSuccessRef = useRef(onScanSuccess);
  useEffect(() => { onScanSuccessRef.current = onScanSuccess; }, [onScanSuccess]);

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  const handleTriggerSuccess = (code: string) => {
    if (soundEnabledRef.current) playScanSuccessBeep();
    onScanSuccessRef.current(code);
  };

  const demoBarcodes = [
    { code: '8934673123456', name: 'Sữa tươi Vinamilk 100% 1L', tag: 'Zone A • Hàng Khô', color: 'border-blue-300 bg-blue-50/70 text-blue-900' },
    { code: '8934868765432', name: 'Nước giặt OMO Matic 3.6kg', tag: 'Zone A • 150kg Tầng 1', color: 'border-sky-300 bg-sky-50/70 text-sky-900' },
    { code: '8806091234567', name: 'Samsung Galaxy S24 Ultra', tag: 'Zone B • Điện Tử', color: 'border-purple-300 bg-purple-50/70 text-purple-900' },
    { code: 'WH01-ZA-A01-R01-S01-B01', name: 'Khu A - Dãy A1 - Tầng Trệt S01', tag: 'Vị Trí Ô Kệ', color: 'border-emerald-300 bg-emerald-50/70 text-emerald-900' },
    { code: 'WH01-ZB-B01-R01-S01-B05', name: 'Khu B - Dãy B1 - Hàng Cận Date', tag: 'Vị Trí Ô Kệ', color: 'border-teal-300 bg-teal-50/70 text-teal-900' },
  ];

  useEffect(() => {
    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length > 0) {
        setCameras(devices);
        const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
        setSelectedCameraId(backCam ? backCam.id : devices[0].id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab !== 'CAMERA') return;
    let isMounted = true;
    let qrScanner: Html5Qrcode | null = null;
    setCameraError(null);

    const startScanner = async () => {
      try {
        qrScanner = new Html5Qrcode('camera-reader');
        const cameraConfig = selectedCameraId ? { deviceId: { exact: selectedCameraId } } : { facingMode: 'environment' };
        await qrScanner.start(
          cameraConfig,
          { fps: 20, qrbox: { width: 270, height: 160 }, aspectRatio: 1.333333 },
          (decodedText) => {
            if (isMounted) {
              if (qrScanner && qrScanner.isScanning) {
                qrScanner.stop().catch(() => {}).finally(() => handleTriggerSuccess(decodedText));
              } else {
                handleTriggerSuccess(decodedText);
              }
            }
          },
          () => {}
        );
      } catch {
        if (isMounted) {
          setCameraError('Không thể mở camera. Bạn có thể chọn file ảnh mã vạch hoặc dùng Tab Súng Laser.');
        }
      }
    };
    startScanner();

    return () => {
      isMounted = false;
      if (qrScanner && qrScanner.isScanning) qrScanner.stop().catch(() => {});
    };
  }, [activeTab, selectedCameraId]);

  const handleScanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const qrCode = new Html5Qrcode('file-scanner-temp');
      const result = await qrCode.scanFile(file, true);
      handleTriggerSuccess(result);
    } catch {
      alert('Không nhận diện được mã vạch trong ảnh này. Vui lòng chọn ảnh chụp rõ nét hơn!');
    }
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (manualCode.trim()) handleTriggerSuccess(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4">
        {/* Header HUD */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 flex items-center justify-center">
              <ScanLine className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base tracking-tight">Máy Quét Mã Vạch Barcode / QR</h3>
                <span className="text-2xs font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">Zebra TC21</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Đầu đọc laser AI • Hỗ trợ webcam, súng quét USB và điện thoại</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${soundEnabled ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
              title={soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">✕</button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs font-bold">
          <button onClick={() => setActiveTab('SIMULATOR')} className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === 'SIMULATOR' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            <Keyboard className="w-4 h-4" /><span>Súng Laser / Mẫu</span>
          </button>
          <button onClick={() => setActiveTab('CAMERA')} className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === 'CAMERA' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            <Camera className="w-4 h-4" /><span>Camera Webcam</span>
          </button>
          <button onClick={() => setActiveTab('MOBILE')} className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === 'MOBILE' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            <Smartphone className="w-4 h-4" /><span>Điện Thoại</span>
          </button>
        </div>

        {/* TAB 1: Súng quét USB & Bấm thử 1 chạm */}
        {activeTab === 'SIMULATOR' && (
          <div className="space-y-3 pt-1">
            <form onSubmit={handleManualSubmit} className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Nhập mã vạch hoặc Bắn súng USB:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Nhập mã vạch (VD: 8934673123456)..."
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-indigo-600"
                />
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer">
                  <Check className="w-4 h-4" /><span>Xác Nhận</span>
                </button>
              </div>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider block">Mã vạch trong kho (Bấm 1 chạm để thử):</span>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {demoBarcodes.map((item, idx) => (
                  <div key={idx} onClick={() => handleTriggerSuccess(item.code)} className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/50 transition-all flex items-center justify-between group cursor-pointer shadow-xs">
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">{item.name}</div>
                      <div className="text-2xs font-mono text-slate-600 mt-0.5 flex items-center gap-2">
                        <span>Mã: <strong className="text-indigo-700">{item.code}</strong></span>
                        <span className={`px-1.5 py-0.2 rounded-full font-bold border ${item.color}`}>{item.tag}</span>
                      </div>
                    </div>
                    <span className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 transition-all"><Sparkles className="w-3.5 h-3.5" /></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Camera Webcam với Tia Laser */}
        {activeTab === 'CAMERA' && (
          <div className="space-y-3 pt-1">
            {cameras.length > 1 && (
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 flex items-center gap-1.5"><SwitchCamera className="w-3.5 h-3.5 text-indigo-600" /> Đổi Camera:</span>
                <select value={selectedCameraId} onChange={(e) => setSelectedCameraId(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-medium text-xs text-slate-800">
                  {cameras.map((c) => (<option key={c.id} value={c.id}>{c.label || `Camera ${c.id.slice(0, 5)}`}</option>))}
                </select>
              </div>
            )}

            {cameraError ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /><span>Không Mở Được Camera</span>
                </div>
                <p className="text-xs text-slate-700 font-medium">{cameraError}</p>
                <div className="pt-2 border-t border-amber-200 flex flex-col gap-2">
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleScanFile} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-300 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer">
                    <Upload className="w-4 h-4" /><span>Tải File Ảnh Mã Vạch Để Giải Mã</span>
                  </button>
                  <button onClick={() => setActiveTab('SIMULATOR')} className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-center transition-colors cursor-pointer">
                    Dùng Tab "Súng Laser / Mẫu" (Bấm 1 Chạm)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative overflow-hidden rounded-2xl border-2 border-indigo-500 scanner-viewport-dark min-h-[230px] shadow-inner">
                  <div className="scanner-laser-line" />
                  <div id="camera-reader" className="w-full h-full" />
                </div>
                <div className="flex items-center justify-between text-2xs font-mono text-slate-500 px-1">
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Đang quét tia laser...</span>
                  <span>Căn chỉnh mã vạch vào giữa tia đỏ</span>
                </div>
              </div>
            )}
            <div id="file-scanner-temp" className="hidden" />
          </div>
        )}

        {/* TAB 3: Mở bằng điện thoại Wi-Fi */}
        {activeTab === 'MOBILE' && (
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2 text-xs">
            <span className="font-bold text-indigo-900 text-sm block">Cách dùng Camera thật của Điện Thoại:</span>
            <p className="text-slate-700 font-medium">1. Kết nối điện thoại và máy tính vào <strong>cùng mạng Wi-Fi</strong>.</p>
            <p className="text-slate-700 font-medium">2. Mở trình duyệt điện thoại và truy cập địa chỉ:</p>
            <div className="p-2.5 bg-white rounded-xl border border-indigo-200 text-center font-mono text-indigo-700 font-black text-sm tracking-wider select-all shadow-2xs">
              http://192.168.1.18:3000/operator
            </div>
            <p className="text-slate-500 italic font-medium">3. Đăng nhập <strong>Thủ Kho</strong> và bấm "Bật Quét Mã" để dùng camera sau lấy nét tức thì!</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all border border-slate-200 cursor-pointer">
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
