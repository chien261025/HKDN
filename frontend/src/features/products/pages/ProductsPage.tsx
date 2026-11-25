import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ExternalLink, RefreshCw, Radio, Building2 } from 'lucide-react';
import { ProductsHeader } from '../components/ProductsHeader';
import { ProductTable } from '../components/ProductTable';
import { SupplierTable } from '../components/SupplierTable';
import { CreateProductModal } from '../components/CreateProductModal';
import { CreateSupplierModal } from '../components/CreateSupplierModal';
import { EditProductModal } from '../components/EditProductModal';
import { EditSupplierModal } from '../components/EditSupplierModal';
import { BarcodeLabelModal } from '../components/BarcodeLabelModal';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { ImportProductsModal } from '../components/ImportProductsModal';
import { CategoryItem, ProductItem, SupplierItem } from '../types';
import { CategoryTable, CategorySavePayload } from '../components/CategoryTable';
import { productService } from '../services/productService';
import { inventoryService } from '../../inventory/services/inventoryService';
import { warehouseService } from '../../masterdata/services/warehouseService';
import { StockItem } from '../../labels/types';
import { WarehouseItem } from '../../masterdata/types';

export const ProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'SUPPLIERS' | 'CATEGORIES'>('PRODUCTS');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [inventoryBalances, setInventoryBalances] = useState<StockItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>(() => warehouseService.getActiveWarehouseId());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prods, supps, cats, balances, whs] = await Promise.all([
        productService.getProducts(false),
        productService.getSuppliers().catch(() => []),
        productService.getCategories().catch(() => []),
        inventoryService.getInventoryBalances().catch(() => []),
        warehouseService.getWarehouses().catch(() => []),
      ]);
      setProducts(prods);
      setSuppliers(supps);
      setCategories(cats);
      setInventoryBalances(balances);
      setWarehouses(whs);
      setError('');
    } catch (err) {
      console.error('Error fetching data for ProductsPage:', err);
      setError('Không tải được danh mục và tồn cuối trong kho.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleWhChanged = (e: any) => {
      const newWh = e.detail || warehouseService.getActiveWarehouseId();
      setActiveWarehouseId(newWh);
    };

    const handleWhUpdated = async () => {
      const whs = await warehouseService.getWarehouses();
      setWarehouses(whs);
    };

    window.addEventListener('smart_wms_warehouse_changed', handleWhChanged);
    window.addEventListener('smart_wms_warehouses_updated', handleWhUpdated);

    return () => {
      window.removeEventListener('smart_wms_warehouse_changed', handleWhChanged);
      window.removeEventListener('smart_wms_warehouses_updated', handleWhUpdated);
    };
  }, []);

  // Compute product stock based on selected warehouse
  const displayedProducts = useMemo(() => {
    const isAll = !activeWarehouseId || activeWarehouseId === 'ALL';
    const targetWhId =
      activeWarehouseId === 'WH01'
        ? 1
        : activeWarehouseId === 'WH02'
        ? 2
        : activeWarehouseId === 'WH03'
        ? 3
        : activeWarehouseId === 'WH04'
        ? 4
        : Number(activeWarehouseId);

    const stockMap = new Map<number, number>();
    inventoryBalances.forEach((inv) => {
      const whMatch =
        isAll ||
        inv.warehouseId === targetWhId ||
        String(inv.warehouseId) === String(activeWarehouseId) ||
        (targetWhId === 1 && (!inv.warehouseId || inv.warehouseId === 1));

      if (whMatch) {
        const pId = Number(inv.productId);
        const current = stockMap.get(pId) || 0;
        stockMap.set(pId, current + (inv.onHandQty || 0));
      }
    });

    return products.map((p) => {
      const qty = stockMap.get(Number(p.id)) ?? 0;
      return {
        ...p,
        currentStock: qty,
      };
    });
  }, [products, inventoryBalances, activeWarehouseId]);

  const activeWarehouseObj = useMemo(() => {
    if (!activeWarehouseId || activeWarehouseId === 'ALL') return null;
    return (
      warehouses.find(
        (w) =>
          w.code === activeWarehouseId ||
          String(w.id) === String(activeWarehouseId) ||
          (activeWarehouseId === 'WH01' && w.code === 'WH01') ||
          (activeWarehouseId === 'WH02' && w.code === 'WH02')
      ) || null
    );
  }, [warehouses, activeWarehouseId]);

  // Modals state
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<ProductItem | null>(null);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<SupplierItem | null>(null);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<ProductItem | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<ProductItem | null>(null);
  const [selectedStockHealthFilter, setSelectedStockHealthFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('ALL');
  const [batchPrintProducts, setBatchPrintProducts] = useState<ProductItem[] | null>(null);

  const handleOpenCreateModal = () => {
    if (activeTab === 'CATEGORIES') {
      setIsCreateCategoryOpen(true);
      return;
    }
    if (activeTab === 'PRODUCTS') {
      setIsCreateProductOpen(true);
    } else {
      setIsCreateSupplierOpen(true);
    }
  };

  const handleBatchImport = async (productsToImport: Partial<ProductItem>[]) => {
    try {
      setIsLoading(true);
      const res = await productService.batchCreateProducts(productsToImport);
      await fetchData();
      if (res.created.length === 0 && res.errors.length > 0) {
        const firstErr = res.errors[0];
        const msg = `Không thể nạp sản phẩm nào (${res.errors.length} lỗi). Lỗi đầu tiên [${firstErr.sku}]: ${firstErr.error}`;
        setError(msg);
        throw new Error(msg);
      }
      if (res.errors.length > 0) {
        const firstErr = res.errors[0];
        setNotice(
          `Đã nạp thành công ${res.created.length}/${productsToImport.length} sản phẩm mới vào danh mục hàng hóa.`
        );
        setError(
          `Có ${res.errors.length} dòng bị từ chối khi lưu (${firstErr.sku}: ${firstErr.error}).`
        );
      } else {
        setNotice(`Đã nạp thành công toàn bộ ${res.created.length} sản phẩm mới từ file vào hệ thống.`);
        setError('');
      }
      setIsImportModalOpen(false);
    } catch (err: any) {
      const msg = err?.message || 'Có lỗi xảy ra khi nạp dữ liệu hàng loạt.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (newProduct: ProductItem) => {
    try {
      await productService.createProduct(newProduct);
      await fetchData();
      setNotice(`Đã đăng ký sản phẩm mới "${newProduct.name}" (${newProduct.sku}) thành công.`);
      setError('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Không thể đăng ký sản phẩm mới.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleAddSupplier = async (newSupplier: SupplierItem & { categoryIds?: number[] }) => {
    try {
      await productService.createSupplier(newSupplier);
      await fetchData();
      setNotice(`Đã thêm nhà cung cấp mới "${newSupplier.name}" (${newSupplier.code}) thành công.`);
      setError('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Không thể tạo nhà cung cấp.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleEditProduct = (product: ProductItem) => {
    setSelectedProductForEdit(product);
  };

  const handleProductStatus = async (product: ProductItem) => {
    if (product.status === 'DELETED') await productService.restoreProduct(product.id);
    else if (product.status === 'ACTIVE') await productService.updateProductStatus(product.id, false);
    else await productService.softDeleteProduct(product.id);
    await fetchData();
  };

  const handleSaveCategory = async (payload: CategorySavePayload) => {
    if (payload.id) {
      await productService.updateCategory(payload.id, {
        code: payload.code,
        name: payload.name,
        parentId: payload.parentId,
        clearParent: payload.clearParent,
      });
      setNotice(`Đã cập nhật danh mục "[${payload.code}] ${payload.name}" thành công.`);
    } else {
      await productService.createCategory({
        code: payload.code,
        name: payload.name,
        parentId: payload.parentId,
      });
      setNotice(`Đã khởi tạo danh mục mới "[${payload.code}] ${payload.name}" thành công.`);
    }
    await fetchData();
    setError('');
  };

  const handleCategoryStatus = async (category: CategoryItem, action?: 'TOGGLE_ACTIVE' | 'DELETE' | 'RESTORE') => {
    try {
      if (action === 'RESTORE' || category.status === 'DELETED') {
        await productService.restoreCategory(category.id);
        setNotice(`Đã khôi phục danh mục "${category.name}" thành công.`);
      } else if (action === 'TOGGLE_ACTIVE') {
        const nextState = category.status !== 'ACTIVE';
        await productService.updateCategoryStatus(category.id, nextState);
        setNotice(`Đã chuyển trạng thái danh mục "${category.name}" sang ${nextState ? 'Đang hoạt động' : 'Ngưng hoạt động'}.`);
      } else {
        await productService.softDeleteCategory(category.id);
        setNotice(`Đã xóa mềm danh mục "${category.name}".`);
      }
      await fetchData();
      setError('');
    } catch (err: any) {
      console.error('Lỗi thao tác danh mục:', err);
      const errMsg = err?.response?.data?.message || err.message || 'Không thể thực hiện thao tác danh mục.';
      setError(errMsg);
    }
  };

  const handleSaveEditProduct = async (updatedProduct: ProductItem) => {
    try {
      await productService.updateProduct(updatedProduct.id, updatedProduct);
      await fetchData();
      setNotice(`Đã cập nhật hồ sơ sản phẩm "${updatedProduct.name}" (${updatedProduct.sku}) thành công.`);
      setError('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Không thể cập nhật thông tin sản phẩm.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleDeleteProduct = async (product: ProductItem) => {
    try {
      await productService.softDeleteProduct(product.id);
      await fetchData();
      setNotice(`Đã xóa sản phẩm "${product.name}" (${product.sku}) khỏi danh mục hoạt động.`);
      setError('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Không thể xóa sản phẩm.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleEditSupplier = (supplier: SupplierItem) => {
    setSelectedSupplierForEdit(supplier);
  };

  const handleSaveEditSupplier = async (updatedSupplier: SupplierItem & { categoryIds?: number[] }) => {
    try {
      await productService.updateSupplier(updatedSupplier.id, updatedSupplier);
      await fetchData();
      setNotice(`Cập nhật thông tin nhà cung cấp "${updatedSupplier.name}" (${updatedSupplier.code}) thành công.`);
      setError('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Không thể cập nhật nhà cung cấp.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleToggleSupplierStatus = async (supplier: SupplierItem) => {
    try {
      const nextActive = supplier.status !== 'ACTIVE';
      await productService.updateSupplierStatus(supplier.id, nextActive);
      await fetchData();
      setNotice(
        `Đã chuyển đối tác "${supplier.name}" (${supplier.code}) sang trạng thái ${
          nextActive ? 'Đang hợp tác' : 'Tạm ngưng hợp tác'
        }.`
      );
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Không thể cập nhật trạng thái đối tác.');
    }
  };

  const handleViewSupplierProducts = (supplier: SupplierItem) => {
    setSelectedCategoryFilter('ALL');
    setSelectedSupplierFilter(String(supplier.id));
    setActiveTab('PRODUCTS');
  };

  const isBarcodeModalOpen = !!selectedProductForBarcode || (!!batchPrintProducts && batchPrintProducts.length > 0);

  return (
    <div>
    <div className={`space-y-4 ${isBarcodeModalOpen ? 'no-print' : ''}`}>
      {/* Top Banner & KPI Header */}
      {/* Products Header với 4 KPI lọc tương tác & định giá tài sản kho */}
      <ProductsHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        products={displayedProducts}
        suppliers={suppliers}
        categoriesCount={categories.filter((c) => c.status !== 'DELETED').length}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        selectedHealthFilter={selectedStockHealthFilter}
        onSelectHealthFilter={setSelectedStockHealthFilter}
      />

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}

      {/* Warehouse Filter Indicator Banner */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50/50 border border-blue-200/90 rounded-2xl p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="text-slate-500 font-medium">Đang lọc số liệu tồn kho theo: </span>
              <strong className="text-blue-900 font-bold ml-1 text-sm">
                {activeWarehouseObj ? activeWarehouseObj.name : 'Toàn Bộ Chi Nhánh Kho (Tổng Toàn Quốc)'}
              </strong>
              {activeWarehouseObj?.address && (
                <span className="hidden md:inline text-slate-500 ml-2 font-normal">
                  • {activeWarehouseObj.address}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {activeWarehouseId !== 'ALL' && (
              <button
                type="button"
                onClick={() => {
                  warehouseService.setActiveWarehouseId('ALL');
                }}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs transition-colors cursor-pointer"
              >
                Xem Toàn Bộ Kho
              </button>
            )}
            <Link
              to="/warehouses"
              className="text-xs font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Quản Lý Chi Nhánh Kho</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Table Content */}
      {activeTab === 'PRODUCTS' ? (
        <ProductTable
          products={displayedProducts}
          categories={categories}
          suppliers={suppliers}
          onPrintBarcode={(p) => {
            setSelectedProductForBarcode(p);
            setBatchPrintProducts(null);
          }}
          onPrintBatchBarcodes={(list) => {
            setBatchPrintProducts(list);
            setSelectedProductForBarcode(null);
          }}
          onEditProduct={handleEditProduct}
          onViewDetail={(p) => setSelectedProductForDetail(p)}
          healthFilter={selectedStockHealthFilter}
          onHealthFilterChange={setSelectedStockHealthFilter}
          externalCategoryFilter={selectedCategoryFilter}
          onExternalCategoryFilterChange={setSelectedCategoryFilter}
          externalSupplierFilter={selectedSupplierFilter}
          onExternalSupplierFilterChange={setSelectedSupplierFilter}
        />
      ) : activeTab === 'SUPPLIERS' ? (
        <SupplierTable
          suppliers={suppliers}
          onEditSupplier={handleEditSupplier}
          onViewSupplierProducts={handleViewSupplierProducts}
          onToggleStatus={handleToggleSupplierStatus}
        />
      ) : (
        <CategoryTable
          categories={categories}
          onStatusChange={handleCategoryStatus}
          onSaveCategory={handleSaveCategory}
          onViewCategoryProducts={(cat) => {
            setSelectedCategoryFilter(`ID:${cat.id}`);
            setActiveTab('PRODUCTS');
          }}
          isCreateModalOpen={isCreateCategoryOpen}
          onOpenCreateModal={() => setIsCreateCategoryOpen(true)}
          onCloseCreateModal={() => setIsCreateCategoryOpen(false)}
        />
      )}

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={isCreateProductOpen}
        onClose={() => setIsCreateProductOpen(false)}
        onAddProduct={handleAddProduct}
        suppliers={suppliers}
        categories={categories}
        existingSkus={products.map((p) => p.sku)}
        existingBarcodes={products.map((p) => p.barcode).filter(Boolean)}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={!!selectedProductForEdit}
        onClose={() => setSelectedProductForEdit(null)}
        product={selectedProductForEdit}
        onUpdateProduct={handleSaveEditProduct}
        onDeleteProduct={handleDeleteProduct}
        suppliers={suppliers}
        categories={categories}
        inventoryBalances={inventoryBalances}
        existingProducts={products}
      />

      {/* Create Supplier Modal */}
      <CreateSupplierModal
        isOpen={isCreateSupplierOpen}
        onClose={() => setIsCreateSupplierOpen(false)}
        onAddSupplier={handleAddSupplier}
        availableCategories={categories}
        existingCodes={suppliers.map((s) => s.code)}
      />

      {/* Edit Supplier Modal */}
      <EditSupplierModal
        isOpen={!!selectedSupplierForEdit}
        onClose={() => setSelectedSupplierForEdit(null)}
        supplier={selectedSupplierForEdit}
        onUpdateSupplier={handleSaveEditSupplier}
        availableCategories={categories}
      />

      {/* Bulk CSV / Excel Import Modal */}
      <ImportProductsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingSkus={products.map((p) => p.sku)}
        existingBarcodes={products.map((p) => p.barcode).filter(Boolean)}
        suppliers={suppliers}
        onConfirmImport={handleBatchImport}
      />

      {/* Full Master Data Specification Detail Modal */}
      <ProductDetailModal
        isOpen={!!selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        product={selectedProductForDetail}
        onEditProduct={handleEditProduct}
        onPrintBarcode={(p) => {
          setSelectedProductForBarcode(p);
          setBatchPrintProducts(null);
        }}
        inventoryBalances={inventoryBalances}
        activeWarehouseId={activeWarehouseId}
        activeWarehouseName={activeWarehouseObj?.name || 'Toàn Bộ Chi Nhánh Kho'}
      />
    </div>

      {/* GS1 Barcode Print Preview Modal rendered outside no-print page container */}
      <BarcodeLabelModal
        isOpen={isBarcodeModalOpen}
        onClose={() => {
          setSelectedProductForBarcode(null);
          setBatchPrintProducts(null);
        }}
        product={selectedProductForBarcode}
        products={batchPrintProducts || undefined}
      />
    </div>
  );
};
