export interface WarehouseShift {
  id: string;
  code: 'CA_SANG' | 'CA_CHIEU' | 'CA_DEM';
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
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
    description: 'Tiếp nhận xe tải nhà cung cấp, kiểm đếm và nhập hàng đầu ngày',
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
    description: 'Sắp xếp điều chuyển ô kệ và kiểm kê đối soát cuối ngày',
  },
];

export const warehouseShiftService = {
  /**
   * Tự động xác định ca làm việc hiện tại theo giờ đồng hồ hệ thống
   */
  getCurrentShift(): WarehouseShift {
    const hours = new Date().getHours();
    if (hours >= 6 && hours < 14) {
      return DEFAULT_WAREHOUSE_SHIFTS[0];
    }
    if (hours >= 14 && hours < 22) {
      return DEFAULT_WAREHOUSE_SHIFTS[1];
    }
    return DEFAULT_WAREHOUSE_SHIFTS[2];
  },

  getAllShifts(): WarehouseShift[] {
    return DEFAULT_WAREHOUSE_SHIFTS;
  },
};

