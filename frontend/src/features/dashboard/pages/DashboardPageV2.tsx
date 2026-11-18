import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowDownToLine, ArrowRight, ArrowUpFromLine, Boxes, ClipboardCheck, Database, LayoutGrid, Loader2, Package, Printer, RefreshCw, Search, Truck } from 'lucide-react';
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

type Source = 'all' | 'products' | 'stock' | 'locations' | 'orders';
type Data = { inbound: InboundOrder[]; outbound: OutboundOrder[]; stock: StockItem[]; locations: BinLocation[]; products: ProductItem[] };
const empty: Data = { inbound: [], outbound: [], stock: [], locations: [], products: [] };
const nf = new Intl.NumberFormat('vi-VN');
const df = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmt = (n: number) => nf.format(n);
const date = (v?: string) => { if (!v) return '—'; const d = new Date(v); return Number.isNaN(d.getTime()) ? v : df.format(d); };
const labels: Record<string, string> = { PENDING: 'Chờ xử lý', RECEIVED: 'Đã tiếp nhận', STOCKED: 'Đã nhập kho', ALLOCATED: 'Đã cấp phát', PICKING: 'Đang lấy hàng', DISPATCHED: 'Đã xuất kho', CANCELLED: 'Đã hủy' };
const statusColor: Record<string, string> = { PENDING: 'bg-amber-50 text-amber-700', RECEIVED: 'bg-blue-50 text-blue-700', STOCKED: 'bg-emerald-50 text-emerald-700', ALLOCATED: 'bg-indigo-50 text-indigo-700', PICKING: 'bg-violet-50 text-violet-700', DISPATCHED: 'bg-emerald-50 text-emerald-700' };

const operations = [
  { title: 'Đơn nhập kho', description: 'Tiếp nhận PO, nhận hàng và cất hàng', path: '/inbound', icon: Truck, color: 'bg-emerald-600', key: 'inbound' as const },
  { title: 'Đơn xuất kho', description: 'Cấp phát FEFO, picking và bàn giao', path: '/outbound', icon: ArrowUpFromLine, color: 'bg-indigo-600', key: 'outbound' as const },
  { title: 'Tồn kho & sổ cái', description: 'Số dư theo lô, ô kệ và điều chuyển', path: '/inventory', icon: Package, color: 'bg-sky-600', key: 'stock' as const },
  { title: 'Kiểm kê kho', description: 'Đối soát số lượng thực tế tại kho', path: '/audit', icon: ClipboardCheck, color: 'bg-amber-600', key: 'locations' as const },
];
const layout = [
  { title: 'Mặt bằng ô kệ', description: 'Sơ đồ Digital Twin và vị trí đang chứa hàng', path: '/layout', icon: LayoutGrid, color: 'bg-cyan-600' },
  { title: 'Danh mục sản phẩm', description: 'SKU, barcode, đơn vị và định mức tồn', path: '/products', icon: Boxes, color: 'bg-violet-600' },
  { title: 'In tem nhãn', description: 'Tem mã vạch, QR, pallet và ô kệ', path: '/labels', icon: Printer, color: 'bg-rose-600' },
];

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<Data>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<Source>('all');
  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [inbound, outbound, stock, locations, products] = await Promise.all([inboundService.getInboundOrders(), outboundService.getOutboundOrders(), inventoryService.getInventoryBalances(), locationService.getLocations(), productService.getProducts()]);
      setData({ inbound, outbound, stock, locations, products });
    } catch { setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.'); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const metrics = useMemo(() => ({ inbound: data.inbound.filter(x => x.status !== 'CANCELLED').length, outbound: data.outbound.filter(x => x.status !== 'CANCELLED').length, stock: data.stock.reduce((n, x) => n + x.availableQty, 0), locations: data.locations.filter(x => x.status !== 'EMPTY').length }), [data]);
  const rate = data.locations.length ? Math.round(metrics.locations / data.locations.length * 100) : 0;
  const expiring = data.stock.filter(x => x.isExpiringSoon).length;
  const results = useMemo(() => {
    const term = query.trim().toLowerCase(); if (!term) return [] as Array<{ kind: string; title: string; detail: string; path: string }>;
    const out: Array<{ kind: string; title: string; detail: string; path: string }> = []; const match = (v: unknown) => String(v ?? '').toLowerCase().includes(term);
    if (source === 'all' || source === 'products') data.products.filter(x => [x.sku, x.barcode, x.name].some(match)).forEach(x => out.push({ kind: 'Sản phẩm', title: `${x.sku} · ${x.name}`, detail: `Barcode: ${x.barcode || '—'} · Tồn hiện tại: ${fmt(x.currentStock)}`, path: '/products' }));
    if (source === 'all' || source === 'stock') data.stock.filter(x => [x.sku, x.name, x.locationBarcode, x.batchNumber].some(match)).forEach(x => out.push({ kind: 'Tồn kho', title: `${x.sku} · ${x.name}`, detail: `Lô ${x.batchNumber} · ${x.locationBarcode} · Khả dụng: ${fmt(x.availableQty)}`, path: '/inventory' }));
    if (source === 'all' || source === 'locations') data.locations.filter(x => [x.barcode, x.sku, x.productName, x.zoneName].some(match)).forEach(x => out.push({ kind: 'Ô kệ', title: x.barcode, detail: `${x.zoneName} · ${x.productName || 'Đang trống'} · ${x.status}`, path: '/layout' }));
    if (source === 'all' || source === 'orders') [...data.inbound.map(x => ({ ...x, code: x.poCode, partner: x.supplierName, type: 'PO', path: '/inbound' })), ...data.outbound.map(x => ({ ...x, code: x.soCode, partner: x.customerName, type: 'SO', path: '/outbound' }))].filter(x => [x.code, x.partner, x.status].some(match)).forEach(x => out.push({ kind: `Đơn ${x.type}`, title: `${x.code} · ${x.partner}`, detail: `Trạng thái: ${labels[x.status] || x.status}`, path: x.path }));
    return out.slice(0, 12);
  }, [data, query, source]);
  const card = (title: string, description: string, path: string, Icon: React.ComponentType<{ className?: string }>, color: string, value?: number) => <Link to={path} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"><div className="flex items-start justify-between"><span className={`rounded-xl p-3 text-white ${color}`}><Icon className="h-5 w-5" /></span><ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" /></div><h3 className="mt-4 font-bold text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-500">{description}</p>{value !== undefined && <p className="mt-4 text-xs font-semibold text-indigo-600">{fmt(value)} đang theo dõi</p>}</Link>;
  const orderList = (orders: Array<InboundOrder | OutboundOrder>, type: 'in' | 'out') => orders.slice(0, 5).map(order => { const code = type === 'in' ? (order as InboundOrder).poCode : (order as OutboundOrder).soCode; const partner = type === 'in' ? (order as InboundOrder).supplierName : (order as OutboundOrder).customerName; return <Link key={order.id} to={type === 'in' ? '/inbound' : '/outbound'} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{code}</p><p className="truncate text-xs text-slate-500">{partner} · {date(type === 'in' ? (order as InboundOrder).expectedDeliveryDate : (order as OutboundOrder).orderDate)}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor[order.status] || 'bg-slate-100 text-slate-600'}`}>{labels[order.status] || order.status}</span></Link>; });

  const metricCards: Array<{ label: string; value: number; unit: string; icon: React.ComponentType<{ className?: string }>; color: string }> = [
    { label: 'Đơn nhập đang xử lý', value: metrics.inbound, unit: 'đơn', icon: ArrowDownToLine, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Đơn xuất đang xử lý', value: metrics.outbound, unit: 'đơn', icon: ArrowUpFromLine, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Tồn khả dụng', value: metrics.stock, unit: 'đơn vị', icon: Package, color: 'text-sky-600 bg-sky-50' },
    { label: 'Mức lấp đầy ô kệ', value: rate, unit: '%', icon: LayoutGrid, color: 'text-amber-600 bg-amber-50' },
  ];
  const orderPanels: Array<{ title: string; orders: Array<InboundOrder | OutboundOrder>; type: 'in' | 'out'; path: string }> = [
    { title: 'Đơn nhập gần đây', orders: data.inbound, type: 'in', path: '/inbound' },
    { title: 'Đơn xuất gần đây', orders: data.outbound, type: 'out', path: '/outbound' },
  ];

  return <div className="mx-auto max-w-[1600px] space-y-6 pb-12">
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200 ring-4 ring-blue-50 sm:h-14 sm:w-14">
            <LayoutGrid className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
              <Database className="h-3.5 w-3.5" /> Dữ liệu vận hành trực tiếp
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Tổng quan vận hành kho</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500">Theo dõi đơn hàng, tồn kho, mặt bằng và truy vấn dữ liệu từ cùng một màn hình.</p>
          </div>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition disabled:opacity-70 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Cập nhật dữ liệu
        </button>
      </div>
    </section>
    {error && <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button onClick={() => void load()} className="font-semibold underline">Thử lại</button></div>}
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{metricCards.map(item => { const Icon = item.icon; return <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p><span className={`rounded-xl p-2 ${item.color}`}><Icon className="h-5 w-5" /></span></div><p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">{loading ? '—' : fmt(item.value)} <span className="text-sm font-semibold text-slate-400">{item.unit}</span></p></div>; })}</section>
    <section><div className="mb-3"><h2 className="text-lg font-bold text-slate-900">Vận hành kho</h2><p className="text-sm text-slate-500">Đi tới đúng nghiệp vụ cần xử lý</p></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{operations.map(x => card(x.title, x.description, x.path, x.icon, x.color, metrics[x.key]))}</div></section>
    <section><div className="mb-3"><h2 className="text-lg font-bold text-slate-900">Mặt bằng & nhãn</h2><p className="text-sm text-slate-500">Quản lý cấu trúc kho, danh mục và nhận diện hàng hóa</p></div><div className="grid grid-cols-1 gap-4 md:grid-cols-3">{layout.map(x => <Link key={x.path} to={x.path} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"><span className={`rounded-xl p-3 text-white ${x.color}`}><x.icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-slate-900">{x.title}</span><span className="mt-1 block text-sm text-slate-500">{x.description}</span></span><ArrowRight className="h-5 w-5 shrink-0 text-slate-300" /></Link>)}</div></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><Search className="h-5 w-5 text-indigo-600" /><h2 className="text-lg font-bold text-slate-900">Truy vấn dữ liệu kho</h2></div><p className="mt-1 text-sm text-slate-500">Tìm theo SKU, barcode, lô hàng, ô kệ, mã đơn hoặc đối tác.</p></div><Link to="/smartquery" className="text-sm font-semibold text-indigo-600">Mở truy vấn nâng cao <ArrowRight className="ml-1 inline h-4 w-4" /></Link></div><div className="flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ví dụ: SKU, barcode, PO-..., ZONE_A..." className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></div><select value={source} onChange={e => setSource(e.target.value as Source)} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700"><option value="all">Tất cả dữ liệu</option><option value="products">Sản phẩm</option><option value="stock">Tồn kho</option><option value="locations">Ô kệ</option><option value="orders">Đơn hàng</option></select></div>{loading && <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải dữ liệu thật từ hệ thống...</div>}{!loading && query && !results.length && <div className="py-8 text-center text-sm text-slate-500">Không tìm thấy dữ liệu phù hợp.</div>}{!loading && !query && <div className="mt-4 rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">Nhập từ khóa để xem kết quả trực tiếp từ dữ liệu đang có trong kho.</div>}{results.length > 0 && <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">{results.map((r, i) => <Link key={`${r.kind}-${r.title}-${i}`} to={r.path} className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50"><span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{r.kind}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{r.title}</span><span className="block truncate text-xs text-slate-500">{r.detail}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-slate-400" /></Link>)}</div>}</section>
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">{orderPanels.map(panel => <div key={panel.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">{panel.title}</h2><p className="text-xs text-slate-500">Dữ liệu từ danh sách {panel.type === 'in' ? 'PO' : 'SO'}</p></div><Link to={panel.path} className="text-xs font-semibold text-indigo-600">Xem tất cả</Link></div><div className="space-y-3">{orderList(panel.orders, panel.type)}{!panel.orders.length && <p className="py-5 text-center text-sm text-slate-500">Chưa có dữ liệu.</p>}</div></div>)}</section>
    {expiring > 0 && <Link to="/inventory" className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100"><AlertTriangle className="h-5 w-5 shrink-0" /><span>Có <strong>{fmt(expiring)}</strong> dòng tồn kho sắp hết hạn. Mở tồn kho để xử lý theo FEFO.</span><ArrowRight className="ml-auto h-4 w-4 shrink-0" /></Link>}
  </div>;
};
