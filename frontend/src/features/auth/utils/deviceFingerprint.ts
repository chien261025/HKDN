/**
 * Tạo dấu vân tay thiết bị (Device Fingerprint) ổn định không đổi giữa Tab thường và Tab Ẩn Danh (Incognito).
 * Dựa trên cấu hình phần cứng: Độ phân giải màn hình, Múi giờ, Số lõi CPU, Nền tảng HĐH và User-Agent.
 */
export function getDeviceFingerprint(): string {
  try {
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
    const cores = navigator.hardwareConcurrency || 4;
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || 'Win32';
    const ua = navigator.userAgent || '';
    const raw = `${screenInfo}|${tz}|${cores}|${platform}|${ua}`;

    // Thuật toán băm FNV-1a tạo mã định danh thiết bị độc nhất
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return `DFP_${(h2 >>> 0).toString(16)}${(h1 >>> 0).toString(16)}`;
  } catch {
    return 'DFP_DEFAULT_DEVICE';
  }
}
