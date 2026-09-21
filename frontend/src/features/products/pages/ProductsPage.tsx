import React, { useState, useEffect } from 'react';
import { ProductsHeader } from '../components/ProductsHeader';
import { ProductTable } from '../components/ProductTable';
import { SupplierTable } from '../components/SupplierTable';
import { CreateProductModal } from '../components/CreateProductModal';
import { CreateSupplierModal } from '../components/CreateSupplierModal';
import { EditProductModal } from '../components/EditProductModal';
import { EditSupplierModal } from '../components/EditSupplierModal';
import { BarcodeLabelModal } from '../components/BarcodeLabelModal';
import { ProductItem, SupplierItem } from '../types';
import { productService } from '../services/productService';

export const ProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'SUPPLIERS'>('PRODUCTS');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [prods, supps] = await Promise.all([
        productService.getProducts(),
        productService.getSuppliers(),
      ]);
      setProducts(prods);
      setSuppliers(supps);
      setIsLoading(false);
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
    if (activeTab === 'PRODUCTS') {
      setIsCreateProductOpen(true);
    } else {
      setIsCreateSupplierOpen(true);
    }
  };

  const handleAddProduct = async (newProduct: ProductItem) => {
    const created = await productService.createProduct(newProduct);
    setProducts((prev) => [created, ...prev]);
  };

  const handleAddSupplier = async (newSupplier: SupplierItem) => {
    const created = await productService.createSupplier(newSupplier);
    setSuppliers((prev) => [created, ...prev]);
  };

  const handleEditProduct = (product: ProductItem) => {
    setSelectedProductForEdit(product);
  };

  const handleSaveEditProduct = async (updatedProduct: ProductItem) => {
    const saved = await productService.updateProduct(updatedProduct.id, updatedProduct);
    setProducts((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
  };

  const handleEditSupplier = (supplier: SupplierItem) => {
    setSelectedSupplierForEdit(supplier);
  };

  const handleSaveEditSupplier = async (updatedSupplier: SupplierItem) => {
    const saved = await productService.updateSupplier(updatedSupplier.id, updatedSupplier);
    setSuppliers((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
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

      {/* Main Table Content */}
      {activeTab === 'PRODUCTS' ? (
        <ProductTable
          products={products}
          onPrintBarcode={(p) => setSelectedProductForBarcode(p)}
          onEditProduct={handleEditProduct}
        />
      ) : (
        <SupplierTable
          suppliers={suppliers}
          onEditSupplier={handleEditSupplier}
          onViewSupplierProducts={handleViewSupplierProducts}
        />
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
