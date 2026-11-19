import { apiClient } from '../../../services/api';
import { CategoryItem, ProductItem, SupplierItem } from '../types';
import { inventoryService } from '../../inventory/services/inventoryService';
import { PRIMARY_WAREHOUSE } from '../../../config/warehouse';

export const productService = {
  async getProducts(stockedOnly = false): Promise<ProductItem[]> {
    try {
      const [res, closingBalances, supplierResponse] = await Promise.all([
        apiClient.get('/masterdata/products'),
        inventoryService.getClosingBalances().catch(() => []),
        apiClient.get('/masterdata/suppliers').catch(() => ({ data: { data: [] } })),
      ]);
      const suppliers = new Map<number, { code: string; name: string }>((supplierResponse.data.data || [])
        .map((s: any) => [Number(s.id), { code: s.code, name: s.name }]));
      const stockByProduct = new Map(closingBalances.filter(s => s.warehouseId === PRIMARY_WAREHOUSE.id)
        .map(s => [s.productId, s.onHandQty]));
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((p: any) => {
          const l = Number(p.lengthCm || 20);
          const w = Number(p.widthCm || 15);
          const h = Number(p.heightCm || 10);
          const cbm = Math.round(((l * w * h) / 1000000) * 10000) / 10000;
          const zone = p.storageCondition === 'COOL'
            ? 'ZONE_B'
            : p.storageCondition === 'SECURE'
            ? 'ZONE_D'
            : p.storageCondition === 'COLD'
            ? 'ZONE_C'
            : (p.storageZone || 'ZONE_A');

          return {
            id: String(p.id),
            sku: p.sku,
            barcode: p.barcode,
            name: p.name,
            description: p.description || '',
            category: ([2, 3, 4].includes(p.categoryId) ? 'ELECTRONICS' : p.categoryId === 5 ? 'CHEMICAL' : 'FOOD_BEVERAGE') as any,
            unit: p.unit || 'Cái',
            brand: p.brand || '',
            origin: p.origin || 'Việt Nam',
            imageUrl: p.imageUrl || '',
            storageCondition: p.storageCondition || 'AMBIENT',
            weightKg: Number(p.weightKg || 1),
            lengthCm: l,
            widthCm: w,
            heightCm: h,
            volumeCbm: cbm,
            reorderPoint: p.reorderPoint || 20,
            safetyStock: p.safetyStock || 10,
            maxStock: p.maxStock || 500,
            purchasePrice: Number(p.purchasePrice || 0),
            sellingPrice: Number(p.sellingPrice || 0),
            businessStatus: p.businessStatus || (p.isActive === false ? 'SUSPENDED' : 'ACTIVE'),
            currentStock: stockByProduct.get(Number(p.id)) ?? 0,
            storageZone: zone as any,
            supplierCode: suppliers.get(Number(p.supplierId))?.code || '',
            supplierId: p.supplierId ? String(p.supplierId) : undefined,
            supplierName: suppliers.get(Number(p.supplierId))?.name || '',
            status: p.deletedAt ? 'DELETED' : p.isActive === false ? 'INACTIVE' : 'ACTIVE',
          };
        }).filter((p: ProductItem) => !stockedOnly || p.currentStock > 0);
      }
      return [];
    } catch (err) {
      console.error('Cannot load products from backend:', err);
      throw err;
    }
  },

  async getCategories(): Promise<CategoryItem[]> {
    try {
      const res = await apiClient.get('/masterdata/categories');
      return (res.data?.data || []).map((c: any) => ({
        id: String(c.id), code: c.code, name: c.name, parentId: c.parentId ? String(c.parentId) : null,
        status: c.deletedAt ? 'DELETED' : c.isActive === false ? 'INACTIVE' : 'ACTIVE',
      }));
    } catch (err) {
      console.error('Cannot load categories from backend:', err);
      throw err;
    }
  },

  async updateProductStatus(id: string, isActive: boolean): Promise<void> {
    await apiClient.patch(`/masterdata/products/${id}/status`, { isActive });
  },
  async softDeleteProduct(id: string): Promise<void> { await apiClient.delete(`/masterdata/products/${id}`); },
  async restoreProduct(id: string): Promise<void> { await apiClient.post(`/masterdata/products/${id}/restore`); },
  async updateCategoryStatus(id: string, isActive: boolean): Promise<void> {
    await apiClient.patch(`/masterdata/categories/${id}/status`, { isActive });
  },
  async softDeleteCategory(id: string): Promise<void> { await apiClient.delete(`/masterdata/categories/${id}`); },
  async restoreCategory(id: string): Promise<void> { await apiClient.post(`/masterdata/categories/${id}/restore`); },

  async createProduct(product: Partial<ProductItem>): Promise<ProductItem> {
    try {
      const payload = {
        sku: product.sku,
        barcode: product.barcode || '893' + Date.now(),
        name: product.name,
        description: product.description,
        unit: product.unit || 'Cái',
        brand: product.brand,
        origin: product.origin,
        imageUrl: product.imageUrl,
        storageCondition: product.storageCondition || (product.storageZone === 'ZONE_B' ? 'COOL' : product.storageZone === 'ZONE_D' ? 'SECURE' : product.storageZone === 'ZONE_C' ? 'COLD' : 'AMBIENT'),
        weightKg: product.weightKg || 1,
        lengthCm: product.lengthCm || 20,
        widthCm: product.widthCm || 15,
        heightCm: product.heightCm || 10,
        safetyStock: product.safetyStock || 10,
        reorderPoint: product.reorderPoint || 20,
        maxStock: product.maxStock || 500,
        purchasePrice: product.purchasePrice || 0,
        sellingPrice: product.sellingPrice || 0,
        businessStatus: product.businessStatus || 'ACTIVE',
        categoryId: product.category === 'ELECTRONICS' ? 2 : product.category === 'CHEMICAL' ? 3 : 1,
        supplierId: product.supplierId ? Number(product.supplierId) : undefined,
      };
      const res = await apiClient.post('/masterdata/products', payload);
      const saved = res.data?.data;
      const l = Number(saved?.lengthCm || product.lengthCm || 20);
      const w = Number(saved?.widthCm || product.widthCm || 15);
      const h = Number(saved?.heightCm || product.heightCm || 10);
      return {
        id: String(saved?.id || Date.now()),
        sku: product.sku!,
        barcode: saved?.barcode || product.barcode || '893' + Date.now(),
        name: saved?.name || product.name!,
        description: saved?.description || product.description,
        category: product.category || 'GENERAL',
        unit: saved?.unit || product.unit || 'Cái',
        brand: saved?.brand || product.brand,
        origin: saved?.origin || product.origin,
        imageUrl: saved?.imageUrl || product.imageUrl,
        storageCondition: saved?.storageCondition || product.storageCondition,
        weightKg: Number(saved?.weightKg || product.weightKg || 1),
        lengthCm: l,
        widthCm: w,
        heightCm: h,
        volumeCbm: Math.round(((l * w * h) / 1000000) * 10000) / 10000,
        reorderPoint: saved?.reorderPoint || product.reorderPoint || 20,
        safetyStock: saved?.safetyStock || product.safetyStock || 10,
        maxStock: saved?.maxStock || product.maxStock || 500,
        purchasePrice: Number(saved?.purchasePrice || product.purchasePrice || 0),
        sellingPrice: Number(saved?.sellingPrice || product.sellingPrice || 0),
        businessStatus: saved?.businessStatus || product.businessStatus || 'ACTIVE',
        currentStock: 0,
        storageZone: product.storageZone || 'ZONE_A',
        supplierCode: product.supplierCode || 'SUP-GENERAL',
        supplierName: product.supplierName || 'Đối Tác Phân Phối',
        status: 'ACTIVE',
      };
    } catch (err) {
      console.error('Could not save product to backend:', err);
      throw err;
    }
  },

  async getSuppliers(): Promise<SupplierItem[]> {
    try {
      const res = await apiClient.get('/masterdata/suppliers');
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((s: any) => ({
          id: String(s.id),
          code: s.code,
          name: s.name,
          contactPerson: 'Bộ phận Tiếp nhận',
          phone: s.contactPhone || '028.1234.5678',
          email: `${s.code.toLowerCase()}@partner.vn`,
          address: 'Khu Công Nghiệp Tân Bình, TP.HCM',
          suppliedCategories: ['GENERAL'],
          activeProductsCount: 1,
          status: s.isActive === false ? 'INACTIVE' : 'ACTIVE' as const,
        }));
      }
      return [];
    } catch (err) {
      console.error('Cannot load suppliers from backend:', err);
      throw err;
    }
  },

  async createSupplier(supplier: Partial<SupplierItem>): Promise<SupplierItem> {
    try {
      const payload = {
        code: supplier.code,
        name: supplier.name,
        contactPhone: supplier.phone,
        isActive: supplier.status !== 'INACTIVE',
      };
      const res = await apiClient.post('/masterdata/suppliers', payload);
      const saved = res.data?.data;
      return {
        id: String(saved?.id || Date.now()),
        code: supplier.code || 'SUP-' + Date.now(),
        name: supplier.name!,
        contactPerson: supplier.contactPerson || 'Đại diện NCC',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        suppliedCategories: supplier.suppliedCategories || ['GENERAL'],
        activeProductsCount: 0,
        status: 'ACTIVE',
      };
    } catch (err) {
      console.error('Could not save supplier to backend:', err);
      throw err;
    }
  },

  async updateProduct(id: string, product: Partial<ProductItem>): Promise<ProductItem> {
    try {
      const payload = {
        name: product.name,
        description: product.description,
        barcode: product.barcode,
        unit: product.unit,
        brand: product.brand,
        origin: product.origin,
        imageUrl: product.imageUrl,
        storageCondition: product.storageCondition || (product.storageZone === 'ZONE_B' ? 'COOL' : product.storageZone === 'ZONE_D' ? 'SECURE' : product.storageZone === 'ZONE_C' ? 'COLD' : 'AMBIENT'),
        weightKg: product.weightKg,
        lengthCm: product.lengthCm,
        widthCm: product.widthCm,
        heightCm: product.heightCm,
        safetyStock: product.safetyStock,
        reorderPoint: product.reorderPoint,
        maxStock: product.maxStock,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        businessStatus: product.businessStatus,
        isActive: product.status !== 'INACTIVE',
        categoryId: product.category === 'ELECTRONICS' ? 4 : product.category === 'CHEMICAL' ? 5 : 2,
        supplierId: product.supplierId ? Number(product.supplierId) : undefined,
      };
      const res = await apiClient.put(`/masterdata/products/${id}`, payload);
      const saved = res.data?.data;
      const l = Number(saved?.lengthCm || product.lengthCm || 20);
      const w = Number(saved?.widthCm || product.widthCm || 15);
      const h = Number(saved?.heightCm || product.heightCm || 10);
      return {
        ...product,
        id: String(saved?.id || id),
        name: saved?.name || product.name!,
        description: saved?.description || product.description,
        barcode: saved?.barcode || product.barcode!,
        unit: saved?.unit || product.unit!,
        brand: saved?.brand || product.brand,
        origin: saved?.origin || product.origin,
        imageUrl: saved?.imageUrl || product.imageUrl,
        storageCondition: saved?.storageCondition || product.storageCondition,
        weightKg: Number(saved?.weightKg || product.weightKg || 1),
        lengthCm: l,
        widthCm: w,
        heightCm: h,
        volumeCbm: Math.round(((l * w * h) / 1000000) * 10000) / 10000,
        safetyStock: saved?.safetyStock || product.safetyStock!,
        reorderPoint: saved?.reorderPoint || product.reorderPoint!,
        maxStock: saved?.maxStock || product.maxStock || 500,
        purchasePrice: Number(saved?.purchasePrice || product.purchasePrice || 0),
        sellingPrice: Number(saved?.sellingPrice || product.sellingPrice || 0),
        businessStatus: saved?.businessStatus || product.businessStatus || 'ACTIVE',
      } as ProductItem;
    } catch (err) {
      console.error('Could not update product on backend:', err);
      throw err;
    }
  },

  async updateSupplier(id: string, supplier: Partial<SupplierItem>): Promise<SupplierItem> {
    try {
      const payload = {
        name: supplier.name,
        code: supplier.code,
        contactPhone: supplier.phone,
        isActive: supplier.status !== 'INACTIVE',
      };
      const res = await apiClient.put(`/masterdata/suppliers/${id}`, payload);
      const saved = res.data?.data;
      return {
        ...supplier,
        id: String(saved?.id || id),
        name: saved?.name || supplier.name!,
        code: saved?.code || supplier.code!,
        phone: saved?.contactPhone || supplier.phone!,
      } as SupplierItem;
    } catch (err) {
      console.error('Could not update supplier on backend:', err);
      throw err;
    }
  },
};
