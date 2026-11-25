import React, { useMemo, useState, useEffect } from 'react';
import {
  RotateCcw,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  PauseCircle,
  PlayCircle,
  Layers,
  Search,
  Edit2,
  GitBranch,
  ExternalLink,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { CategoryItem } from '../types';
import { Modal, Button, InputField, SelectField } from '../../../components/common';

export interface CategorySavePayload {
  id?: string;
  code: string;
  name: string;
  parentId: number | null;
  clearParent?: boolean;
}

interface Props {
  categories: CategoryItem[];
  onStatusChange: (category: CategoryItem, action?: 'TOGGLE_ACTIVE' | 'DELETE' | 'RESTORE') => void | Promise<void>;
  onSaveCategory?: (payload: CategorySavePayload) => Promise<void>;
  onViewCategoryProducts?: (category: CategoryItem) => void;
  isCreateModalOpen?: boolean;
  onOpenCreateModal?: () => void;
  onCloseCreateModal?: () => void;
}

export const CategoryTable: React.FC<Props> = ({
  categories,
  onStatusChange,
  onSaveCategory,
  onViewCategoryProducts,
  isCreateModalOpen = false,
  onOpenCreateModal,
  onCloseCreateModal,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'DELETED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [blockedModalCategory, setBlockedModalCategory] = useState<CategoryItem | null>(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<CategoryItem | null>(null);

  // Create / Edit modal state
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isFormOpen = isCreateModalOpen || internalCreateOpen || !!editingCategory;

  useEffect(() => {
    if (isCreateModalOpen || internalCreateOpen) {
      setEditingCategory(null);
      setFormCode('');
      setFormName('');
      setFormParentId('');
      setFormError('');
      setIsSaving(false);
    }
  }, [isCreateModalOpen, internalCreateOpen]);

  const categoryById = useMemo(() => {
    const map = new Map<string, CategoryItem>();
    categories.forEach((c) => map.set(String(c.id), c));
    return map;
  }, [categories]);

  const childCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    categories.forEach((c) => {
      if (c.parentId && c.status !== 'DELETED') {
        const pid = String(c.parentId);
        counts.set(pid, (counts.get(pid) || 0) + 1);
      }
    });
    return counts;
  }, [categories]);

  const counts = useMemo(() => {
    return {
      ALL: categories.length,
      ACTIVE: categories.filter((c) => c.status === 'ACTIVE').length,
      INACTIVE: categories.filter((c) => c.status === 'INACTIVE').length,
      DELETED: categories.filter((c) => c.status === 'DELETED').length,
    };
  }, [categories]);

  const visible = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return categories.filter((c) => {
      const matchStatus = filter === 'ALL' || c.status === filter;
      if (!matchStatus) return false;
      if (!q) return true;
      const parent = c.parentId ? categoryById.get(String(c.parentId)) : undefined;
      return (
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (parent && (parent.name.toLowerCase().includes(q) || parent.code.toLowerCase().includes(q)))
      );
    });
  }, [categories, filter, searchTerm, categoryById]);

  // Compute all descendant IDs of a category to prevent self/cyclic parent assignments
  const forbiddenParentIds = useMemo(() => {
    const blocked = new Set<string>();
    if (!editingCategory) return blocked;
    const queue = [String(editingCategory.id)];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (blocked.has(curr)) continue;
      blocked.add(curr);
      categories.forEach((c) => {
        if (c.parentId && String(c.parentId) === curr) {
          queue.push(String(c.id));
        }
      });
    }
    return blocked;
  }, [editingCategory, categories]);

  const parentOptions = useMemo(() => {
    const eligible = categories.filter(
      (c) => c.status !== 'DELETED' && !forbiddenParentIds.has(String(c.id))
    );
    return [
      { value: '', label: '— Danh mục gốc (Cấp cao nhất) —' },
      ...eligible.map((c) => ({
        value: String(c.id),
        label: `[${c.code}] ${c.name}${c.status === 'INACTIVE' ? ' (Đang tạm ngưng)' : ''}`,
      })),
    ];
  }, [categories, forbiddenParentIds]);

  const label = (s: CategoryItem['status']) =>
    s === 'ACTIVE' ? 'Hoạt động' : s === 'INACTIVE' ? 'Tạm ngưng' : 'Đã xóa';

  const getChildCount = (c: CategoryItem) =>
    Math.max(Number(c.childCount || 0), childCountMap.get(String(c.id)) || 0);

  const handleDeleteClick = (c: CategoryItem) => {
    const skuCount = Number(c.productCount || 0);
    const subCount = getChildCount(c);
    if (skuCount > 0 || subCount > 0) {
      // Referential integrity & hierarchy guard: block deletion and advise deactivation
      setBlockedModalCategory({ ...c, childCount: subCount });
    } else {
      setConfirmDeleteCategory(c);
    }
  };

  const handleToggleActive = (c: CategoryItem) => {
    onStatusChange(c, 'TOGGLE_ACTIVE');
  };

  const handleExecuteDelete = async () => {
    if (confirmDeleteCategory) {
      await onStatusChange(confirmDeleteCategory, 'DELETE');
      setConfirmDeleteCategory(null);
    }
  };

  const handleSwitchToInactive = async () => {
    if (blockedModalCategory) {
      await onStatusChange(blockedModalCategory, 'TOGGLE_ACTIVE');
      setBlockedModalCategory(null);
    }
  };

  const handleOpenEdit = (c: CategoryItem) => {
    setInternalCreateOpen(false);
    setEditingCategory(c);
    setFormCode(c.code);
    setFormName(c.name);
    setFormParentId(c.parentId ? String(c.parentId) : '');
    setFormError('');
    setIsSaving(false);
  };

  const handleCloseForm = () => {
    setEditingCategory(null);
    setInternalCreateOpen(false);
    setFormError('');
    if (onCloseCreateModal) onCloseCreateModal();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveCategory) return;

    const cleanCode = formCode.trim().toUpperCase();
    const cleanName = formName.trim();

    if (!cleanCode) {
      setFormError('Vui lòng nhập Mã danh mục (VD: CAT-COLD-PKG)!');
      return;
    }
    if (!/^[A-Z0-9_-]{2,50}$/.test(cleanCode)) {
      setFormError('Mã danh mục chỉ gồm chữ in hoa, số, dấu gạch ngang (-) hoặc gạch dưới (_), tối thiểu 2 ký tự.');
      return;
    }
    if (!cleanName || cleanName.length < 2) {
      setFormError('Vui lòng nhập Tên danh mục ngành hàng (tối thiểu 2 ký tự)!');
      return;
    }
    const duplicate = categories.find(
      (c) =>
        c.code.trim().toUpperCase() === cleanCode &&
        (!editingCategory || String(c.id) !== String(editingCategory.id))
    );
    if (duplicate) {
      setFormError(`Mã danh mục "${cleanCode}" đã tồn tại (${duplicate.name}). Vui lòng chọn mã khác!`);
      return;
    }

    setIsSaving(true);
    setFormError('');
    try {
      await onSaveCategory({
        id: editingCategory?.id,
        code: cleanCode,
        name: cleanName,
        parentId: formParentId ? Number(formParentId) : null,
        clearParent: !!editingCategory && !formParentId,
      });
      handleCloseForm();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Không thể lưu thông tin danh mục.');
    } finally {
      setIsSaving(false);
    }
  };

  const isEditingLockedCode =
    !!editingCategory &&
    (Number(editingCategory.productCount || 0) > 0 || getChildCount(editingCategory) > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Quản Lý Danh Mục Ngành Hàng</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân nhóm ngành hàng và quản lý cây danh mục
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick status filter pills */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
              {(
                [
                  ['ALL', `Tất cả (${counts.ALL})`],
                  ['ACTIVE', `Hoạt động (${counts.ACTIVE})`],
                  ['INACTIVE', `Tạm ngưng (${counts.INACTIVE})`],
                  ['DELETED', `Đã xóa (${counts.DELETED})`],
                ] as const
              ).map(([key, text]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    filter === key
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'text-slate-600 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã hoặc tên danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Mã Danh Mục</th>
              <th className="py-3 px-4">Tên Danh Mục &amp; Phân Cấp</th>
              <th className="py-3 px-4 text-center">Sản Phẩm Đang Liên Kết</th>
              <th className="py-3 px-4 text-center">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((c) => {
              const productCount = Number(c.productCount || 0);
              const subCount = getChildCount(c);
              const isLockedDelete = productCount > 0 || subCount > 0;
              const parentCat = c.parentId ? categoryById.get(String(c.parentId)) : undefined;

              return (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 text-sm whitespace-nowrap">
                    {c.code}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{c.name}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                      {parentCat ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                          <GitBranch className="w-3 h-3 text-slate-500" />
                          <span>
                            Thuộc: <strong className="font-mono">{parentCat.code}</strong> ({parentCat.name})
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50/70 text-indigo-700 border border-indigo-200/70 font-medium">
                          Danh mục gốc
                        </span>
                      )}
                      {subCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                          <Layers className="w-3 h-3" />
                          <span>{subCount} danh mục con</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {productCount > 0 && onViewCategoryProducts ? (
                      <button
                        type="button"
                        onClick={() => onViewCategoryProducts(c)}
                        title={`Xem ${productCount} SKU thuộc danh mục ${c.name}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                      >
                        <span>{productCount} SKU</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                          productCount > 0
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {productCount} SKU
                      </span>
                    )}
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
                          type="button"
                          onClick={() => onStatusChange(c, 'RESTORE')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors text-xs font-semibold cursor-pointer"
                          title="Khôi phục danh mục"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Khôi phục</span>
                        </button>
                      ) : (
                        <>
                          {onSaveCategory && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(c)}
                              className="p-2 rounded-lg bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 transition-colors cursor-pointer"
                              title="Chỉnh sửa danh mục"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Toggle Active / Inactive Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(c)}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              c.status === 'ACTIVE'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title={
                              c.status === 'ACTIVE'
                                ? 'Chuyển sang Ngưng hoạt động (Tạm ngưng)'
                                : 'Kích hoạt lại danh mục'
                            }
                          >
                            {c.status === 'ACTIVE' ? (
                              <PauseCircle className="w-4 h-4" />
                            ) : (
                              <PlayCircle className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete Button with Safety Guard */}
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(c)}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              isLockedDelete
                                ? 'bg-slate-100 hover:bg-amber-50 text-slate-400 hover:text-amber-700 border-slate-200'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            }`}
                            title={
                              isLockedDelete
                                ? `Đang có ${productCount} SKU / ${subCount} danh mục con liên kết - Bấm để xem kiểm soát an toàn`
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

      {/* Create / Edit Category Modal */}
      {isFormOpen && onSaveCategory && (
        <Modal
          isOpen={true}
          onClose={handleCloseForm}
          title={editingCategory ? 'Cập Nhật Danh Mục' : 'Thêm Danh Mục Mới'}
          description={
            editingCategory ? (
              <span>
                Mã danh mục: <strong className="font-mono text-indigo-700">{editingCategory.code}</strong>
              </span>
            ) : undefined
          }
          icon={<Layers className="w-5 h-5" />}
          maxWidth="lg"
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              {isEditingLockedCode ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mã Danh Mục <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formCode}
                      disabled
                      readOnly
                      className="w-full py-2.5 pl-9 pr-3.5 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-slate-500 text-sm cursor-not-allowed"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Mã được khóa vì đang có sản phẩm hoặc danh mục con liên kết.
                  </p>
                </div>
              ) : (
                <InputField
                  label="Mã Danh Mục"
                  required
                  placeholder="VD: CAT-PACKAGING"
                  value={formCode}
                  onChange={(e) => {
                    setFormCode(e.target.value.toUpperCase());
                    setFormError('');
                  }}
                  className="font-mono uppercase"
                  helperText="VD: CAT-DOGO (viết hoa, không dấu)."
                />
              )}

              <InputField
                label="Tên Danh Mục"
                required
                placeholder="VD: Vật tư đóng gói & Bao bì"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setFormError('');
                }}
              />

              <SelectField
                label="Danh Mục Cha"
                value={formParentId}
                onChange={(e) => {
                  setFormParentId(e.target.value);
                  setFormError('');
                }}
                options={parentOptions}
                helperText="Để trống nếu là danh mục cấp cao nhất."
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button type="button" variant="secondary" onClick={handleCloseForm} disabled={isSaving}>
                Hủy Bỏ
              </Button>
              <Button type="submit" variant="primary" isLoading={isSaving}>
                {editingCategory ? 'Lưu Cập Nhật' : 'Tạo Danh Mục'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Safety Guard Block Modal (When category has linked products or child categories) */}
      {blockedModalCategory && (
        <Modal
          isOpen={true}
          onClose={() => setBlockedModalCategory(null)}
          title="Không Thể Xóa Danh Mục Đang Sử Dụng"
          icon={<ShieldAlert className="w-5 h-5 text-amber-600" />}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3 text-amber-900 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div>
                  Danh mục{' '}
                  <strong className="font-mono text-indigo-700">
                    [{blockedModalCategory.code}] {blockedModalCategory.name}
                  </strong>{' '}
                  hiện đang chứa{' '}
                  {Number(blockedModalCategory.productCount || 0) > 0 && (
                    <strong className="text-rose-700 font-bold">
                      {blockedModalCategory.productCount} sản phẩm
                    </strong>
                  )}
                  {Number(blockedModalCategory.productCount || 0) > 0 &&
                    getChildCount(blockedModalCategory) > 0 && <span> và </span>}
                  {getChildCount(blockedModalCategory) > 0 && (
                    <strong className="text-rose-700 font-bold">
                      {getChildCount(blockedModalCategory)} danh mục con trực thuộc
                    </strong>
                  )}
                  .
                </div>
                <p className="text-xs text-amber-800">
                  Vui lòng chuyển toàn bộ sản phẩm / danh mục con sang nơi khác trước khi xóa, hoặc chọn <strong>Tạm ngưng</strong> để khóa gán cho sản phẩm mới nhưng vẫn giữ nguyên dữ liệu lịch sử.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
              <Button variant="secondary" onClick={() => setBlockedModalCategory(null)}>
                Đóng
              </Button>
              {Number(blockedModalCategory.productCount || 0) > 0 && onViewCategoryProducts && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const target = blockedModalCategory;
                    setBlockedModalCategory(null);
                    onViewCategoryProducts(target);
                  }}
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Xem {blockedModalCategory.productCount} SKU Liên Kết
                </Button>
              )}
              {blockedModalCategory.status === 'ACTIVE' && (
                <Button
                  variant="primary"
                  onClick={handleSwitchToInactive}
                  leftIcon={<PauseCircle className="w-4 h-4" />}
                >
                  Chuyển Sang Tạm Ngưng
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Standard Delete Confirm Modal (When productCount === 0 and childCount === 0) */}
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
              Bạn có chắc chắn muốn xóa danh mục{' '}
              <strong className="font-mono text-indigo-700">
                [{confirmDeleteCategory.code}] {confirmDeleteCategory.name}
              </strong>
              ?
            </p>
            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              Danh mục này hiện không có sản phẩm hoặc danh mục con. Sau khi xóa vẫn có thể khôi phục khi cần.
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
