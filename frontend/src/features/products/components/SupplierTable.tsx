import React, { useState } from 'react';
import { Search, Building2, Phone, Mail, MapPin, CheckCircle2, XCircle, Edit2, Box } from 'lucide-react';
import { SupplierItem } from '../types';

interface SupplierTableProps {
  suppliers: SupplierItem[];
  onEditSupplier: (supplier: SupplierItem) => void;
  onViewSupplierProducts: (supplier: SupplierItem) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({
  suppliers,
  onEditSupplier,
  onViewSupplierProducts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = suppliers.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.code.toLowerCase().includes(term) ||
      s.contactPerson.toLowerCase().includes(term) ||
      s.phone.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/40">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm tên nhà cung cấp, mã NCC, người liên hệ, SĐT, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/70 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Đối tác đã chứng nhận chất lượng ISO & GMP
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Mã & Tên Nhà Cung Cấp</th>
              <th className="py-3 px-4">Người Đại Diện & SĐT</th>
              <th className="py-3 px-4">Email & Trụ Sở</th>
              <th className="py-3 px-4">Ngành Hàng Cung Ứng</th>
              <th className="py-3 px-4 text-center">Số Lượng Mặt Hàng (SKU)</th>
              <th className="py-3 px-4 text-center">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-500 italic">
                  Không tìm thấy nhà cung cấp nào.
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Code & Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{s.name}</div>
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                          Mã hệ thống: <span className="text-indigo-300">{s.code}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact & Phone */}
                  <td className="py-3.5 px-4 space-y-1">
                    <div className="font-semibold text-slate-200">{s.contactPerson}</div>
                    <div className="flex items-center gap-1 font-mono text-slate-400 text-[11px]">
                      <Phone className="w-3 h-3 text-cyan-400" />
                      <span>{s.phone}</span>
                    </div>
                  </td>

                  {/* Email & Address */}
                  <td className="py-3.5 px-4 space-y-1 max-w-[220px]">
                    <div className="flex items-center gap-1 text-slate-300 truncate" title={s.email}>
                      <Mail className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <span className="truncate">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate" title={s.address}>
                      <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                      <span className="truncate">{s.address}</span>
                    </div>
                  </td>

                  {/* Categories */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {s.suppliedCategories.map((cat, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Active SKU Count */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => onViewSupplierProducts(s)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors font-mono font-bold text-xs"
                      title="Xem danh sách SKU của nhà cung cấp này"
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>{s.activeProductsCount} SKU</span>
                    </button>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    {s.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Hợp Tác
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XCircle className="w-3 h-3" />
                        Tạm Ngưng
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onEditSupplier(s)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg transition-colors border border-slate-700"
                      title="Chỉnh sửa thông tin NCC"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between font-mono">
        <div>
          Tổng số: <span className="text-white font-bold">{filteredSuppliers.length}</span> nhà cung cấp
        </div>
        <div className="text-[11px] text-slate-500">
          Tích hợp cổng EDI & Purchase Order (PO) tự động
        </div>
      </div>
    </div>
  );
};
