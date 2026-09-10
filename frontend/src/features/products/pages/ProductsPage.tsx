import React, { useState } from 'react';
import { ProductsHeader } from '../components/ProductsHeader';
import { ProductTable } from '../components/ProductTable';
import { SupplierTable } from '../components/SupplierTable';
import { CreateProductModal } from '../components/CreateProductModal';
import { CreateSupplierModal } from '../components/CreateSupplierModal';
import { BarcodeLabelModal } from '../components/BarcodeLabelModal';
import { ProductItem, SupplierItem } from '../types';

const INITIAL_SUPPLIERS: SupplierItem[] = [
  {
    id: 'sup-1',
    code: 'SUP-VNM',
    name: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
    contactPerson: 'Nguyễn Văn Nam (P. Cung Ứng)',
    phone: '028 5415 5555',
    email: 'supplychain@vinamilk.com.vn',
    address: 'Số 10 Tân Trào, P. Tân Phú, Quận 7, TP.HCM',
    suppliedCategories: ['Thực Phẩm & Đồ Uống', 'Sữa Tươi', 'Sữa Chua'],
    activeProductsCount: 14,
    status: 'ACTIVE',
  },
  {
    id: 'sup-2',
    code: 'SUP-HCM',
    name: 'Công ty TNHH Hóa Chất Miền Nam',
    contactPerson: 'Trần Thị Thu Hà',
    phone: '028 3822 4112',
    email: 'contact@southchemical.vn',
    address: 'Lô 12 KCN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM',
    suppliedCategories: ['Hóa Chất', 'Dung Môi Khử Trùng'],
    activeProductsCount: 8,
    status: 'ACTIVE',
  },
  {
    id: 'sup-3',
    code: 'SUP-ELC',
    name: 'Linh Kiện Điện Tử & Vi Mạch Tân Bình',
    contactPerson: 'Lê Hoàng Long (Kỹ Sư Kho)',
    phone: '0903 112 334',
    email: 'sales@tanbinhelec.com',
    address: '280 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM',
    suppliedCategories: ['Linh Kiện Điện Tử', 'Cảm Biến IoT'],
    activeProductsCount: 22,
    status: 'ACTIVE',
  },
  {
    id: 'sup-4',
    code: 'SUP-TW1',
    name: 'Công ty CP Dược Phẩm Trung Ương 1 (Pharbaco)',
    contactPerson: 'Dược sĩ Phạm Minh Đức',
    phone: '024 3845 4561',
    email: 'distribution@pharbaco.com.vn',
    address: '160 Tôn Đức Thắng, Đống Đa, Hà Nội',
    suppliedCategories: ['Dược Phẩm Y Tế', 'Kháng Sinh'],
    activeProductsCount: 19,
    status: 'ACTIVE',
  },
  {
    id: 'sup-5',
    code: 'SUP-PKG',
    name: 'Bao Bì & Thùng Carton Tiến Phát',
    contactPerson: 'Đặng Quốc Huy',
    phone: '0918 889 900',
    email: 'orders@tienphatpack.vn',
    address: 'Đường số 3, KCN Sóng Thần 1, Dĩ An, Bình Dương',
    suppliedCategories: ['Bao Bì', 'Vật Tư Đóng Gói'],
    activeProductsCount: 6,
    status: 'ACTIVE',
  },
];

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    sku: 'SKU-MILK-001',
    barcode: '8934673123019',
    name: 'Sữa Tươi Tiệt Trùng Nguyên Chất 1L (Thùng 12 Hộp)',
    category: 'FOOD_BEVERAGE',
    unit: 'Thùng',
    weightKg: 12.5,
    reorderPoint: 60,
    safetyStock: 25,
    currentStock: 140,
    storageZone: 'ZONE_B',
    supplierCode: 'SUP-VNM',
    supplierName: 'Vinamilk',
    status: 'ACTIVE',
  },
  {
    id: 'prod-2',
    sku: 'SKU-YOG-002',
    barcode: '8934673123026',
    name: 'Sữa Chua Ăn Nha Đam Có Đường (Thùng 48 Hộp)',
    category: 'FOOD_BEVERAGE',
    unit: 'Thùng',
    weightKg: 5.2,
    reorderPoint: 40,
    safetyStock: 20,
    currentStock: 18, // Critical alert: < safety
    storageZone: 'ZONE_B',
    supplierCode: 'SUP-VNM',
    supplierName: 'Vinamilk',
    status: 'ACTIVE',
  },
  {
    id: 'prod-3',
    sku: 'SKU-CHEM-001',
    barcode: '8935002881023',
    name: 'Dung Môi Công Nghiệp C2H5OH 99.5% Can 20L',
    category: 'CHEMICAL',
    unit: 'Can',
    weightKg: 16.0,
    reorderPoint: 30,
    safetyStock: 10,
    currentStock: 22, // Reorder alert: <= 30
    storageZone: 'ZONE_A',
    supplierCode: 'SUP-HCM',
    supplierName: 'Hóa Chất Miền Nam',
    status: 'ACTIVE',
  },
  {
    id: 'prod-4',
    sku: 'SKU-SOL-002',
    barcode: '8935002881030',
    name: 'Dung Dịch Khử Khuẩn Sàn Kho Công Nghiệp 10L',
    category: 'CHEMICAL',
    unit: 'Can',
    weightKg: 10.5,
    reorderPoint: 25,
    safetyStock: 10,
    currentStock: 45,
    storageZone: 'ZONE_A',
    supplierCode: 'SUP-HCM',
    supplierName: 'Hóa Chất Miền Nam',
    status: 'ACTIVE',
  },
  {
    id: 'prod-5',
    sku: 'SKU-MCU-001',
    barcode: '8936001772018',
    name: 'Vi Điều Khiển STM32F407VGT6 ARM Cortex-M4 168MHz',
    category: 'ELECTRONICS',
    unit: 'Khay',
    weightKg: 0.8,
    reorderPoint: 50,
    safetyStock: 15,
    currentStock: 12, // Critical alert: < safety
    storageZone: 'ZONE_A',
    supplierCode: 'SUP-ELC',
    supplierName: 'Linh Kiện Tân Bình',
    status: 'ACTIVE',
  },
  {
    id: 'prod-6',
    sku: 'SKU-SEN-002',
    barcode: '8936001772025',
    name: 'Cảm Biến Nhiệt Độ Độ Ẩm Công Nghiệp SHT30 I2C',
    category: 'ELECTRONICS',
    unit: 'Hộp',
    weightKg: 1.2,
    reorderPoint: 35,
    safetyStock: 15,
    currentStock: 80,
    storageZone: 'ZONE_A',
    supplierCode: 'SUP-ELC',
    supplierName: 'Linh Kiện Tân Bình',
    status: 'ACTIVE',
  },
  {
    id: 'prod-7',
    sku: 'SKU-AMOX-001',
    barcode: '8937005991047',
    name: 'Thuốc Kháng Sinh Amoxicillin 500mg Chuẩn GMP (Hộp 100v)',
    category: 'PHARMA',
    unit: 'Thùng',
    weightKg: 3.5,
    reorderPoint: 45,
    safetyStock: 20,
    currentStock: 38, // Reorder alert
    storageZone: 'ZONE_B',
    supplierCode: 'SUP-TW1',
    supplierName: 'Dược Phẩm TW1',
    status: 'ACTIVE',
  },
  {
    id: 'prod-8',
    sku: 'SKU-CART-001',
    barcode: '8938009112056',
    name: 'Thùng Carton Sóng 5 Lớp 60x40x40cm Đạt Tiêu Chuẩn Xuất Khẩu',
    category: 'GENERAL',
    unit: 'Bó 20c',
    weightKg: 8.0,
    reorderPoint: 100,
    safetyStock: 30,
    currentStock: 250,
    storageZone: 'ZONE_A',
    supplierCode: 'SUP-PKG',
    supplierName: 'Bao Bì Tiến Phát',
    status: 'ACTIVE',
  },
];

export const ProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'SUPPLIERS'>('PRODUCTS');
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(INITIAL_SUPPLIERS);

  // Modals state
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<ProductItem | null>(null);

  const handleOpenCreateModal = () => {
    if (activeTab === 'PRODUCTS') {
      setIsCreateProductOpen(true);
    } else {
      setIsCreateSupplierOpen(true);
    }
  };

  const handleAddProduct = (newProduct: ProductItem) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleAddSupplier = (newSupplier: SupplierItem) => {
    setSuppliers((prev) => [newSupplier, ...prev]);
  };

  const handleEditProduct = (product: ProductItem) => {
    alert(`Chức năng cập nhật tham số cho SKU: ${product.sku} - ${product.name}`);
  };

  const handleEditSupplier = (supplier: SupplierItem) => {
    alert(`Chức năng cập nhật thông tin đối tác: ${supplier.name} (${supplier.code})`);
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

      {/* Create Supplier Modal */}
      <CreateSupplierModal
        isOpen={isCreateSupplierOpen}
        onClose={() => setIsCreateSupplierOpen(false)}
        onAddSupplier={handleAddSupplier}
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
