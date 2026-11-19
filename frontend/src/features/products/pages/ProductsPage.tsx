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
import { CategoryItem, ProductItem, SupplierItem } from '../types';
import { CategoryTable } from '../components/CategoryTable';
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
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<ProductItem | null>(null);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<SupplierItem | null>(null);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<ProductItem | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<ProductItem | null>(null);

  const handleOpenCreateModal = () => {
    if (activeTab === 'CATEGORIES') return;
    if (activeTab === 'PRODUCTS') {
      setIsCreateProductOpen(true);
    } else {
      setIsCreateSupplierOpen(true);
    }
  };

  const handleAddProduct = async (newProduct: ProductItem) => {
    await productService.createProduct(newProduct);
    const updated = await productService.getProducts(true);
    setProducts(updated);
    setNotice('Đã đăng ký sản phẩm mới thành công.');
  };

  const handleAddSupplier = async (newSupplier: SupplierItem) => {
    await productService.createSupplier(newSupplier);
    const updated = await productService.getSuppliers();
    setSuppliers(updated);
  };

  const handleEditProduct = (product: ProductItem) => {
    setSelectedProductForEdit(product);
  };

  const handleProductStatus = async (product: ProductItem) => {
    if (product.status === 'DELETED') await productService.restoreProduct(product.id);
    else if (product.status === 'ACTIVE') await productService.updateProductStatus(product.id, false);
    else await productService.softDeleteProduct(product.id);
    setProducts(await productService.getProducts(true));
  };

  const handleCategoryStatus = async (category: CategoryItem) => {
    if (category.status === 'DELETED') await productService.restoreCategory(category.id);
    else if (category.status === 'ACTIVE') await productService.updateCategoryStatus(category.id, false);
    else await productService.softDeleteCategory(category.id);
    setCategories(await productService.getCategories());
  };

  const handleSaveEditProduct = async (updatedProduct: ProductItem) => {
    await productService.updateProduct(updatedProduct.id, updatedProduct);
    setProducts(await productService.getProducts(true));
  };

  const handleDeleteProduct = async (product: ProductItem) => {
    await productService.softDeleteProduct(product.id);
    setProducts((prev) => prev.filter((item) => item.id !== product.id));
  };

  const handleEditSupplier = (supplier: SupplierItem) => {
    setSelectedSupplierForEdit(supplier);
  };

  const handleSaveEditSupplier = async (updatedSupplier: SupplierItem) => {
    await productService.updateSupplier(updatedSupplier.id, updatedSupplier);
    setSuppliers(await productService.getSuppliers());
  };

  const handleViewSupplierProducts = (supplier: SupplierItem) => {
    setActiveTab('PRODUCTS');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Header */}
      <ProductsHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        products={displayedProducts}
        suppliers={suppliers}
        onOpenCreateModal={handleOpenCreateModal}
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
          onPrintBarcode={(p) => setSelectedProductForBarcode(p)}
          onEditProduct={handleEditProduct}
          onViewDetail={(p) => setSelectedProductForDetail(p)}
        />
      ) : activeTab === 'SUPPLIERS' ? (
        <SupplierTable
          suppliers={suppliers}
          onEditSupplier={handleEditSupplier}
          onViewSupplierProducts={handleViewSupplierProducts}
        />
      ) : (
        <CategoryTable categories={categories} onStatusChange={handleCategoryStatus} />
      )}

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={isCreateProductOpen}
        onClose={() => setIsCreateProductOpen(false)}
        onAddProduct={handleAddProduct}
        suppliers={suppliers}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={!!selectedProductForEdit}
        onClose={() => setSelectedProductForEdit(null)}
        product={selectedProductForEdit}
        onUpdateProduct={handleSaveEditProduct}
        onDeleteProduct={handleDeleteProduct}
        suppliers={suppliers}
      />

      {/* Create Supplier Modal */}
      <CreateSupplierModal
        isOpen={isCreateSupplierOpen}
        onClose={() => setIsCreateSupplierOpen(false)}
        onAddSupplier={handleAddSupplier}
      />

      {/* Edit Supplier Modal */}
      <EditSupplierModal
        isOpen={!!selectedSupplierForEdit}
        onClose={() => setSelectedSupplierForEdit(null)}
        supplier={selectedSupplierForEdit}
        onUpdateSupplier={handleSaveEditSupplier}
      />

      {/* GS1 Barcode Print Preview Modal */}
      <BarcodeLabelModal
        isOpen={!!selectedProductForBarcode}
        onClose={() => setSelectedProductForBarcode(null)}
        product={selectedProductForBarcode}
      />

      {/* Full Master Data Specification Detail Modal */}
      <ProductDetailModal
        isOpen={!!selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        product={selectedProductForDetail}
        onEditProduct={handleEditProduct}
        onPrintBarcode={(p) => setSelectedProductForBarcode(p)}
      />
    </div>
  );
};
