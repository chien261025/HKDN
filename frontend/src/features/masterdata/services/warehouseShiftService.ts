export interface WarehouseShift {
  id: string;
  code: 'CA_SANG' | 'CA_CHIEU' | 'CA_DEM';
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  icon: string;
  description: string;
}

export interface ShiftHandoverEntry {
  id: string;
  shiftCode: string;
  shiftName: string;
  warehouseId: string;
  warehouseName: string;
  leaderName: string;
  leaderRole: string;
  timestamp: string;
  inboundCompleted: number;
  outboundCompleted: number;
  openIssues: number;
  handoverNotes: string;
  pendingTasks: string;
}

export const DEFAULT_WAREHOUSE_SHIFTS: WarehouseShift[] = [
  {
    id: 'SHIFT_1',
    code: 'CA_SANG',
    name: 'Ca Sáng',
    startTime: '06:00',
    endTime: '14:00',
    color: 'emerald',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-700',
    icon: 'SunMedium',
    description: 'Tiếp nhận xe tải nhà cung cấp, kiểm đếm QC và nhập hàng đầu ngày',
  },
  {
    id: 'SHIFT_2',
    code: 'CA_CHIEU',
    name: 'Ca Chiều',
    startTime: '14:00',
    endTime: '22:00',
    color: 'amber',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-700',
    icon: 'Sun',
    description: 'Xử lý lấy hàng, đóng gói và bàn giao xe tải xuất kho',
  },
  {
    id: 'SHIFT_3',
    code: 'CA_DEM',
    name: 'Ca Đêm',
    startTime: '22:00',
    endTime: '06:00',
    color: 'indigo',
    badgeBg: 'bg-indigo-50 border-indigo-200',
    badgeText: 'text-indigo-700',
    icon: 'Moon',
    description: 'Sắp xếp điều chuyển nội bộ ô kệ, kiểm kê đối soát và dọn dẹp lối đi',
  },
];

const SHIFT_HANDOVER_STORAGE_KEY = 'smart_wms_shift_handover_logs';

const INITIAL_HANDOVER_LOGS: ShiftHandoverEntry[] = [
  {
    id: 'HO-20261122-01',
    shiftCode: 'CA_SANG',
    shiftName: 'Ca Sáng (06:00 - 14:00)',
    warehouseId: 'WH04',
    warehouseName: 'Kho Trung Chuyển Sóng Thần - Bình Dương',
    leaderName: 'Trần Trưởng Kho',
    leaderRole: 'Trưởng Kho',
    timestamp: '22/11/2026 13:45',
    inboundCompleted: 4,
    outboundCompleted: 6,
    openIssues: 0,
    handoverNotes: 'Đã hoàn tất tiếp nhận 2 xe tải Vinamilk, các pallet đã được dỡ vào khu đệm và cất kệ an toàn vào Zone B.',
    pendingTasks: 'Ca chiều lưu ý có 1 đơn xuất gấp 150 thùng sữa TH True Milk đi Đà Nẵng lúc 15:30.',
  },
  {
    id: 'HO-20261121-03',
    shiftCode: 'CA_DEM',
    shiftName: 'Ca Đêm (22:00 - 06:00)',
    warehouseId: 'WH04',
    warehouseName: 'Kho Trung Chuyển Sóng Thần - Bình Dương',
    leaderName: 'Lê Thủ Kho',
    leaderRole: 'Điều Phối Ca Đêm',
    timestamp: '22/11/2026 05:50',
    inboundCompleted: 1,
    outboundCompleted: 2,
    openIssues: 1,
    handoverNotes: 'Đã dọn dẹp mặt bằng khu đệm Staging 01. Kiểm tra nhiệt độ kho mát Zone B ổn định ở mức 4°C.',
    pendingTasks: 'Xe nâng số 02 báo pin yếu, đã cắm sạc tại trạm kỹ thuật A3.',
  },
];

export const warehouseShiftService = {
  /**
   * Tự động xác định ca làm việc hiện tại theo giờ đồng hồ máy chủ/hệ thống
   */
  getCurrentShift(): WarehouseShift {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 6 && hours < 14) {
      return DEFAULT_WAREHOUSE_SHIFTS[0]; // Ca Sáng
    } else if (hours >= 14 && hours < 22) {
      return DEFAULT_WAREHOUSE_SHIFTS[1]; // Ca Chiều
    } else {
      return DEFAULT_WAREHOUSE_SHIFTS[2]; // Ca Đêm
    }
  },

  getAllShifts(): WarehouseShift[] {
    return DEFAULT_WAREHOUSE_SHIFTS;
  },

  getHandoverLogs(warehouseId?: string): ShiftHandoverEntry[] {
    const raw = localStorage.getItem(SHIFT_HANDOVER_STORAGE_KEY);
    let list: ShiftHandoverEntry[] = raw ? JSON.parse(raw) : INITIAL_HANDOVER_LOGS;
    if (warehouseId && warehouseId !== 'ALL') {
      return list.filter((item) => item.warehouseId === warehouseId);
    }
    return list;
  },

  saveHandoverEntry(entry: Omit<ShiftHandoverEntry, 'id' | 'timestamp'>): ShiftHandoverEntry {
    const list = this.getHandoverLogs();
    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    const newEntry: ShiftHandoverEntry = {
      ...entry,
      id: `HO-${Date.now().toString().slice(-8)}`,
      timestamp: `${dateStr} ${timeStr}`,
    };

    const updated = [newEntry, ...list];
    localStorage.setItem(SHIFT_HANDOVER_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('smart_wms_shift_handover_added'));
    return newEntry;
  },
};

