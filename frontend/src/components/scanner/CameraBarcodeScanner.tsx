import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { ScanLine, Check, Upload, AlertCircle, Volume2, VolumeX, SwitchCamera, Barcode } from 'lucide-react';
import { playScanSuccessBeep } from './scannerAudio';

interface Props {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const CameraBarcodeScanner: React.FC<Props> = ({ onScanSuccess, onClose }) => {
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
          setCameraError('Không thể truy cập camera. Vui lòng cấp quyền camera cho trình duyệt hoặc nhập mã thủ công bên dưới.');
        }
      }
    };
    startScanner();

    return () => {
      isMounted = false;
      if (qrScanner && qrScanner.isScanning) qrScanner.stop().catch(() => {});
    };
  }, [selectedCameraId]);

  const handleScanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const qrCode = new Html5Qrcode('file-scanner-temp');
      const result = await qrCode.scanFile(file, true);
      handleTriggerSuccess(result);
    } catch {
      alert('Không nhận diện được mã vạch trong ảnh. Vui lòng chọn ảnh chụp rõ nét hơn!');
    }
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (manualCode.trim()) handleTriggerSuccess(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 flex items-center justify-center">
              <ScanLine className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight">Quét Mã Vạch (Barcode / QR)</h3>
              <p className="text-xs text-slate-500 font-medium">Chuẩn 1D Barcode (EAN, Code 128) & 2D QR Code</p>
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

        {/* Camera Selector (if multiple cameras available) */}
        {cameras.length > 1 && !cameraError && (
          <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <SwitchCamera className="w-3.5 h-3.5 text-indigo-600" /> Đổi Camera:
            </span>
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-medium text-xs text-slate-800"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Camera ${c.id.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Camera Viewfinder */}
        {cameraError ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Không Thể Bật Camera</span>
            </div>
            <p className="text-xs text-slate-700 font-medium">{cameraError}</p>
            <div className="pt-2 border-t border-amber-200 flex flex-col gap-2">
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleScanFile} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-300 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Tải File Ảnh Mã Vạch Để Nhận Diện</span>
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
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Đang quét...
              </span>
              <span>Căn chỉnh mã vạch vào giữa khung đỏ</span>
            </div>
          </div>
        )}
        <div id="file-scanner-temp" className="hidden" />

        {/* Manual Barcode / Keystroke Fallback Entry */}
        <form onSubmit={handleManualSubmit} className="space-y-1.5 pt-1">
          <label className="block text-xs font-bold text-slate-700">
            Nhập mã vạch thủ công (hoặc súng quét Barcode):
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus={!!cameraError}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Nhập mã vạch hoặc SKU..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Xác Nhận</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
