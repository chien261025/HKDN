import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';
import { CategoryItem } from '../types';

interface Props { categories: CategoryItem[]; onStatusChange: (category: CategoryItem) => void; }
export const CategoryTable: React.FC<Props> = ({ categories, onStatusChange }) => {
  const [filter, setFilter] = useState('ALL');
  const visible = categories.filter((c) => filter === 'ALL' || c.status === filter);
  const label = (s: CategoryItem['status']) => s === 'ACTIVE' ? 'Đang hoạt động' : s === 'INACTIVE' ? 'Ngưng hoạt động' : 'Đã xóa mềm';
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center"><h2 className="font-bold text-slate-900">Quản lý danh mục</h2><select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngưng hoạt động</option><option value="DELETED">Đã xóa mềm</option></select></div>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-xs font-semibold text-slate-700"><tr><th className="py-3 px-4">Mã</th><th className="py-3 px-4">Tên danh mục</th><th className="py-3 px-4">Trạng thái</th><th className="py-3 px-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((c) => <tr key={c.id} className="hover:bg-slate-50"><td className="py-3.5 px-4 font-mono font-bold">{c.code}</td><td className="py-3.5 px-4 font-medium">{c.name}</td><td className="py-3.5 px-4"><span className={`px-2 py-1 rounded-md text-xs font-semibold ${c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : c.status === 'INACTIVE' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{label(c.status)}</span></td><td className="py-3.5 px-4 text-right"><button onClick={() => onStatusChange(c)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200">{c.status === 'DELETED' ? <RotateCcw className="w-4 h-4" /> : c.status === 'ACTIVE' ? <Trash2 className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}</button></td></tr>)}</tbody></table></div>
    {visible.length === 0 && <div className="p-8 text-center text-slate-400">Không có danh mục phù hợp.</div>}
  </div>;
};
