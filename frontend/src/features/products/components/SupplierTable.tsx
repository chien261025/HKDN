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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm tên nhà cung cấp, mã NCC, người liên hệ, SĐT, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Đối tác đã chứng nhận chất lượng ISO & GMP
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Mã & Tên Nhà Cung Cấp</th>
              <th className="py-3.5 px-4">Người Đại Diện & SĐT</th>
              <th className="py-3.5 px-4">Email & Trụ Sở</th>
              <th className="py-3.5 px-4">Ngành Hàng Cung Ứng</th>
              <th className="py-3.5 px-4 text-center">Số Lượng Mặt Hàng (SKU)</th>
              <th className="py-3.5 px-4 text-center">Trạng Thái</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-sans">
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-500 italic">
                  Không tìm thấy nhà cung cấp nào.
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Code & Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                        <div className="font-mono text-xs text-slate-500 mt-0.5">
                          Mã hệ thống: <span className="text-indigo-600 font-semibold">{s.code}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact & Phone */}
                  <td className="py-3.5 px-4 space-y-1">
                    <div className="font-semibold text-slate-800 text-sm">{s.contactPerson}</div>
                    <div className="flex items-center gap-1 font-mono text-slate-600 text-xs">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>{s.phone}</span>
                    </div>
                  </td>

                  {/* Email & Address */}
                  <td className="py-3.5 px-4 space-y-1 max-w-[220px]">
                    <div className="flex items-center gap-1.5 text-slate-700 text-xs truncate" title={s.email}>
                      <Mail className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="truncate">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate" title={s.address}>
                      <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                      <span className="truncate">{s.address}</span>
                    </div>
                  </td>

                  {/* Categories */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {s.suppliedCategories.map((cat, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors font-mono font-bold text-xs"
                      title="Xem danh sách SKU của nhà cung cấp này"
                    >
                      <Box className="w-4 h-4" />
                      <span>{s.activeProductsCount} SKU</span>
                    </button>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    {s.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Hợp Tác
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        Tạm Ngưng
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onEditSupplier(s)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
                      title="Chỉnh sửa thông tin NCC"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between font-mono">
        <div>
          Tổng số: <span className="text-slate-900 font-bold">{filteredSuppliers.length}</span> nhà cung cấp
        </div>
        <div className="text-xs text-slate-500">
          Tích hợp cổng EDI & Purchase Order (PO) tự động
        </div>
      </div>
    </div>
  );
};
