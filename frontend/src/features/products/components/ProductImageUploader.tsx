import React, { useRef, useState } from 'react';
import { Upload, X, Link2, Image as ImageIcon, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button, InputField } from '../../../components/common';

interface ProductImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const compressAndConvert = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let { width, height } = img;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP, GIF)!');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Kích thước ảnh tối đa cho phép là 10MB!');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const compressedDataUrl = await compressAndConvert(file);
      onChange(compressedDataUrl);
    } catch (err) {
      console.error('Lỗi nén ảnh:', err);
      setErrorMessage('Không thể xử lý hình ảnh được chọn!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Hình Ảnh Sản Phẩm (Tùy chọn)
        </label>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Xóa ảnh
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={disabled || isProcessing}
        className="hidden"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
        {/* Upload Button & Optional URL input */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 border-dashed border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50/60 py-2.5 text-xs text-slate-700 font-medium transition-all"
          >
            <Upload className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{isProcessing ? 'Đang xử lý ảnh...' : 'Tải ảnh từ máy tính / thiết bị'}</span>
          </Button>

          <InputField
            placeholder="Hoặc dán đường dẫn URL hình ảnh..."
            value={value.startsWith('data:') ? '' : value}
            onChange={(e) => {
              setErrorMessage(null);
              onChange(e.target.value);
            }}
            disabled={disabled}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            name="sku_custom_product_image_url"
            icon={<Link2 className="w-3.5 h-3.5 text-slate-400" />}
          />
        </div>

        {/* Live Preview Card */}
        <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200 min-h-[72px]">
          {value ? (
            <>
              <img
                src={value}
                alt="Product preview"
                className="w-14 h-14 object-cover rounded-lg border border-slate-200 shadow-sm shrink-0 bg-slate-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                }}
              />
              <div className="text-xs space-y-0.5 overflow-hidden">
                <div className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Hình ảnh sẵn sàng</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                  {value.startsWith('data:') ? 'Ảnh tải từ thiết bị (Base64 tối ưu)' : value}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5 text-xs text-slate-400 px-2 py-1">
              <ImageIcon className="w-8 h-8 text-slate-300 stroke-[1.5] shrink-0" />
              <span>Chưa có ảnh. Chọn tệp từ máy hoặc dán liên kết URL.</span>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  );
};

