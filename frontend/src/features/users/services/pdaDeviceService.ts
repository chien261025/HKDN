export type PdaStatus = 'APPROVED' | 'PENDING' | 'LOCKED';
export type PdaType = 'PDA_HANDHELD' | 'DESKTOP_SCANNER' | 'MOBILE_APP';

export interface PdaDevice {
  id: string;
  deviceCode: string;
  deviceName: string;
  deviceType: PdaType;
  warehouseId: string;
  warehouseName: string;
  assignedOperator: string;
  ipAddress: string;
  macAddress: string;
  status: PdaStatus;
  batteryPercent?: number;
  lastActive: string;
  registeredAt: string;
}

const PDA_DEVICES_STORAGE_KEY = 'smart_wms_authorized_pda_devices';

const SEED_PDA_DEVICES: PdaDevice[] = [
  {
    id: 'PDA-01',
    deviceCode: 'PDA-ST-01',
    deviceName: 'Honeywell ScanPal EDA52 Enterprise',
    deviceType: 'PDA_HANDHELD',
    warehouseId: 'WH04',
    warehouseName: 'Kho Trung Chuyển Sóng Thần - Bình Dương',
    assignedOperator: 'Lê Thủ Kho (@operator01)',
    ipAddress: '192.168.1.105',
    macAddress: 'F4:0F:24:1A:88:01',
    status: 'APPROVED',
    batteryPercent: 88,
    lastActive: 'Vừa xong (11:42)',
    registeredAt: '15/10/2026',
  },
  {
    id: 'PDA-02',
    deviceCode: 'PDA-ST-02',
    deviceName: 'Zebra TC21 Touch Computer Scanner',
    deviceType: 'PDA_HANDHELD',
    warehouseId: 'WH04',
    warehouseName: 'Kho Trung Chuyển Sóng Thần - Bình Dương',
    assignedOperator: 'Nguyễn Văn Bốc Xếp (@picker01)',
    ipAddress: '192.168.1.106',
    macAddress: 'BC:D0:74:9B:12:44',
    status: 'APPROVED',
    batteryPercent: 65,
    lastActive: '5 phút trước',
    registeredAt: '20/10/2026',
  },
  {
    id: 'PDA-03',
    deviceCode: 'SCAN-TABLE-01',
    deviceName: 'Đầu Đọc Để Bàn Datalogic Gryphon 4500 (Bàn Tiếp Nhận)',
    deviceType: 'DESKTOP_SCANNER',
    warehouseId: 'WH04',
    warehouseName: 'Kho Trung Chuyển Sóng Thần - Bình Dương',
    assignedOperator: 'Trần Trưởng Kho (@manager01)',
    ipAddress: '192.168.1.50',
    macAddress: '00:1B:44:11:3A:C2',
    status: 'APPROVED',
    batteryPercent: 100,
    lastActive: '12 phút trước',
    registeredAt: '01/09/2026',
  },
  {
    id: 'PDA-04',
    deviceCode: 'MOB-NEW-01',
    deviceName: 'Xiaomi Redmi Note 13 (Điện thoại quét mã nhân viên mới)',
    deviceType: 'MOBILE_APP',
    warehouseId: 'WH04',
    warehouseName: 'Kho Trung Chuyển Sóng Thần - Bình Dương',
    assignedOperator: 'Phan Văn Điền (@diendemo)',
    ipAddress: '192.168.1.189',
    macAddress: '3C:06:30:E5:8B:20',
    status: 'PENDING',
    batteryPercent: 74,
    lastActive: 'Yêu cầu duyệt lúc 11:30',
    registeredAt: '22/11/2026',
  },
  {
    id: 'PDA-05',
    deviceCode: 'PDA-TB-01',
    deviceName: 'Zebra TC26 WWAN Enterprise Scanner',
    deviceType: 'PDA_HANDHELD',
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Tân Bình - TP.HCM',
    assignedOperator: 'Nguyễn Văn Kho Tân Bình (@tb_operator)',
    ipAddress: '10.0.1.44',
    macAddress: '70:B3:D5:19:92:AA',
    status: 'APPROVED',
    batteryPercent: 92,
    lastActive: '15 phút trước',
    registeredAt: '05/10/2026',
  },
  {
    id: 'PDA-06',
    deviceCode: 'PDA-SUSPECT-99',
    deviceName: 'Thiết bị lạ truy cập bất thường (Unknown Device)',
    deviceType: 'MOBILE_APP',
    warehouseId: 'WH04',
    warehouseName: 'Kho Trung Chuyển Sóng Thần - Bình Dương',
    assignedOperator: 'Chưa xác định',
    ipAddress: '14.162.24.11',
    macAddress: 'AA:BB:CC:DD:EE:FF',
    status: 'LOCKED',
    batteryPercent: 12,
    lastActive: 'Đã khóa lúc 09:15',
    registeredAt: '21/11/2026',
  },
];

export const pdaDeviceService = {
  getAllDevices(warehouseId?: string): PdaDevice[] {
    const raw = localStorage.getItem(PDA_DEVICES_STORAGE_KEY);
    let list: PdaDevice[] = raw ? JSON.parse(raw) : SEED_PDA_DEVICES;
    if (warehouseId && warehouseId !== 'ALL') {
      return list.filter((d) => d.warehouseId === warehouseId);
    }
    return list;
  },

  approveDevice(id: string): PdaDevice {
    const list = this.getAllDevices();
    const target = list.find((d) => d.id === id);
    if (!target) throw new Error('Không tìm thấy thiết bị');
    target.status = 'APPROVED';
    target.lastActive = 'Đã phê duyệt bởi Trưởng Kho';
    localStorage.setItem(PDA_DEVICES_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('smart_wms_pda_devices_changed'));
    return target;
  },

  lockDevice(id: string): PdaDevice {
    const list = this.getAllDevices();
    const target = list.find((d) => d.id === id);
    if (!target) throw new Error('Không tìm thấy thiết bị');
    target.status = 'LOCKED';
    target.lastActive = 'Đã bị khóa quyền truy cập quét mã';
    localStorage.setItem(PDA_DEVICES_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('smart_wms_pda_devices_changed'));
    return target;
  },

  createDevice(payload: Partial<PdaDevice>): PdaDevice {
    const list = this.getAllDevices();
    const newDevice: PdaDevice = {
      id: `PDA-${Date.now().toString().slice(-4)}`,
      deviceCode: payload.deviceCode || `PDA-${Math.floor(100 + Math.random() * 900)}`,
      deviceName: payload.deviceName || 'Máy quét mã vạch cầm tay PDA',
      deviceType: payload.deviceType || 'PDA_HANDHELD',
      warehouseId: payload.warehouseId || 'WH04',
      warehouseName: payload.warehouseName || 'Kho Trung Chuyển Sóng Thần - Bình Dương',
      assignedOperator: payload.assignedOperator || 'Chưa gán',
      ipAddress: payload.ipAddress || `192.168.1.${Math.floor(50 + Math.random() * 150)}`,
      macAddress: payload.macAddress || 'F4:0F:24:XX:XX:XX',
      status: 'APPROVED',
      batteryPercent: 100,
      lastActive: 'Vừa kích hoạt',
      registeredAt: new Date().toLocaleDateString('vi-VN'),
    };

    const updated = [newDevice, ...list];
    localStorage.setItem(PDA_DEVICES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('smart_wms_pda_devices_changed'));
    return newDevice;
  },

  deleteDevice(id: string): void {
    const list = this.getAllDevices();
    const updated = list.filter((d) => d.id !== id);
    localStorage.setItem(PDA_DEVICES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('smart_wms_pda_devices_changed'));
  },
};

