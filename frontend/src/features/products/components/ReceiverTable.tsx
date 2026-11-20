import React, { useEffect, useState } from 'react';
import { Search, Edit2, Building2 } from 'lucide-react';
import { SupplierItem } from '../types';
import { Pagination } from '../../../components/common';

export const ReceiverTable: React.FC<{
  receivers: SupplierItem[];
  onEdit: (receiver: SupplierItem) => void;
}> = ({ receivers, onEdit }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const filtered = receivers.filter(p => [p.code, p.name, p.contactPerson, p.phone, p.email, p.address]
    .some(value => value.toLowerCase().includes(search.toLowerCase())));
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  useEffect(() => setPage(1), [search]);
  useEffect(() => setPage(p => Math.min(p, pages)), [pages]);
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
    <div className="border-b bg-slate-50 p-4">
      <div className="relative max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input aria-label="Tìm bên nhận hàng" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên bên nhận, mã, liên hệ, SĐT…" className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm" />
      </div>
    </div>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-700">
      <thead className="border-b bg-slate-100 text-xs uppercase"><tr><th className="p-4">Mã & Tên Bên Nhận Hàng</th><th className="p-4">Người đại diện & SĐT</th><th className="p-4">Email & Địa chỉ nhận</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Thao tác</th></tr></thead>
      <tbody>{filtered.slice((page - 1) * 10, page * 10).map(p => <tr key={p.id} className="border-b hover:bg-slate-50">
        <td className="p-4"><div className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4 text-blue-600" />{p.name}</div><div className="mt-1 font-mono text-xs text-slate-500">{p.code}</div></td>
        <td className="p-4"><div>{p.contactPerson || '—'}</div><div className="text-xs text-slate-500">{p.phone || '—'}</div></td>
        <td className="p-4"><div>{p.email || '—'}</div><div className="text-xs text-slate-500">{p.address || '—'}</div></td>
        <td className="p-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{p.status === 'ACTIVE' ? 'Hợp tác' : 'Tạm ngưng'}</span></td>
        <td className="p-4 text-right"><button aria-label={`Chỉnh sửa bên nhận ${p.name}`} onClick={() => onEdit(p)} className="rounded-lg border bg-slate-100 p-2 hover:bg-slate-200"><Edit2 className="h-4 w-4" /></button></td>
      </tr>)}</tbody>
    </table>{filtered.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Chưa có bên nhận hàng phù hợp. Thêm đối tác với loại Bên nhận hàng để tạo đơn xuất.</p>}</div>
    <Pagination currentPage={page} totalItems={filtered.length} pageSize={10} onPageChange={setPage} />
  </div>;
};
