import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Database,
  LayoutGrid,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  Truck,
  ArrowRightLeft,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  ArrowRight,
  ChevronDown,
  Info,
  Layers,
  ArrowUpFromLine,
  ArrowDownToLine,
  UserCheck,
  X,
  ShieldCheck,
  ExternalLink,
  User,
  PackageCheck,
  Shield,
  Users,
  KeyRound,
  Activity,
  Sparkles,
  ListFilter,
} from 'lucide-react';
import { inboundService } from '../../inbound/services/inboundService';
import { InboundOrder } from '../../inbound/types';
import { inventoryService } from '../../inventory/services/inventoryService';
import { StockItem } from '../../labels/types';
import { locationService } from '../../masterdata/services/locationService';
import { BinLocation } from '../../masterdata/types';
import { outboundService } from '../../outbound/services/outboundService';
import { OutboundOrder } from '../../outbound/types';
import { productService } from '../../products/services/productService';
import { ProductItem } from '../../products/types';
import { auditService } from '../../audit/services/auditService';
import { AuditSession } from '../../audit/types';
import { warehouseService, DEFAULT_WAREHOUSES } from '../../masterdata/services/warehouseService';
import { WarehouseItem } from '../../masterdata/types';
import { authService } from '../../auth/services/authService';
import { userService } from '../../users/services/userService';
import { UserAccount, AuditLogEntry } from '../../users/types';

type Data = {
  inbound: InboundOrder[];
  outbound: OutboundOrder[];
  stock: StockItem[];
  locations: BinLocation[];
  products: ProductItem[];
  audits: AuditSession[];
};
const empty: Data = { inbound: [], outbound: [], stock: [], locations: [], products: [], audits: [] };
const nf = new Intl.NumberFormat('vi-VN');
const df = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmt = (n: number) => nf.format(n);
const date = (v?: string) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : df.format(d);
};

const labels: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  RECEIVED: 'Tại khu đệm',
  PARTIALLY_STOCKED: 'Cất một phần',
  STOCKED: 'Đã cất kệ',
  ALLOCATED: 'Đã phân bổ',
  PICKING: 'Đang lấy hàng',
  SHORT_PICKED: 'Lấy thiếu',
  DISPATCHED: 'Đã xuất kho',
  SHORT_CLOSED: 'Đóng đơn sớm',
  CLOSED_NO_STOCK: 'Đóng không có hàng',
  CANCELLED: 'Đã hủy',
};

const statusColor: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-800 border border-amber-200',
  RECEIVED: 'bg-blue-50 text-blue-800 border border-blue-200',
  STOCKED: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  ALLOCATED: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
  PICKING: 'bg-violet-50 text-violet-800 border border-violet-200',
  DISPATCHED: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
};

// Định dạng tiền tệ doanh nghiệp (Tỷ / Triệu / VND)
export const formatCurrencyVnd = (value: number): { formatted: string; unit: string } => {
  if (value >= 1_000_000_000) {
    return {
      formatted: (value / 1_000_000_000).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      unit: 'tỷ',
    };
  }
  if (value >= 1_000_000) {
    return {
      formatted: (value / 1_000_000).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      unit: 'triệu',
    };
  }
  return { formatted: fmt(value), unit: '₫' };
};

const getEstimatedUnitPrice = (sku: string = '', category: string = ''): number => {
  const s = sku.toUpperCase();
  if (s.includes('SAMS') || s.includes('APPLE') || s.includes('PHONE') || category === 'ELECTRONICS') return 12500000;
  if (s.includes('AIRPOD') || s.includes('WATCH')) return 3500000;
  if (s.includes('BEER') || s.includes('HEINEKEN')) return 420000;
  if (s.includes('OMO') || s.includes('COMFORT') || category === 'CHEMICAL') return 215000;
  if (s.includes('COCA') || s.includes('MILK') || category === 'FOOD_BEVERAGE') return 32000;
  return 150000;
};

export type PeriodFilter = 'TODAY' | '7_DAYS' | 'THIS_MONTH' | 'CUSTOM' | 'ALL';
export type TopSortMode = 'QUANTITY' | 'VALUE';

export const parseAnyDate = (rawDate?: string): Date | null => {
  if (!rawDate) return null;
  const str = String(rawDate).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str.replace(' ', 'T'));
    return isNaN(d.getTime()) ? null : d;
  }
  const match = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const d = new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, parseInt(match[1], 10));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

export const isDateInPeriod = (
  rawDate?: string,
  period: PeriodFilter = 'THIS_MONTH',
  customRange?: { start?: string; end?: string }
): boolean => {
  if (period === 'ALL') return true;
  if (!rawDate) return false;

  const d = parseAnyDate(rawDate);
  if (!d) return true;

  if (period === 'CUSTOM') {
    if (!customRange?.start && !customRange?.end) return true;
    const targetTime = d.getTime();
    if (customRange.start) {
      const start = new Date(customRange.start + 'T00:00:00');
      if (!isNaN(start.getTime()) && targetTime < start.getTime()) return false;
    }
    if (customRange.end) {
      const end = new Date(customRange.end + 'T23:59:59');
      if (!isNaN(end.getTime()) && targetTime > end.getTime()) return false;
    }
    return true;
  }

  const now = new Date();
  const targetYear = d.getFullYear();
  const targetMonth = d.getMonth();
  const targetDate = d.getDate();

  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const nowDate = now.getDate();

  if (period === 'TODAY') {
    return targetYear === nowYear && targetMonth === nowMonth && targetDate === nowDate;
  }

  if (period === '7_DAYS') {
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= -0.5 && diffDays <= 7.5;
  }

  if (period === 'THIS_MONTH') {
    return targetYear === nowYear && targetMonth === nowMonth;
  }

  return true;
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Data>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState<PeriodFilter>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [topSortMode, setTopSortMode] = useState<TopSortMode>('QUANTITY');
  const [hoveredChartBar, setHoveredChartBar] = useState<number | null>(null);

  const [mainTaskFilterTab, setMainTaskFilterTab] = useState<'ALL' | 'SO' | 'PO' | 'AUDIT'>('ALL');
  const [monthDetailModal, setMonthDetailModal] = useState<any | null>(null);
  const [showAllTasksModal, setShowAllTasksModal] = useState(false);
  const [taskFilterTab, setTaskFilterTab] = useState<'ALL' | 'SO' | 'PO' | 'AUDIT'>('ALL');
  const [taskSearchKeyword, setTaskSearchKeyword] = useState<string>('');

  // Phân quyền vai trò người dùng (Tuân thủ SoD - IT Admin không làm nghiệp vụ kho)
  const session = authService.getCurrentSession();
  const isManager = session?.role === 'ROLE_WAREHOUSE_MANAGER' || session?.role === 'ROLE_MANAGER';
  const isAdmin = session?.role === 'ROLE_ADMIN';
  const [adminViewMode, setAdminViewMode] = useState<'SYSTEM' | 'OPERATIONS'>(() => {
    return isAdmin ? 'SYSTEM' : 'OPERATIONS';
  });
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    if (isAdmin) {
      userService.getAllUsers().then(setUsersList).catch(() => []);
      userService.getAuditLogs().then(setAuditLogs).catch(() => []);
    }
  }, [isAdmin]);

  // Lắng nghe phím Escape để đóng nhanh modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMonthDetailModal(null);
        setShowActionDropdown(false);
        setShowAllTasksModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Thời gian cập nhật
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  // Bộ lọc kho toàn cục
  const [activeWarehouse, setActiveWarehouse] = useState<string>(() => {
    return localStorage.getItem('smart_wms_active_warehouse') || 'ALL';
  });
  const [warehousesList, setWarehousesList] = useState<WarehouseItem[]>(DEFAULT_WAREHOUSES);

  // Bộ chọn kho riêng cho widget Zone
  const [zoneSelectedWarehouse, setZoneSelectedWarehouse] = useState<string>('WH01');

  useEffect(() => {
    const loadWhs = async () => {
      const whs = await warehouseService.getWarehouses();
      setWarehousesList(whs);
    };
    void loadWhs();

    const onWhChanged = (e: any) => {
      if (e.detail) {
        setActiveWarehouse(e.detail);
        if (e.detail !== 'ALL') setZoneSelectedWarehouse(e.detail);
      }
    };
    const onWhUpdated = () => {
      void loadWhs();
    };

    window.addEventListener('smart_wms_warehouse_changed', onWhChanged);
    window.addEventListener('smart_wms_warehouses_updated', onWhUpdated);

    return () => {
      window.removeEventListener('smart_wms_warehouse_changed', onWhChanged);
      window.removeEventListener('smart_wms_warehouses_updated', onWhUpdated);
    };
  }, []);

  const handleWarehouseChange = (id: string) => {
    setActiveWarehouse(id);
    if (id !== 'ALL') setZoneSelectedWarehouse(id);
    warehouseService.setActiveWarehouseId(id);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        inboundRes,
        outboundRes,
        stockRes,
        locationsRes,
        productsRes,
        auditsRes,
      ] = await Promise.allSettled([
        inboundService.getInboundOrders(),
        outboundService.getOutboundOrders(),
        inventoryService.getInventoryBalances(),
        locationService.getLocations(),
        productService.getProducts(),
        auditService.getAuditSessions(),
      ]);

      const inbound = inboundRes.status === 'fulfilled' ? inboundRes.value : [];
      const outbound = outboundRes.status === 'fulfilled' ? outboundRes.value : [];
      const stock = stockRes.status === 'fulfilled' ? stockRes.value : [];
      const locations = locationsRes.status === 'fulfilled' ? locationsRes.value : [];
      const products = productsRes.status === 'fulfilled' ? productsRes.value : [];
      const audits = auditsRes.status === 'fulfilled' ? auditsRes.value : [];

      // Chỉ báo lỗi nếu 3 nguồn dữ liệu chính đều bị ngắt kết nối
      const failedCount = [inboundRes, outboundRes, stockRes, productsRes].filter(
        (r) => r.status === 'rejected'
      ).length;

      if (failedCount >= 3) {
        setError('Không thể kết nối đến máy chủ dữ liệu. Vui lòng thử lại.');
      } else {
        setData((prev) => ({
          inbound: inbound.length > 0 ? inbound : prev.inbound,
          outbound: outbound.length > 0 ? outbound : prev.outbound,
          stock: stock.length > 0 ? stock : prev.stock,
          locations: locations.length > 0 ? locations : prev.locations,
          products: products.length > 0 ? products : prev.products,
          audits: audits.length > 0 ? audits : prev.audits,
        }));
      }

      const now = new Date();
      setLastUpdatedTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    } catch {
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncData = async () => {
    await load();
    if (isAdmin) {
      userService.getAllUsers().then(setUsersList).catch(() => []);
      userService.getAuditLogs().then(setAuditLogs).catch(() => []);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const summary = useMemo(() => {
    const isAll = !activeWarehouse || activeWarehouse === 'ALL';
    const currentWhObj = warehousesList.find(
      (w) => w.code === activeWarehouse || String(w.id) === String(activeWarehouse)
    );
    const targetWhId = currentWhObj
      ? Number(currentWhObj.id)
      : activeWarehouse === 'WH01'
      ? 1
      : activeWarehouse === 'WH02'
      ? 2
      : activeWarehouse === 'WH03'
      ? 3
      : activeWarehouse === 'WH04'
      ? 4
      : Number(activeWarehouse) || undefined;

    const effectiveStock = isAll
      ? data.stock
      : data.stock.filter(
          (s: any) =>
            s.warehouseId === targetWhId ||
            String(s.warehouseId) === String(activeWarehouse) ||
            (s.warehouseCode && s.warehouseCode === activeWarehouse) ||
            (targetWhId === 1 && (!s.warehouseId || s.warehouseId === 1))
        );

    const effectiveInbound = isAll
      ? data.inbound
      : data.inbound.filter(
          (po: any) =>
            po.warehouseId === targetWhId ||
            (po.warehouseCode && po.warehouseCode === activeWarehouse) ||
            (targetWhId === 1 && !po.warehouseId)
        );

    const effectiveOutbound = isAll
      ? data.outbound
      : data.outbound.filter(
          (so: any) =>
            so.warehouseId === targetWhId ||
            (so.warehouseCode && so.warehouseCode === activeWarehouse) ||
            (targetWhId === 1 && !so.warehouseId)
        );

    const effectiveAudits = isAll
      ? data.audits
      : data.audits.filter(
          (a: any) =>
            a.warehouseId === targetWhId ||
            (a.warehouseCode && a.warehouseCode === activeWarehouse) ||
            (targetWhId === 1 && !a.warehouseId)
        );

    // Lọc theo kỳ thời gian activePeriod và khoảng ngày tùy chọn (customRange)
    const customRange = { start: customStartDate, end: customEndDate };
    const periodInbound = effectiveInbound.filter((po) =>
      isDateInPeriod(po.rawCreatedAt || po.createdAt || po.expectedDeliveryDate, activePeriod, customRange)
    );

    const periodOutbound = effectiveOutbound.filter((so) =>
      isDateInPeriod(so.rawCreatedAt || so.orderDate, activePeriod, customRange)
    );

    const totalStockUnits = effectiveStock.reduce((n, x) => n + (x.onHandQty || 0), 0);
    const branchRatio = isAll ? 1.0 : targetWhId === 1 ? 0.65 : targetWhId === 2 ? 0.18 : targetWhId === 3 ? 0.10 : 0.07;

    const calculatedStockValue = effectiveStock.reduce((sum, item) => {
      const unitPrice = getEstimatedUnitPrice(item.sku);
      return sum + (item.onHandQty || 0) * unitPrice;
    }, 0);
    const totalStockValue =
      calculatedStockValue > 0
        ? calculatedStockValue
        : isAll
        ? 2390000000
        : effectiveStock.length > 0
        ? Math.round(2390000000 * branchRatio)
        : 0;

    // Đơn xuất SO đang mở theo kỳ lọc
    const openSos = periodOutbound.filter(
      (s) => s.status === 'PENDING' || s.status === 'ALLOCATED' || s.status === 'PICKING'
    );
    const uniqueSoCodes = Array.from(new Set(openSos.map((s) => s.soCode || s.id)));
    const totalOpenSoCount = uniqueSoCodes.length;

    const soPickingCount = openSos.filter((s) => s.status === 'PICKING' || s.status === 'ALLOCATED').length;
    const soPendingCount = Math.max(0, totalOpenSoCount - soPickingCount);

    // Đơn nhập PO đang mở theo kỳ lọc
    const openPos = periodInbound.filter(
      (p) => p.status === 'PENDING' || p.status === 'RECEIVED'
    );
    const uniquePoCodes = Array.from(new Set(openPos.map((p) => p.poCode || p.id)));
    const totalOpenPoCount = uniquePoCodes.length;

    const poReceivedCount = openPos.filter((p) => p.status === 'RECEIVED').length;
    const poPendingCount = Math.max(0, totalOpenPoCount - poReceivedCount);

    // Danh sách đơn gần đây hiển thị theo kỳ lọc
    const recentInbound = (periodInbound.length > 0 ? periodInbound : effectiveInbound).slice(0, 4);
    const recentOutbound = (periodOutbound.length > 0 ? periodOutbound : effectiveOutbound).slice(0, 4);

    // Tính toán số lượng vị trí và tỷ lệ lấp đầy trực tiếp từ dữ liệu thực tế locations
    const branchLocations = isAll
      ? data.locations
      : data.locations.filter(
          (l: any) =>
            l.warehouseId === targetWhId ||
            (l.warehouseCode && l.warehouseCode === activeWarehouse) ||
            (targetWhId === 1 && (!l.warehouseId || l.warehouseId === 1))
        );

    const dynamicTotalBins = branchLocations.length;
    const dynamicOccupiedBins = branchLocations.filter((l) => l.status && l.status !== 'EMPTY').length;

    const currentBranchTotalBins = dynamicTotalBins;
    const currentBranchOccupiedBins = dynamicOccupiedBins;
    const currentBranchFillRate = currentBranchTotalBins > 0
      ? Math.round((currentBranchOccupiedBins / currentBranchTotalBins) * 100)
      : 0;

    const networkTotalBins = data.locations.length;
    const networkOccupiedBins = data.locations.filter((l) => l.status && l.status !== 'EMPTY').length;
    const networkFillRate = networkTotalBins > 0 ? Math.round((networkOccupiedBins / networkTotalBins) * 100) : 0;

    // Sức chứa Zone tính toán trực tiếp từ dữ liệu ô kệ thực địa
    const zoneALocs = branchLocations.filter((l) => l.zone === 'ZONE_A' || l.barcode?.includes('ZA'));
    const zoneBLocs = branchLocations.filter((l) => l.zone === 'ZONE_B' || l.barcode?.includes('ZB'));
    const zoneCLocs = branchLocations.filter((l) => l.zone === 'ZONE_C' || l.barcode?.includes('ZC'));

    const zoneATotal = zoneALocs.length;
    const zoneAOccupied = zoneALocs.filter((l) => l.status && l.status !== 'EMPTY').length;

    const zoneBTotal = zoneBLocs.length;
    const zoneBOccupied = zoneBLocs.filter((l) => l.status && l.status !== 'EMPTY').length;

    const zoneCTotal = zoneCLocs.length;
    const zoneCOccupied = zoneCLocs.filter((l) => l.status && l.status !== 'EMPTY').length;

    const zoneBreakdown = [
      {
        id: 'Zone A',
        name: 'Zone A',
        fullName: 'Khu A: Hàng Khô & Thiết Bị Điện Tử',
        total: zoneATotal,
        occupied: zoneAOccupied,
        desc: `${zoneAOccupied}/${zoneATotal} vị trí có hàng`,
        percent: zoneATotal > 0 ? Math.round((zoneAOccupied / zoneATotal) * 100) : 0,
        barColor: 'bg-[#2563EB]',
      },
      {
        id: 'Zone B',
        name: 'Zone B',
        fullName: 'Khu B: Kho Mát & Đồ Uống (2 - 8°C)',
        total: zoneBTotal,
        occupied: zoneBOccupied,
        desc: `${zoneBOccupied}/${zoneBTotal} vị trí có hàng`,
        percent: zoneBTotal > 0 ? Math.round((zoneBOccupied / zoneBTotal) * 100) : 0,
        barColor: 'bg-[#2563EB]',
      },
      {
        id: 'Zone C',
        name: 'Zone C',
        fullName: 'Khu C: Hóa Mỹ Phẩm & Hàng Tiêu Dùng',
        total: zoneCTotal,
        occupied: zoneCOccupied,
        desc: `${zoneCOccupied}/${zoneCTotal} vị trí có hàng`,
        percent: zoneCTotal > 0 ? Math.round((zoneCOccupied / zoneCTotal) * 100) : 0,
        barColor: 'bg-[#D97706]',
      },
    ];

    const stockByProduct = new Map<number, number>();
    effectiveStock.forEach((s) => {
      const pId = Number(s.productId);
      stockByProduct.set(pId, (stockByProduct.get(pId) || 0) + (s.onHandQty || 0));
    });

    let lowStockItems = 0;
    let zeroStockItems = 0;
    if (isAll || totalStockUnits > 0) {
      data.products.forEach((p) => {
        const pStock = stockByProduct.get(Number(p.id)) || 0;
        if (pStock === 0) zeroStockItems++;
        if (pStock <= p.safetyStock && pStock > 0) lowStockItems++;
      });
    }
    const nearExpiryLimitMs = Date.now() + 45 * 24 * 60 * 60 * 1000;
    const nearExpiryItems = effectiveStock.filter((s: any) => {
      if ((s.onHandQty || 0) <= 0) return false;
      if (s.isExpiringSoon || s.isExpired) return true;
      const exp = parseAnyDate(s.expiryDate);
      return exp ? exp.getTime() <= nearExpiryLimitMs : false;
    }).length;
    const totalAlertCount = lowStockItems + zeroStockItems + nearExpiryItems;

    // Tổng hợp danh mục công việc cần xử lý
    const actionableTasks: Array<{
      id: string;
      type: 'SO_PICKING' | 'PO_PUTAWAY' | 'AUDIT_APPROVAL';
      title: string;
      code: string;
      priority: 'URGENT' | 'HIGH' | 'NORMAL';
      priorityLabel: string;
      priorityColor: string;
      assignedTo: string;
      deadlineText: string;
      extraInfo: string;
      data: any;
    }> = [];

    // 1. Đơn xuất chờ lấy hàng
    const pendingDispatchSos = openSos.filter((s) => s.status === 'PENDING' || s.status === 'ALLOCATED');
    pendingDispatchSos.forEach((so) => {
      const isUrgent = so.priority === 'URGENT';
      const itemCount = so.items?.length || 0;
      actionableTasks.push({
        id: `so-${so.id}`,
        type: 'SO_PICKING',
        title: 'Đơn xuất chờ xử lý',
        code: so.soCode || `SO-${so.id}`,
        priority: isUrgent ? 'URGENT' : 'HIGH',
        priorityLabel: isUrgent ? 'Khẩn cấp' : so.status === 'ALLOCATED' ? 'Đã phân bổ lô' : 'Chờ xử lý',
        priorityColor: isUrgent ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200',
        assignedTo: (so as any).assignedPicker || 'Chưa phân công',
        deadlineText: `Ngày tạo: ${date(so.rawCreatedAt || so.orderDate)}${itemCount ? ` · ${itemCount} mặt hàng` : ''}`,
        extraInfo: `Khách hàng: ${so.customerName || 'Khách hàng'}`,
        data: so,
      });
    });

    // 2. Đơn nhập tại khu tiếp nhận chờ cất kệ
    const stagingPos = periodInbound.filter((p: any) => p.status === 'RECEIVED' || p.status === 'ARRIVED');
    stagingPos.forEach((po) => {
      const itemCount = po.items?.length || 0;
      actionableTasks.push({
        id: `po-${po.id}`,
        type: 'PO_PUTAWAY',
        title: 'Hàng chờ xếp lên kệ',
        code: po.poCode || `PO-${po.id}`,
        priority: 'HIGH',
        priorityLabel: 'Chờ cất kệ',
        priorityColor: 'bg-amber-50 text-amber-700 border-amber-200',
        assignedTo: (po as any).receiver || (po as any).receivedBy || 'Nhân viên kho',
        deadlineText: `Ngày tạo: ${date(po.rawCreatedAt || po.createdAt)}${itemCount ? ` · ${itemCount} mặt hàng` : ''}`,
        extraInfo: `Nhà cung cấp: ${po.supplierName || 'Đối tác'}`,
        data: po,
      });
    });

    // 3. Đợt kiểm kê chờ duyệt
    const pendingAudits = effectiveAudits.filter((a) => a.status === 'PENDING_REVIEW' || a.discrepanciesCount > 0);
    pendingAudits.forEach((aud) => {
      actionableTasks.push({
        id: `aud-${aud.id}`,
        type: 'AUDIT_APPROVAL',
        title: 'Kiểm kê chờ duyệt',
        code: aud.auditCode || `AUD-${aud.id}`,
        priority: 'NORMAL',
        priorityLabel: 'Chờ duyệt',
        priorityColor: 'bg-purple-50 text-purple-700 border-purple-200',
        assignedTo: (aud as any).createdByName || (aud as any).auditor || 'Nhân viên kiểm đếm',
        deadlineText: `Ngày lập: ${date((aud as any).createdAt)} · Chênh lệch: ${aud.discrepanciesCount || 0} mục`,
        extraInfo: `Người lập: ${(aud as any).createdByName || 'Quản lý kho'}`,
        data: aud,
      });
    });

    const urgentTasksCount = actionableTasks.filter((t) => t.priority === 'URGENT').length;
    const totalActionableTasks = actionableTasks.length;

    const currentZoneWarehouseName =
      currentWhObj?.name ||
      warehousesList.find((w) => w.code === (isAll ? zoneSelectedWarehouse : activeWarehouse))?.name ||
      'Kho Tổng Tân Bình - TP.HCM';

    return {
      isAll,
      totalOpenSoCount,
      soPickingCount,
      soPendingCount,
      totalOpenPoCount,
      poReceivedCount,
      poPendingCount,
      recentInbound,
      recentOutbound,
      effectiveInbound,
      effectiveOutbound,
      periodOutbound,
      totalStockUnits,
      totalStockValue,
      currentBranchTotalBins,
      currentBranchOccupiedBins,
      currentBranchFillRate,
      networkTotalBins,
      networkOccupiedBins,
      networkFillRate,
      zoneBreakdown,
      lowStockItems,
      zeroStockItems,
      nearExpiryItems,
      totalAlertCount,
      actionableTasks,
      urgentTasksCount,
      totalActionableTasks,
      currentZoneWarehouseName,
    };
  }, [data, activeWarehouse, zoneSelectedWarehouse, warehousesList, activePeriod, customStartDate, customEndDate]);

  const displayedTasks = useMemo(() => {
    if (mainTaskFilterTab === 'SO') return summary.actionableTasks.filter((t) => t.type === 'SO_PICKING');
    if (mainTaskFilterTab === 'PO') return summary.actionableTasks.filter((t) => t.type === 'PO_PUTAWAY');
    if (mainTaskFilterTab === 'AUDIT') return summary.actionableTasks.filter((t) => t.type === 'AUDIT_APPROVAL');
    return summary.actionableTasks;
  }, [summary.actionableTasks, mainTaskFilterTab]);

  const filteredModalTasks = useMemo(() => {
    let list = summary.actionableTasks;
    if (taskFilterTab === 'SO') list = list.filter((t) => t.type === 'SO_PICKING');
    if (taskFilterTab === 'PO') list = list.filter((t) => t.type === 'PO_PUTAWAY');
    if (taskFilterTab === 'AUDIT') list = list.filter((t) => t.type === 'AUDIT_APPROVAL');

    if (taskSearchKeyword.trim()) {
      const q = taskSearchKeyword.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.code.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.assignedTo.toLowerCase().includes(q) ||
          (t.extraInfo && t.extraInfo.toLowerCase().includes(q))
      );
    }
    return list;
  }, [summary.actionableTasks, taskFilterTab, taskSearchKeyword]);

  const productBySku = useMemo(() => {
    const map = new Map<string, ProductItem>();
    data.products.forEach((p) => {
      if (p.sku) map.set(p.sku.toUpperCase(), p);
    });
    return map;
  }, [data.products]);

  // Biểu đồ Nhập - Xuất 6 tháng gần nhất tính từ đơn hàng thực tế
  const { monthlyData, chartMaxScale } = useMemo(() => {
    const now = new Date();
    const buckets: Array<{
      year: number;
      monthIndex: number;
      month: string;
      title: string;
      inVnd: number;
      outVnd: number;
    }> = [];

    for (let offset = 5; offset >= 0; offset--) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      buckets.push({
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        month: `T${String(d.getMonth() + 1).padStart(2, '0')}`,
        title: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`,
        inVnd: 0,
        outVnd: 0,
      });
    }

    summary.effectiveInbound.forEach((po: any) => {
      if (po.status === 'CANCELLED') return;
      const d = parseAnyDate(po.rawCreatedAt || po.createdAt || po.expectedDeliveryDate);
      if (!d) return;
      const bucket = buckets.find((b) => b.year === d.getFullYear() && b.monthIndex === d.getMonth());
      if (!bucket) return;
      (po.items || []).forEach((it: any) => {
        const qty = Number(it.stockedQty || it.receivedQty || it.expectedQty || 0);
        const prod = productBySku.get(String(it.sku || '').toUpperCase());
        const price = Number(prod?.purchasePrice || prod?.sellingPrice || getEstimatedUnitPrice(it.sku, prod?.category));
        bucket.inVnd += qty * price;
      });
    });

    summary.effectiveOutbound.forEach((so: any) => {
      if (so.status === 'CANCELLED') return;
      const d = parseAnyDate(so.rawCreatedAt || so.orderDate);
      if (!d) return;
      const bucket = buckets.find((b) => b.year === d.getFullYear() && b.monthIndex === d.getMonth());
      if (!bucket) return;
      (so.items || []).forEach((it: any) => {
        const qty = Number(it.pickedQty || it.allocatedQty || it.requestedQty || 0);
        const prod = productBySku.get(String(it.sku || '').toUpperCase());
        const price = Number(prod?.sellingPrice || prod?.purchasePrice || getEstimatedUnitPrice(it.sku, prod?.category));
        bucket.outVnd += qty * price;
      });
    });

    const rows = buckets.map((b) => ({
      month: b.month,
      title: b.title,
      inValue: +(b.inVnd / 1_000_000).toFixed(1),
      outValue: +(b.outVnd / 1_000_000).toFixed(1),
      inExact: `${fmt(Math.round(b.inVnd))} ₫`,
      outExact: `${fmt(Math.round(b.outVnd))} ₫`,
    }));

    const peakMillion = rows.reduce((max, r) => Math.max(max, r.inValue, r.outValue), 0);
    const scale = Math.max(10, Math.ceil((peakMillion * 1.15) / 10) * 10);
    return { monthlyData: rows, chartMaxScale: scale };
  }, [summary.effectiveInbound, summary.effectiveOutbound, productBySku]);

  // Top sản phẩm xuất kho thực tế trong kỳ lọc
  const topProducts = useMemo(() => {
    const palette = [
      'from-emerald-500 to-green-600',
      'from-purple-500 to-indigo-600',
      'from-rose-500 to-red-600',
      'from-amber-500 to-orange-500',
      'from-blue-500 to-cyan-600',
    ];
    const aggMap = new Map<string, { name: string; sku: string; qty: number; unit: string; unitPrice: number }>();

    summary.periodOutbound.forEach((so: any) => {
      if (so.status === 'CANCELLED') return;
      (so.items || []).forEach((it: any) => {
        const sku = String(it.sku || `SP-${it.productId || '0'}`).toUpperCase();
        const qty = Number(it.pickedQty || it.allocatedQty || it.requestedQty || 0);
        if (qty <= 0) return;
        const prod = productBySku.get(sku);
        const unitPrice = Number(prod?.sellingPrice || prod?.purchasePrice || getEstimatedUnitPrice(sku, prod?.category));
        const existing = aggMap.get(sku);
        if (existing) {
          existing.qty += qty;
        } else {
          aggMap.set(sku, {
            name: prod?.name || it.productName || sku,
            sku,
            qty,
            unit: it.unit || prod?.unit || 'SP',
            unitPrice,
          });
        }
      });
    });

    const rawList = Array.from(aggMap.values());
    if (rawList.length === 0) return [];

    if (topSortMode === 'VALUE') {
      const sorted = [...rawList].sort((a, b) => b.qty * b.unitPrice - a.qty * a.unitPrice).slice(0, 5);
      const maxVal = Math.max(1, sorted[0].qty * sorted[0].unitPrice);
      return sorted.map((p, idx) => {
        const totalVal = p.qty * p.unitPrice;
        const rawPercent = (totalVal / maxVal) * 100;
        return {
          ...p,
          color: palette[idx % palette.length],
          primaryMetric: `${(totalVal / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tr.đ`,
          secondaryMetric: `${fmt(p.qty)} ${p.unit}`,
          percent: Math.round(rawPercent),
          visualPercent: Math.min(100, Math.max(5, Math.round(rawPercent))),
        };
      });
    }

    const sorted = [...rawList].sort((a, b) => b.qty - a.qty).slice(0, 5);
    const maxQty = Math.max(1, sorted[0].qty);
    return sorted.map((p, idx) => {
      const totalVal = p.qty * p.unitPrice;
      const rawPercent = (p.qty / maxQty) * 100;
      return {
        ...p,
        color: palette[idx % palette.length],
        primaryMetric: `${fmt(p.qty)} ${p.unit}`,
        secondaryMetric: `${(totalVal / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tr.đ`,
        percent: Math.round(rawPercent),
        visualPercent: Math.min(100, Math.max(5, Math.round(rawPercent))),
      };
    });
  }, [topSortMode, summary.periodOutbound, productBySku]);

  const formattedStock = formatCurrencyVnd(summary.totalStockValue);

  const adminUsersCount = usersList.filter((u) => u.role === 'ROLE_ADMIN').length;
  const managerUsersCount = usersList.filter((u) => u.role === 'ROLE_MANAGER' || u.role === 'ROLE_WAREHOUSE_MANAGER').length;
  const operatorUsersCount = usersList.filter((u) => u.role === 'ROLE_OPERATOR').length;
  const lockedUsersCount = usersList.filter((u) => u.status === 'LOCKED').length;
  const totalSystemCapacity = warehousesList.reduce((acc, w) => acc + (w.capacityPallets || 3000), 0);
  const activeWarehousesCount = warehousesList.filter((w) => w.isActive !== false).length;

  return (
    <div className="w-full space-y-4 pb-12 text-[#0F172A] transition-all">
      {/* 0. Chuyển đổi góc nhìn dành riêng cho Quản Trị Viên Tối Cao (Super Admin View Toggle) */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-2xl p-4 md:px-6 border border-slate-200/90 shadow-2xs gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-200 ring-4 ring-blue-50 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-slate-900 block">
                  Trung Tâm Quản Trị Hệ Thống & Kiểm Toán An Ninh
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Đặc Quyền Super Admin
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {adminViewMode === 'SYSTEM'
                  ? 'Góc nhìn Quản trị: Giám sát toàn bộ hạ tầng người dùng, ma trận phân quyền RBAC và cấu hình mạng lưới kho'
                  : 'Góc nhìn Vận hành (Audit): Giám sát và kiểm toán toàn bộ số liệu xuất - nhập - tồn của tất cả chi nhánh kho'}
              </span>
            </div>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setAdminViewMode('SYSTEM')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                adminViewMode === 'SYSTEM'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Quản Trị Hệ Thống</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminViewMode('OPERATIONS')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                adminViewMode === 'OPERATIONS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Giám Sát Vận Hành (Audit)</span>
            </button>
          </div>
        </div>
      )}

      {isAdmin && adminViewMode === 'SYSTEM' ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header Quản Trị Hệ Thống */}
          <header className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xs">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">
                    Tổng Quan Quản Trị & Kiểm Toán Hệ Thống
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <Shield className="w-3.5 h-3.5" />
                    Chuẩn ISO 27001 / SoD
                  </span>
                </div>
                <p className="mt-1 text-sm sm:text-[15px] text-slate-600 font-medium">
                  Kiểm soát hạ tầng nhân sự, mạng lưới kho toàn quốc, phân quyền RBAC và an ninh truy cập dữ liệu
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs sm:text-[13px]">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700">
                    <Clock className="h-4 w-4 text-slate-500" />
                    Cập nhật lúc {lastUpdatedTime}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Trạng thái máy chủ: Sẵn sàng 100%
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-semibold text-blue-800">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Truy vấn chỉ đọc an toàn
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleSyncData()}
                  disabled={loading}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-xs sm:text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Đồng bộ hệ thống</span>
                </button>
                <Link
                  to="/users?create=true"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>+ Thêm Tài Khoản</span>
                </Link>
              </div>
            </div>
          </header>

          {/* 4 Thẻ KPI Quản Trị Hệ Thống */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/users"
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Nhân Sự & Phân Quyền
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1.5">
                    {usersList.length}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {adminUsersCount} Quản trị • {managerUsersCount} Quản lý kho • {operatorUsersCount} Thủ kho
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>Quản lý danh sách nhân sự</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            <Link
              to="/warehouses"
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Mạng Lưới Chi Nhánh
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1.5">
                    {activeWarehousesCount} / {warehousesList.length}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {totalSystemCapacity.toLocaleString('vi-VN')} Pallet sức chứa toàn quốc
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>Cấu hình mạng lưới kho</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            <Link
              to="/users"
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Nhật Ký Kiểm Toán Hệ Thống
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1.5">
                    {auditLogs.length} sự kiện
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {warehousesList.filter((w) => w.trustedIps && w.trustedIps.trim()).length} / {warehousesList.length} kho cấu hình IP tin cậy
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-purple-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>Quản lý mạng kho & phiên truy cập</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            <Link
              to="/users"
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-rose-400 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Kiểm Soát An Ninh
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1.5">
                    {lockedUsersCount}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {lockedUsersCount > 0 ? `${lockedUsersCount} tài khoản bị vô hiệu hóa` : 'Hệ thống an toàn, 0 tài khoản khóa'}
                  </p>
                </div>
                <div className={`p-3 rounded-xl border transition-colors ${
                  lockedUsersCount > 0
                    ? 'bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-600 group-hover:text-white'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>Xem kiểm toán bảo mật</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>

          {/* Lối Tắt Tác Vụ Quản Trị Nhanh */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/users?create=true"
              className="p-4 bg-white hover:bg-blue-50/50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex items-center gap-3.5 shadow-2xs group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs sm:text-sm block group-hover:text-blue-600">Thêm Tài Khoản</span>
                <span className="text-[11px] text-slate-500">Cấp mới & phân quyền</span>
              </div>
            </Link>
            <Link
              to="/users"
              className="p-4 bg-white hover:bg-indigo-50/50 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all flex items-center gap-3.5 shadow-2xs group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs sm:text-sm block group-hover:text-indigo-600">Ma Trận RBAC</span>
                <span className="text-[11px] text-slate-500">Cấu hình quyền hạt nhân</span>
              </div>
            </Link>
            <Link
              to="/warehouses?create=true"
              className="p-4 bg-white hover:bg-purple-50/50 rounded-2xl border border-slate-200 hover:border-purple-300 transition-all flex items-center gap-3.5 shadow-2xs group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs sm:text-sm block group-hover:text-purple-600">Khai Báo Kho Mới</span>
                <span className="text-[11px] text-slate-500">Mở rộng chi nhánh</span>
              </div>
            </Link>
            <Link
              to="/smartquery"
              className="p-4 bg-white hover:bg-emerald-50/50 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all flex items-center gap-3.5 shadow-2xs group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs sm:text-sm block group-hover:text-emerald-600">Kiểm Toán SQL</span>
                <span className="text-[11px] text-slate-500">Truy vấn AST an toàn</span>
              </div>
            </Link>
          </div>

          {/* Hai Bảng Quản Trị Chi Tiết: Mạng Lưới Kho & Nhật Ký Kiểm Toán */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Cột Trái: Danh Sách Chi Nhánh Kho Toàn Quốc (2 Cột) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Mạng Lưới Chi Nhánh Kho & Sức Chứa Toàn Quốc ({warehousesList.length})
                  </h3>
                </div>
                <Link
                  to="/warehouses"
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                >
                  <span>Cấu hình toàn bộ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/60">
                      <th className="py-2.5 px-3">Mã & Tên Kho</th>
                      <th className="py-2.5 px-3">Loại Hình & Vùng</th>
                      <th className="py-2.5 px-3">Trưởng Kho</th>
                      <th className="py-2.5 px-3">Sức Chứa</th>
                      <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {warehousesList.map((w) => {
                      const typeLabel =
                        w.type === 'CENTRAL' ? 'Kho Trung Tâm' :
                        w.type === 'COLD_STORAGE' ? 'Kho Lạnh' :
                        w.type === 'HUB' ? 'Kho Trung Chuyển' : 'Kho Phân Phối';
                      const regionLabel =
                        w.region === 'NORTH' ? 'Miền Bắc' :
                        w.region === 'CENTRAL_VN' ? 'Miền Trung' :
                        w.region === 'MEKONG' ? 'ĐBSCL' : 'Miền Nam';
                      const active = w.isActive !== false;
                      return (
                      <tr key={w.code} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mr-2">
                            {w.code}
                          </span>
                          <span className="font-semibold text-slate-900">{w.name}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <div>{typeLabel}</div>
                          <div className="text-[11px] text-slate-400">{regionLabel}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {w.managerName || 'Chưa phân công'}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                          {(w.capacityPallets || 3000).toLocaleString('vi-VN')} Pallet
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {active ? 'Hoạt động' : 'Tạm ngưng'}
                          </span>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cột Phải: Nhật Ký Kiểm Toán & An Ninh Gần Nhất (1 Cột) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Nhật Ký Kiểm Toán An Ninh
                  </h3>
                </div>
                <Link
                  to="/users"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Xem tất cả
                </Link>
              </div>

              <div className="space-y-3">
                {auditLogs.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                    Chưa có sự kiện kiểm toán bảo mật nào được ghi nhận từ máy chủ.
                  </div>
                ) : (
                  auditLogs.slice(0, 5).map((logItem) => (
                    <div key={logItem.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span className="font-mono">
                          {logItem.createdAt ? new Date(logItem.createdAt).toLocaleString('vi-VN') : '—'}
                        </span>
                        <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          {logItem.action}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 line-clamp-2">
                        {logItem.details || `${logItem.action}: ${logItem.targetName || logItem.targetType}`}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        @{logItem.actorUsername} {logItem.ipAddress ? `• IP: ${logItem.ipAddress}` : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-200">
          {isAdmin && (
            <div className="p-3 px-4 bg-blue-50/90 border border-blue-200 rounded-xl text-blue-900 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Chế độ Giám Sát & Điều Hành Toàn Mạng Lưới: Bạn đang theo dõi dữ liệu xuất - nhập - tồn của các chi nhánh kho.</span>
              </div>
              <button
                type="button"
                onClick={() => setAdminViewMode('SYSTEM')}
                className="text-xs text-blue-700 hover:text-blue-900 underline font-bold cursor-pointer shrink-0"
              >
                Trở về Quản Trị Hệ Thống ➔
              </button>
            </div>
          )}
          {/* 1. Header: Bộ lọc và hành động nghiệp vụ */}
          <header className="rounded-xl border border-[#E2E8F0] bg-white p-6 sm:p-7 shadow-2xs">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#0F172A]">
                  Tổng quan vận hành kho
                </h1>
                <p className="mt-1 text-sm sm:text-[15px] text-slate-600 font-medium">
                  Theo dõi công việc, tồn kho và hiệu suất thời gian thực
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs sm:text-[13px]">
              <div className="relative inline-flex items-center">
                <select
                  value={activeWarehouse}
                  onChange={(e) => handleWarehouseChange(e.target.value)}
                  className="appearance-none rounded-lg border border-[#E2E8F0] bg-slate-50 hover:bg-slate-100 px-3.5 py-2 pr-8 font-semibold text-slate-800 outline-none focus:border-[#2563EB] cursor-pointer text-xs sm:text-[13px] transition-colors"
                >
                  <option value="ALL">🏢 Toàn bộ chi nhánh kho</option>
                  {warehousesList.map((w) => (
                    <option key={w.code} value={w.code}>
                      🏢 {w.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-500" />
              </div>

              <div className="relative inline-flex items-center">
                <select
                  value={activePeriod}
                  onChange={(e) => setActivePeriod(e.target.value as PeriodFilter)}
                  className="appearance-none rounded-lg border border-[#E2E8F0] bg-slate-50 hover:bg-slate-100 px-3.5 py-2 pr-8 font-semibold text-slate-800 outline-none focus:border-[#2563EB] cursor-pointer text-xs sm:text-[13px] transition-colors"
                >
                  <option value="THIS_MONTH">📅 Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</option>
                  <option value="TODAY">📅 Hôm nay</option>
                  <option value="7_DAYS">📅 7 ngày qua</option>
                  <option value="CUSTOM">📅 Tùy chọn khoảng ngày...</option>
                  <option value="ALL">📅 Toàn thời gian</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-500" />
              </div>

              {activePeriod === 'CUSTOM' && (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1.5 animate-in fade-in transition-all">
                  <span className="text-[12px] font-semibold text-blue-900">Từ:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="rounded-md border border-[#CBD5E1] bg-white px-2 py-0.5 text-xs font-medium text-slate-800 outline-none focus:border-[#2563EB]"
                  />
                  <span className="text-[12px] font-semibold text-blue-900">Đến:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="rounded-md border border-[#CBD5E1] bg-white px-2 py-0.5 text-xs font-medium text-slate-800 outline-none focus:border-[#2563EB]"
                  />
                </div>
              )}

              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-slate-50 px-3.5 py-2 font-medium text-slate-700 text-xs sm:text-[13px]">
                <Clock className="h-4 w-4 text-slate-500" />
                Cập nhật lúc {lastUpdatedTime}
              </span>

              <Link
                to="/warehouses"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 font-medium text-slate-700 hover:text-[#2563EB] hover:bg-slate-50 transition-colors text-xs sm:text-[13px]"
              >
                <Building2 className="h-4 w-4 text-slate-500" />
                <span>Chi nhánh kho</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void handleSyncData()}
              disabled={loading}
              title="Đồng bộ dữ liệu thời gian thực từ cơ sở dữ liệu WMS mà không cần tải lại trang"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 text-xs sm:text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đồng bộ</span>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowActionDropdown((prev) => !prev)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563EB] px-4.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>+ Tạo nghiệp vụ</span>
                <ChevronDown className="h-4 w-4 text-blue-200" />
              </button>

              {showActionDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowActionDropdown(false)} />
                  <div className="absolute right-0 top-full z-40 mt-1.5 w-64 rounded-xl border border-[#E2E8F0] bg-white py-2 shadow-lg">
                    <Link
                      to="/inbound?create=true"
                      onClick={() => setShowActionDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#2563EB] transition-colors"
                    >
                      <Truck className="h-4.5 w-4.5 text-emerald-600" />
                      <span>Tạo đơn nhập kho</span>
                    </Link>
                    <Link
                      to="/outbound?create=true"
                      onClick={() => setShowActionDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#2563EB] transition-colors"
                    >
                      <Package className="h-4.5 w-4.5 text-rose-600" />
                      <span>Tạo đơn xuất kho</span>
                    </Link>
                    <Link
                      to="/inventory?tab=transfer&action=transfer"
                      onClick={() => setShowActionDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#2563EB] transition-colors"
                    >
                      <ArrowRightLeft className="h-4.5 w-4.5 text-amber-600" />
                      <span>Yêu cầu điều chuyển</span>
                    </Link>
                    <div className="my-1.5 border-t border-[#E2E8F0]" />
                    <Link
                      to="/audit?create=true"
                      onClick={() => setShowActionDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#2563EB] transition-colors"
                    >
                      <ClipboardCheck className="h-4.5 w-4.5 text-blue-600" />
                      <span>Mở đợt kiểm kê</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => void load()} className="font-semibold underline cursor-pointer">
            Thử lại
          </button>
        </div>
      )}

      {/* 2. Hàng 1: 4 Thẻ KPI Điều Hành */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Đơn xuất */}
        <Link
          to="/outbound"
          className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600 group-hover:text-[#2563EB] transition-colors">
              Đơn xuất kho
            </span>
            <span className="p-2.5 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-100">
              <ArrowUpFromLine className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F172A] font-mono tabular-nums">
            {loading ? '—' : summary.totalOpenSoCount}
          </p>
          <p className="mt-1 text-[13px] text-slate-600 font-medium">
            {summary.soPendingCount} đơn chờ duyệt · {summary.soPickingCount} đơn đang lấy hàng
            {activePeriod === 'TODAY' && ' hôm nay'}
            {activePeriod === '7_DAYS' && ' 7 ngày qua'}
            {activePeriod === 'CUSTOM' && ` (${customStartDate} → ${customEndDate})`}
          </p>
        </Link>

        {/* KPI 2: Đơn nhập */}
        <Link
          to="/inbound"
          className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600 group-hover:text-emerald-700 transition-colors">
              Đơn nhập đang mở
            </span>
            <span className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <ArrowDownToLine className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-3xl sm:text-[32px] font-extrabold tracking-tight text-[#0F172A] font-mono tabular-nums">
            {loading ? '—' : summary.totalOpenPoCount}
          </p>
          <p className="mt-1 text-[13px] sm:text-sm text-slate-600 font-medium">
            {summary.poPendingCount} đơn chờ nhận hàng · {summary.poReceivedCount} đơn đã tới khu đệm
            {activePeriod === 'TODAY' && ' hôm nay'}
            {activePeriod === '7_DAYS' && ' 7 ngày qua'}
            {activePeriod === 'CUSTOM' && ` (${customStartDate} → ${customEndDate})`}
          </p>
        </Link>

        {/* KPI 3: Giá trị tồn kho */}
        <Link
          to="/inventory"
          className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-700 transition-colors">
              Giá trị tồn kho
            </span>
            <span className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Database className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F172A] font-mono tabular-nums">
            {loading ? '—' : `${formattedStock.formatted} ${formattedStock.unit}`}
          </p>
          <p className="mt-1 text-[13px] text-slate-600 font-medium">
            {summary.totalStockUnits > 0 ? `${fmt(summary.totalStockUnits)} sản phẩm trong kho` : '0 sản phẩm trong kho'}
          </p>
        </Link>

        {/* KPI 4: Tỷ lệ lấp đầy */}
        <Link
          to="/layout"
          className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-2xs hover:border-purple-400 hover:shadow-xs transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600 group-hover:text-purple-700 transition-colors">
              {summary.isAll ? 'Tỷ lệ lấp đầy toàn mạng lưới' : 'Tỷ lệ lấp đầy kho'}
            </span>
            <span className="p-2.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
              <LayoutGrid className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F172A] font-mono tabular-nums">
            {loading ? '—' : summary.isAll ? `${summary.networkFillRate}%` : `${summary.currentBranchFillRate}%`}
          </p>
          <p className="mt-1 text-[13px] text-slate-600 font-medium">
            {summary.isAll
              ? `${summary.networkOccupiedBins}/${summary.networkTotalBins} vị trí có hàng`
              : `${summary.currentBranchOccupiedBins}/${summary.currentBranchTotalBins} vị trí có hàng`}
          </p>
        </Link>
      </section>

      {/* 3. Hàng 2: [Công việc cần xử lý] & [Cảnh báo kho] */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        {/* Khối Trái (7 cols): Công việc cần xử lý */}
        <div className="lg:col-span-7 rounded-xl border border-[#E2E8F0] bg-white p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">Công việc cần xử lý</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">Nhiệm vụ cần thực hiện trong ca</p>
              </div>
              <div className="flex items-center gap-2">
                {summary.urgentTasksCount > 0 ? (
                  <span className="rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-red-600">
                    {summary.urgentTasksCount} khẩn cấp
                  </span>
                ) : summary.totalActionableTasks > 0 ? (
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
                    {summary.totalActionableTasks} việc cần làm
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Ca trực sẵn sàng
                  </span>
                )}
                {summary.totalActionableTasks > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllTasksModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 hover:text-[#2563EB] transition-colors cursor-pointer"
                  >
                    <ListFilter className="h-3.5 w-3.5 text-blue-600" />
                    <span>Xem tất cả ({summary.totalActionableTasks})</span>
                  </button>
                )}
              </div>
            </div>

            {summary.actionableTasks.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMainTaskFilterTab('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    mainTaskFilterTab === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({summary.actionableTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMainTaskFilterTab('SO')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    mainTaskFilterTab === 'SO'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>Lấy hàng SO ({summary.actionableTasks.filter((t) => t.type === 'SO_PICKING').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMainTaskFilterTab('PO')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    mainTaskFilterTab === 'PO'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>Cất kệ PO ({summary.actionableTasks.filter((t) => t.type === 'PO_PUTAWAY').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMainTaskFilterTab('AUDIT')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    mainTaskFilterTab === 'AUDIT'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>Kiểm kê ({summary.actionableTasks.filter((t) => t.type === 'AUDIT_APPROVAL').length})</span>
                </button>
              </div>
            )}

            {displayedTasks.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200 my-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Không có công việc tồn đọng cần xử lý trong mục này
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Toàn bộ đơn hàng tại <strong>{summary.currentZoneWarehouseName.split(' - ')[0]}</strong> đã được xử lý hoặc chi nhánh mới chưa phát sinh yêu cầu xuất/nhập/kiểm kê.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowActionDropdown(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Tạo đơn xuất / nhập mới</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {displayedTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 mt-0.5 ${
                          task.type === 'SO_PICKING'
                            ? task.priority === 'URGENT' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                            : task.type === 'PO_PUTAWAY'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-purple-50 text-purple-600'
                        }`}
                      >
                        {task.type === 'SO_PICKING' ? (
                          <Clock className="h-5 w-5" />
                        ) : task.type === 'PO_PUTAWAY' ? (
                          <Package className="h-5 w-5" />
                        ) : (
                          <ClipboardCheck className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm sm:text-base font-bold text-[#0F172A]">
                            {task.title} – <span className="font-mono text-blue-700">{task.code}</span>
                          </p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${task.priorityColor}`}
                          >
                            {task.priorityLabel}
                          </span>
                        </div>
                        <p className="text-[13px] sm:text-sm text-slate-600 font-medium mt-1">
                          <span>{task.deadlineText}</span>
                          {' · '}
                          <span>Phụ trách: <strong>{task.assignedTo}</strong></span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      {task.type === 'SO_PICKING' && (
                        <Link
                          to={`/outbound?soCode=${encodeURIComponent(task.code)}&action=picking`}
                          className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3.5 sm:px-4 text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all"
                        >
                          <span>Xử lý đơn xuất</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                      {task.type === 'PO_PUTAWAY' && (
                        <Link
                          to={`/inbound?poCode=${encodeURIComponent(task.code)}`}
                          className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3.5 sm:px-4 text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all"
                        >
                          <span>Xếp lên kệ</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                      {task.type === 'AUDIT_APPROVAL' && (
                        <Link
                          to={`/audit?auditCode=${encodeURIComponent(task.code)}`}
                          className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white px-3.5 sm:px-4 text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all"
                        >
                          <span>Duyệt kiểm kê</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {displayedTasks.length > 3 && (
              <div className="pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllTasksModal(true)}
                  className="text-xs sm:text-[13px] font-bold text-[#2563EB] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Xem thêm {displayedTasks.length - 3} nhiệm vụ khác trong ca →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Khối Phải (5 cols): Cảnh báo kho */}
        <div className="lg:col-span-5 rounded-xl border border-[#E2E8F0] bg-white p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">Cảnh báo kho</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">Theo dõi hạn sử dụng và định mức</p>
              </div>
              <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700">
                {summary.totalAlertCount} cảnh báo
              </span>
            </div>

            {summary.totalAlertCount === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200 my-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Không có cảnh báo rủi ro tồn kho
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
                  Toàn bộ định mức an toàn và hạn sử dụng sản phẩm tại kho đang được kiểm soát tốt.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Cảnh báo 1: Cận hạn */}
                <Link
                  to="/inventory?tab=alerts&subtab=expiring"
                  className="p-3.5 rounded-lg border border-orange-200 bg-orange-50/40 hover:bg-orange-50 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-9 w-9 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-orange-800 transition-colors">
                        Lô hàng cận hạn (&lt; 45 ngày)
                      </p>
                      <p className="text-[13px] text-slate-600 font-medium">
                        {summary.nearExpiryItems} lô hàng sắp hết hạn sử dụng
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-orange-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0">
                    Xem lô <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>

                {/* Cảnh báo 2: Dưới an toàn */}
                <Link
                  to="/inbound?create=true"
                  className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                        Tồn dưới mức an toàn
                      </p>
                      <p className="text-[13px] text-slate-600 font-medium">
                        {summary.lowStockItems} mặt hàng cần nhập bổ sung
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0">
                    Tạo PO <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>

                {/* Cảnh báo 3: Hết tồn */}
                <Link
                  to="/inventory?tab=balance"
                  className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/40 hover:bg-rose-50 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-9 w-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-rose-800 transition-colors">
                        Hết hàng tồn kho
                      </p>
                      <p className="text-[13px] text-slate-600 font-medium">
                        {summary.zeroStockItems} sản phẩm có số lượng tồn bằng 0
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-rose-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0">
                    Kiểm tra <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Hàng 3: Biểu đồ Nhập - Xuất & Sức chứa theo Zone */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 rounded-xl border border-[#E2E8F0] bg-white p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">Xu hướng nhập – xuất</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">6 tháng gần nhất</p>
              </div>
              <div className="flex items-center gap-4 text-xs sm:text-[13px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-[#10B981]" />
                  <span>Nhập kho</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-[#F43F5E]" />
                  <span>Xuất kho</span>
                </span>
              </div>
            </div>

            <div className="relative pt-8 pb-2">
              <div className="relative h-52 pl-16">
                <span className="absolute -top-6 left-0 text-xs font-bold text-slate-400">
                  (Triệu VND)
                </span>

                {[
                  { label: String(chartMaxScale), top: '0%' },
                  { label: (chartMaxScale * 0.75).toLocaleString('vi-VN', { maximumFractionDigits: 1 }), top: '25%' },
                  { label: (chartMaxScale * 0.5).toLocaleString('vi-VN', { maximumFractionDigits: 1 }), top: '50%' },
                  { label: (chartMaxScale * 0.25).toLocaleString('vi-VN', { maximumFractionDigits: 1 }), top: '75%' },
                  { label: '0', top: '100%' },
                ].map((g, i) => (
                  <div key={i} className="absolute left-0 right-0 flex items-center" style={{ top: g.top }}>
                    <span className="absolute -left-16 w-14 text-right text-xs font-mono font-semibold text-slate-400">
                      {g.label}
                    </span>
                    <div className="w-full border-b border-dashed border-slate-200" />
                  </div>
                ))}

                <div className="grid grid-cols-6 gap-3 sm:gap-6 items-end h-full relative z-10">
                  {monthlyData.map((m, idx) => {
                    const inHeight = Math.min(100, Math.round((m.inValue / chartMaxScale) * 100));
                    const outHeight = Math.min(100, Math.round((m.outValue / chartMaxScale) * 100));

                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-1.5 h-full justify-end group relative cursor-pointer"
                        onMouseEnter={() => setHoveredChartBar(idx)}
                        onMouseLeave={() => setHoveredChartBar(null)}
                        onClick={() => setMonthDetailModal(m)}
                      >
                        {hoveredChartBar === idx && (
                          <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2.5 rounded-xl shadow-2xl text-xs whitespace-nowrap z-30 pointer-events-none border border-slate-700 min-w-[170px]">
                            <p className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-200">
                              {m.title}
                            </p>
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-slate-400">Nhập kho:</span>
                              <span className="text-emerald-400 font-mono font-bold">{m.inExact}</span>
                            </div>
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-slate-400">Xuất kho:</span>
                              <span className="text-rose-400 font-mono font-bold">{m.outExact}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center h-full">
                          <div
                            style={{ height: `${inHeight}%` }}
                            className="w-1/2 max-w-[26px] bg-[#10B981] hover:bg-emerald-600 rounded-t-sm transition-all"
                          />
                          <div
                            style={{ height: `${outHeight}%` }}
                            className="w-1/2 max-w-[26px] bg-[#F43F5E] hover:bg-rose-600 rounded-t-sm transition-all"
                          />
                        </div>

                        <span className="text-xs sm:text-[13px] font-semibold text-slate-600 mt-1 whitespace-nowrap group-hover:text-[#2563EB] transition-colors">
                          {m.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs sm:text-[13px] text-slate-500">
            <span>Đơn vị tính: Triệu VNĐ</span>
            <Link to="/reports" className="font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1">
              Xem chi tiết <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Cột phải (5 cols): Sức chứa theo Zone */}
        <div className="lg:col-span-5 rounded-xl border border-[#E2E8F0] bg-white p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">Tỷ lệ ô lưu trữ theo Zone</h2>

                {summary.isAll && (
                  <select
                    value={zoneSelectedWarehouse}
                    onChange={(e) => setZoneSelectedWarehouse(e.target.value)}
                    className="rounded-lg border border-[#E2E8F0] bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-[#2563EB] cursor-pointer"
                  >
                    {warehousesList.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.shortName || w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <p className="text-[13px] text-slate-500 mt-1">
                Kho: <strong className="text-slate-800 font-semibold">{summary.currentZoneWarehouseName}</strong>
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {summary.zoneBreakdown.map((z, idx) => {
                const zoneCode = z.id === 'Zone A' ? 'ZONE_A' : z.id === 'Zone B' ? 'ZONE_B' : 'ZONE_C';
                return (
                  <Link
                    key={idx}
                    to={`/layout?zone=${zoneCode}`}
                    className="block space-y-1.5 p-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group border border-transparent hover:border-slate-200/80"
                  >
                    <div className="flex justify-between items-center text-xs sm:text-[13px]">
                      <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {z.fullName}
                      </span>
                      <span className="font-mono font-bold text-slate-900">{z.percent}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${z.barColor} rounded-full transition-all`}
                        style={{ width: `${z.percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>{z.desc}</span>
                      <span className="text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-2xs">
                        Chi tiết ô kệ →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs sm:text-[13px]">
            <span className="text-slate-600">
              Tổng kho {summary.currentZoneWarehouseName.split(' - ')[0]}:{' '}
              <strong className="text-slate-900">{summary.currentBranchFillRate}%</strong> ({summary.currentBranchOccupiedBins}/{summary.currentBranchTotalBins} vị trí)
            </span>
            <Link to="/layout" className="font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1">
              Sơ đồ mặt bằng kho <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Hàng 4: Top Mặt Hàng Xuất Kho & Đơn Hàng Gần Đây */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-xl border border-[#E2E8F0] bg-white p-6 sm:p-7 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">Top mặt hàng xuất</h2>
              <p className="text-xs text-slate-500 mt-0.5">Xếp hạng luân chuyển kho</p>
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setTopSortMode('QUANTITY')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  topSortMode === 'QUANTITY'
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Số lượng
              </button>
              <button
                onClick={() => setTopSortMode('VALUE')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  topSortMode === 'VALUE'
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Giá trị VNĐ
              </button>
            </div>
          </div>

          <div className="space-y-3.5">
            {topProducts.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200 my-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                  <Package className="h-5 w-5" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700">Chưa có phát sinh xuất hàng</p>
                <p className="text-xs text-slate-500 mt-0.5">Chi nhánh chưa ghi nhận phát sinh xuất kho trong kỳ lọc.</p>
              </div>
            ) : (
              topProducts.map((p, idx) => (
              <div key={idx} className="group/item space-y-1.5 p-2 rounded-xl hover:bg-slate-50/80 transition-all border border-transparent hover:border-slate-200/60">
                <div className="flex items-center justify-between text-xs sm:text-[13px] gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Rank Badge chuẩn Enterprise WMS */}
                    <span
                      className={`h-5 w-5 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs ${
                        idx === 0
                          ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800 ring-2 ring-slate-200'
                          : idx === 2
                          ? 'bg-amber-700/80 text-white ring-2 ring-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    <span className="font-bold text-slate-900 truncate" title={p.name}>
                      {p.name}
                    </span>

                    <span className="hidden sm:inline-block font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                      {p.sku}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-extrabold text-slate-900 text-xs sm:text-sm">
                      {p.primaryMetric}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 hidden xs:inline-block">
                      {p.secondaryMetric}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400 w-8 text-right">
                      {p.percent}%
                    </span>
                  </div>
                </div>

                {/* Thanh tiến độ trực quan đa sắc màu chuẩn Enterprise */}
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                  <div
                    className={`h-full bg-gradient-to-r ${p.color} rounded-full transition-all duration-500`}
                    style={{ width: `${p.visualPercent}%` }}
                  />
                </div>
              </div>
            )))}
          </div>

          <div className="mt-5 pt-3 border-t border-[#E2E8F0] text-center">
            <Link to="/products" className="text-xs sm:text-[13px] font-semibold text-[#2563EB] hover:underline">
              Quản lý toàn bộ {data.products.length} danh mục sản phẩm →
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="mb-3.5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#0F172A] text-sm sm:text-base flex items-center gap-1.5">
                    <Truck className="h-4.5 w-4.5 text-emerald-600" /> Đơn nhập gần đây (PO)
                  </h3>
                  <p className="text-xs text-slate-500">Đơn mua hàng mới nhất</p>
                </div>
                <Link to="/inbound" className="text-xs font-semibold text-[#2563EB] hover:underline">
                  Tất cả
                </Link>
              </div>

              <div className="space-y-2.5">
                {summary.recentInbound.map((po) => (
                  <Link
                    key={po.id}
                    to="/inbound"
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-100 hover:border-[#E2E8F0] hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate font-mono">{po.poCode}</p>
                      <p className="text-[13px] text-slate-600 truncate">{po.supplierName}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${statusColor[po.status] || 'bg-slate-100 text-slate-600'}`}>
                      {labels[po.status] || po.status}
                    </span>
                  </Link>
                ))}
                {!summary.recentInbound.length && <p className="py-4 text-center text-xs text-slate-400">Chưa có đơn nhập trong kỳ này.</p>}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="mb-3.5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#0F172A] text-sm sm:text-base flex items-center gap-1.5">
                    <Package className="h-4.5 w-4.5 text-rose-600" /> Đơn xuất gần đây (SO)
                  </h3>
                  <p className="text-xs text-slate-500">Đơn bán hàng mới nhất</p>
                </div>
                <Link to="/outbound" className="text-xs font-semibold text-[#2563EB] hover:underline">
                  Tất cả
                </Link>
              </div>

              <div className="space-y-2.5">
                {summary.recentOutbound.map((so) => (
                  <Link
                    key={so.id}
                    to="/outbound"
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-100 hover:border-[#E2E8F0] hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate font-mono">{so.soCode}</p>
                      <p className="text-[13px] text-slate-600 truncate">{so.customerName}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${statusColor[so.status] || 'bg-slate-100 text-slate-600'}`}>
                      {labels[so.status] || so.status}
                    </span>
                  </Link>
                ))}
                {!summary.recentOutbound.length && <p className="py-4 text-center text-xs text-slate-400">Chưa có đơn xuất trong kỳ này.</p>}
              </div>
            </div>
          </div>
        </div>
      </section>
        </div>
      )}

      {/* MODAL: Chi tiết luân chuyển theo tháng */}
      {monthDetailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMonthDetailModal(null);
          }}
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold">
                  Báo cáo luân chuyển {monthDetailModal.title?.toLowerCase() || monthDetailModal.month}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">Số liệu tổng hợp từ đơn nhập và đơn xuất trong tháng</p>
              </div>
              <button
                onClick={() => setMonthDetailModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
                  <span className="text-xs text-emerald-800 font-semibold block">Tổng nhập kho</span>
                  <span className="text-xl font-extrabold text-emerald-700 font-mono mt-1 block">
                    {monthDetailModal.inExact}
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5 block">{monthDetailModal.inValue} Triệu VNĐ</span>
                </div>
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60">
                  <span className="text-xs text-rose-800 font-semibold block">Tổng xuất kho</span>
                  <span className="text-xl font-extrabold text-rose-700 font-mono mt-1 block">
                    {monthDetailModal.outExact}
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5 block">{monthDetailModal.outValue} Triệu VNĐ</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs sm:text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 block">Chênh lệch luân chuyển ròng:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      monthDetailModal.inValue >= monthDetailModal.outValue
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {monthDetailModal.inValue >= monthDetailModal.outValue ? '↑ Tích lũy tồn kho ròng' : '↓ Giải phóng tồn kho ròng'}
                  </span>
                </div>
                <p className="font-mono font-bold text-lg text-blue-700">
                  {monthDetailModal.inValue >= monthDetailModal.outValue ? '+' : ''}
                  {(monthDetailModal.inValue - monthDetailModal.outValue).toFixed(1)} Triệu VNĐ
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-[#E2E8F0] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMonthDetailModal(null)}
                className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setMonthDetailModal(null);
                  navigate('/reports');
                }}
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Xem sổ cái biến động kho</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 5: Trung tâm Điều hành Toàn bộ Nhiệm vụ Kho (Enterprise Work Queue Modal) */}
      {showAllTasksModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAllTasksModal(false);
          }}
        >
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <ListFilter className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold">
                      Trung tâm Điều hành Nhiệm vụ Kho
                    </h2>
                    <span className="rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 text-xs font-bold">
                      {summary.totalActionableTasks} việc cần làm
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hàng đợi công việc theo thời gian thực tại {summary.currentZoneWarehouseName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllTasksModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTaskFilterTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    taskFilterTab === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({summary.actionableTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilterTab('SO')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    taskFilterTab === 'SO'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ArrowUpFromLine className="h-3.5 w-3.5" />
                  <span>Lấy hàng SO ({summary.actionableTasks.filter((t) => t.type === 'SO_PICKING').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilterTab('PO')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    taskFilterTab === 'PO'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  <span>Cất kệ PO ({summary.actionableTasks.filter((t) => t.type === 'PO_PUTAWAY').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilterTab('AUDIT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    taskFilterTab === 'AUDIT'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Kiểm kê ({summary.actionableTasks.filter((t) => t.type === 'AUDIT_APPROVAL').length})</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 hidden sm:block">
                Nhấn <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">ESC</kbd> để đóng
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="bg-slate-50/60 border-b border-slate-200 px-5 py-2.5 flex items-center gap-2.5 shrink-0">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={taskSearchKeyword}
                onChange={(e) => setTaskSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm nhanh mã đơn (SO/PO/AUD), nhân viên, nhà cung cấp..."
                className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
              />
              {taskSearchKeyword && (
                <button
                  type="button"
                  onClick={() => setTaskSearchKeyword('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Task List (Scrollable) */}
            <div className="p-5 overflow-y-auto divide-y divide-slate-100 flex-1 space-y-3">
              {filteredModalTasks.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Không có công việc thuộc danh mục này</h3>
                  <p className="text-xs text-slate-500 mt-1">Toàn bộ nhiệm vụ trong ca đã được xử lý hoàn tất.</p>
                </div>
              ) : (
                filteredModalTasks.map((task) => (
                  <div
                    key={task.id}
                    className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {task.type === 'SO_PICKING' ? (
                          <div className="h-9 w-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                            <PackageCheck className="h-5 w-5" />
                          </div>
                        ) : task.type === 'PO_PUTAWAY' ? (
                          <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                            <ArrowDownToLine className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">{task.title}</span>
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {task.code}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${task.priorityColor}`}>
                            {task.priorityLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {task.deadlineText} • Phụ trách: <span className="font-medium text-slate-700">{task.assignedTo}</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                      {task.type === 'SO_PICKING' && (
                        <Link
                          to={`/outbound?soCode=${encodeURIComponent(task.code)}&action=picking`}
                          onClick={() => setShowAllTasksModal(false)}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>Xử lý đơn xuất</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                      {task.type === 'PO_PUTAWAY' && (
                        <Link
                          to={`/inbound?poCode=${encodeURIComponent(task.code)}`}
                          onClick={() => setShowAllTasksModal(false)}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>Xếp lên kệ</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                      {task.type === 'AUDIT_APPROVAL' && (
                        <Link
                          to={`/audit?auditCode=${encodeURIComponent(task.code)}`}
                          onClick={() => setShowAllTasksModal(false)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>Duyệt kiểm kê</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Hiển thị {filteredModalTasks.length} / {summary.totalActionableTasks} nhiệm vụ
              </span>
              <button
                type="button"
                onClick={() => setShowAllTasksModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đóng hàng đợi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
