import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, Trash2, AlertTriangle, ShieldAlert, PauseCircle, PlayCircle, Layers, Info } from 'lucide-react';
import { CategoryItem } from '../types';
import { Modal, Button } from '../../../components/common';

interface Props {
  categories: CategoryItem[];
  onStatusChange: (category: CategoryItem, action?: 'TOGGLE_ACTIVE' | 'DELETE' | 'RESTORE') => void;
}

export const CategoryTable: React.FC<Props> = ({ categories, onStatusChange }) => {
  const [filter, setFilter] = useState('ALL');
  const [blockedModalCategory, setBlockedModalCategory] = useState<CategoryItem | null>(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<CategoryItem | null>(null);

  const visible = categories.filter((c) => filter === 'ALL' || c.status === filter);
  const label = (s: CategoryItem['status']) =>
    s === 'ACTIVE' ? 'Đang hoạt động' : s === 'INACTIVE' ? 'Ngưng hoạt động' : 'Đã xóa mềm';

  const handleDeleteClick = (c: CategoryItem) => {
    const count = Number(c.productCount || 0);
    if (count > 0) {
      // Referential integrity guard: block deletion and advise deactivation
      setBlockedModalCategory(c);
    } else {
      setConfirmDeleteCategory(c);
    }
  };

  const handleToggleActive = (c: CategoryItem) => {
    onStatusChange(c, 'TOGGLE_ACTIVE');
  };

  const handleExecuteDelete = () => {
    if (confirmDeleteCategory) {
      onStatusChange(confirmDeleteCategory, 'DELETE');
      setConfirmDeleteCategory(null);
    }
  };

  const handleSwitchToInactive = () => {
    if (blockedModalCategory) {
      onStatusChange(blockedModalCategory, 'TOGGLE_ACTIVE');
      setBlockedModalCategory(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Quản Lý Danh Mục Ngành Hàng (Master Data)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình danh mục phân loại hàng hóa kho với quy tắc bảo toàn tính toàn vẹn tham chiếu SKU
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Trạng thái:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Ngưng hoạt động</option>
            <option value="DELETED">Đã xóa mềm</option>
          </select>
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Mã Danh Mục</th>
              <th className="py-3 px-4">Tên Danh Mục Ngành Hàng</th>
              <th className="py-3 px-4 text-center">Sản Phẩm Đang Liên Kết</th>
              <th className="py-3 px-4 text-center">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((c) => {
              const productCount = Number(c.productCount || 0);
              const hasLinkedProducts = productCount > 0;

              return (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 text-sm">{c.code}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{c.name}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                        hasLinkedProducts
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {productCount} SKU
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.status === 'INACTIVE'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {label(c.status)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {c.status === 'DELETED' ? (
                        <button
                          onClick={() => onStatusChange(c, 'RESTORE')}
                          className="inline-flex items-center gap-1 p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors text-xs font-medium cursor-pointer"
                          title="Khôi phục danh mục"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Khôi phục</span>
                        </button>
                      ) : (
                        <>
                          {/* Toggle Active / Inactive Button */}
                          <button
                            onClick={() => handleToggleActive(c)}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              c.status === 'ACTIVE'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title={c.status === 'ACTIVE' ? 'Chuyển sang Ngưng hoạt động (Tạm ngưng)' : 'Kích hoạt lại danh mục'}
                          >
                            {c.status === 'ACTIVE' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                          </button>

                          {/* Delete Button with Safety Guard */}
                          <button
                            onClick={() => handleDeleteClick(c)}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              hasLinkedProducts
                                ? 'bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border-slate-200'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            }`}
                            title={
                              hasLinkedProducts
                                ? `Đang có ${productCount} SKU liên kết - Bấm để xem thông tin kiểm soát an toàn`
                                : 'Xóa mềm danh mục này'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {visible.length === 0 && (
        <div className="p-8 text-center text-slate-400 italic">Không có danh mục phù hợp.</div>
      )}

      {/* Safety Guard Block Modal (When category has linked products) */}
      {blockedModalCategory && (
        <Modal
          isOpen={true}
          onClose={() => setBlockedModalCategory(null)}
          title="Kiểm Soát Rủi Ro: Không Thể Xóa Danh Mục Đang Có Sản Phẩm"
          icon={<ShieldAlert className="w-5 h-5 text-amber-600" />}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3 text-amber-900 text-sm">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">Quy tắc toàn vẹn dữ liệu Master Data Enterprise:</div>
                <div>
                  Danh mục <strong className="font-mono text-indigo-700">[{blockedModalCategory.code}] {blockedModalCategory.name}</strong> hiện đang được tham chiếu bởi{' '}
                  <strong className="text-rose-700 font-bold">{blockedModalCategory.productCount} mặt hàng (SKU)</strong>.
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Hệ thống bảo vệ dữ liệu tự động:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Tuyệt đối <strong>không xóa vật lý</strong> danh mục đang được sử dụng để tránh lỗi mồ côi dữ liệu (orphan records).</li>
                <li>Không làm mất liên kết danh mục hay xóa hàng loạt các SKU liên quan.</li>
                <li>Khuyến nghị: Chuyển trạng thái danh mục sang <strong>Ngưng hoạt động (INACTIVE)</strong>. Danh mục sẽ không cho phép gán cho các sản phẩm mới nhưng bảo toàn 100% dữ liệu lịch sử.</li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setBlockedModalCategory(null)}>
                Đóng
              </Button>
              {blockedModalCategory.status === 'ACTIVE' && (
                <Button variant="primary" onClick={handleSwitchToInactive} leftIcon={<PauseCircle className="w-4 h-4" />}>
                  Chuyển Sang Ngưng Hoạt Động (Khuyến Nghị)
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Standard Delete Confirm Modal (When product count is 0) */}
      {confirmDeleteCategory && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmDeleteCategory(null)}
          title="Xác Nhận Xóa Danh Mục"
          icon={<Trash2 className="w-5 h-5 text-rose-600" />}
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Bạn có chắc chắn muốn xóa danh mục <strong className="font-mono text-indigo-700">[{confirmDeleteCategory.code}] {confirmDeleteCategory.name}</strong>?
            </p>
            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              Danh mục này hiện không có sản phẩm nào liên kết. Danh mục sẽ được chuyển vào trạng thái Xóa mềm (DELETED) và có thể khôi phục lại khi cần.
            </p>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmDeleteCategory(null)}>
                Hủy Bỏ
              </Button>
              <Button variant="danger" onClick={handleExecuteDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
                Xác Nhận Xóa
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
