import { useEffect, useRef } from 'react';

/**
 * Custom Hook lắng nghe tín hiệu quét từ máy quét Barcode cầm tay chuyên dụng (USB / Bluetooth)
 * Máy quét hoạt động giống như một bàn phím tốc độ cao, kết thúc bằng phím "Enter"
 */
export const useBarcodeReader = (onBarcodeScanned: (barcode: string) => void) => {
  const barcodeBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();

      // Nếu khoảng cách giữa 2 phím > 50ms, đây là người gõ phím bình thường -> reset buffer
      if (currentTime - lastKeyTime.current > 50) {
        barcodeBuffer.current = '';
      }
      lastKeyTime.current = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length >= 3) {
          onBarcodeScanned(barcodeBuffer.current.trim());
          barcodeBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        // Chỉ nhận các ký tự hợp lệ
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBarcodeScanned]);
};
