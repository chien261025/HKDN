/**
 * GS1 EAN-13 Check Digit & Barcode Utilities
 * Chuẩn hóa mã vạch hàng hóa EAN-13 theo tiêu chuẩn GS1 Quốc Tế
 */

/**
 * Tính số kiểm tra (Check Digit - số thứ 13) theo thuật toán Modulo 10 của GS1.
 * Vị trí lẻ (1, 3, 5, 7, 9, 11) nhân trọng số 1.
 * Vị trí chẵn (2, 4, 6, 8, 10, 12) nhân trọng số 3.
 */
export function calculateEan13CheckDigit(twelveDigits: string): number {
  if (twelveDigits.length !== 12 || !/^\d{12}$/.test(twelveDigits)) {
    throw new Error('Cần chuỗi đúng 12 chữ số để tính số kiểm tra EAN-13');
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(twelveDigits[i], 10);
    sum += i % 2 === 0 ? digit * 1 : digit * 3;
  }
  const mod = sum % 10;
  return (10 - mod) % 10;
}

/**
 * Kiểm tra xem một chuỗi mã vạch 13 số có số kiểm tra EAN-13 hợp lệ hay không.
 */
export function isValidEan13(barcode: string): boolean {
  if (!barcode || barcode.length !== 13 || !/^\d{13}$/.test(barcode)) {
    return false;
  }
  const first12 = barcode.slice(0, 12);
  const expectedCheckDigit = calculateEan13CheckDigit(first12);
  return parseInt(barcode[12], 10) === expectedCheckDigit;
}

/**
 * Sinh mã vạch nội bộ 13 số chuẩn EAN-13 với tiền tố quốc gia 893 (Việt Nam)
 * và số kiểm tra Modulo 10 toán học chính xác để thiết bị PDA / máy quét barcode nhận diện.
 *
 * Lưu ý nghiệp vụ: Đây là mã vạch tạo tự động nội bộ hệ thống.
 * Mã thương phẩm chính thức phát hành ngoài thị trường cần đăng ký cấp phép qua GS1 Việt Nam.
 */
export function generateInternalEan13(): string {
  const prefix = '893';
  let body = '';
  // Sinh ngẫu nhiên 9 chữ số tiếp theo
  for (let i = 0; i < 9; i++) {
    body += Math.floor(Math.random() * 10).toString();
  }
  const first12 = prefix + body;
  const checkDigit = calculateEan13CheckDigit(first12);
  return first12 + checkDigit.toString();
}

