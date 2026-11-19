import React, { useState, useEffect } from 'react';
import { ProductsHeader } from '../components/ProductsHeader';
import { ProductTable } from '../components/ProductTable';
import { SupplierTable } from '../components/SupplierTable';
import { CreateProductModal } from '../components/CreateProductModal';
import { CreateSupplierModal } from '../components/CreateSupplierModal';
import { EditProductModal } from '../components/EditProductModal';
import { EditSupplierModal } from '../components/EditSupplierModal';
import { BarcodeLabelModal } from '../components/BarcodeLabelModal';
import { CategoryItem, ProductItem, SupplierItem } from '../types';
import { CategoryTable } from '../components/CategoryTable';
import { productService } from '../services/productService';
import { PRIMARY_WAREHOUSE } from '../../../config/warehouse';

export const ProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'SUPPLIERS' | 'CATEGORIES'>('PRODUCTS');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [prods, supps, cats] = await Promise.all([
          productService.getProducts(true),
          productService.getSuppliers(),
          productService.getCategories(),
        ]);
        setProducts(prods);
        setSuppliers(supps);
        setCategories(cats);
      } catch {
        setError('Không tải được danh mục và tồn cuối trong kho.');
      } finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  // Modals state
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<ProductItem | null>(null);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<SupplierItem | null>(null);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<ProductItem | null>(null);

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
    setProducts(await productService.getProducts(true));
    setNotice('Đã đăng ký sản phẩm. Sản phẩm sẽ xuất hiện trong danh mục hàng trong kho sau khi nhập hàng và cất lên kệ.');
  };

  const handleAddSupplier = async (newSupplier: SupplierItem) => {
    await productService.createSupplier(newSupplier);
    setSuppliers(await productService.getSuppliers());
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
        products={products}
        suppliers={suppliers}
        onOpenCreateModal={handleOpenCreateModal}
      />

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
      {activeTab === 'PRODUCTS' && <p className="text-sm text-slate-600">{PRIMARY_WAREHOUSE.name} · {isLoading ? 'Đang tải tồn cuối…' : 'Danh mục chỉ hiển thị sản phẩm còn tồn. Số lượng là tồn cuối, đồng nhất với tồn kho và sổ cái.'}</p>}

      {/* Main Table Content */}
      {activeTab === 'PRODUCTS' ? (
        <ProductTable
          products={products}
          onPrintBarcode={(p) => setSelectedProductForBarcode(p)}
          onEditProduct={handleEditProduct}
        />
      ) : activeTab === 'SUPPLIERS' ? (
        <SupplierTable
          suppliers={suppliers}
          onEditSupplier={handleEditSupplier}
          onViewSupplierProducts={handleViewSupplierProducts}
        />
      ) : <CategoryTable categories={categories} onStatusChange={handleCategoryStatus} />}

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
    </div>
  );
};
