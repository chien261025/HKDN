import { apiClient } from '../../../services/api';
import { CategoryItem, ProductItem, SupplierItem } from '../types';

export const productService = {
  async getProducts(): Promise<ProductItem[]> {
    try {
      const res = await apiClient.get('/masterdata/products');
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((p: any) => ({
          id: String(p.id),
          sku: p.sku,
          barcode: p.barcode,
          name: p.name,
          category: (p.categoryId === 2 ? 'ELECTRONICS' : p.categoryId === 3 ? 'CHEMICAL' : 'FOOD_BEVERAGE') as any,
          unit: p.unit || 'Cái',
          weightKg: Number(p.weightKg || 0),
          reorderPoint: p.reorderPoint || 20,
          safetyStock: p.safetyStock || 10,
          currentStock: Number(p.currentStock || 0),
          storageZone: p.storageZone || 'UNASSIGNED',
          supplierCode: p.supplier?.code || (p.supplierId ? String(p.supplierId) : ''),
          supplierId: p.supplierId ? String(p.supplierId) : undefined,
          supplierName: p.supplier?.name || '',
          status: p.deletedAt ? 'DELETED' : p.isActive === false ? 'INACTIVE' : 'ACTIVE',
        }));
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
        unit: product.unit || 'Cái',
        safetyStock: product.safetyStock || 10,
        reorderPoint: product.reorderPoint || 20,
        categoryId: product.category === 'ELECTRONICS' ? 2 : product.category === 'CHEMICAL' ? 3 : 1,
        supplierId: product.supplierId ? Number(product.supplierId) : undefined,
      };
      const res = await apiClient.post('/masterdata/products', payload);
      const saved = res.data?.data;
      return {
        id: String(saved?.id || Date.now()),
        sku: product.sku!,
        barcode: product.barcode || '893' + Date.now(),
        name: product.name!,
        category: product.category || 'GENERAL',
        unit: product.unit || 'Cái',
        weightKg: product.weightKg || 1,
        reorderPoint: product.reorderPoint || 20,
        safetyStock: product.safetyStock || 10,
        currentStock: 0,
        storageZone: product.storageZone || 'ZONE_A',
        supplierCode: product.supplierCode || 'SUP-GENERAL',
        supplierName: product.supplierName || 'Đối Tác Phân Phối',
        status: 'ACTIVE',
      };
    } catch (err) {
      console.error('Could not save product to backend:', err);
      throw err;
      /*
      return {
        id: String(Date.now()),
        sku: product.sku!,
        barcode: product.barcode || '893' + Date.now(),
        name: product.name!,
        category: product.category || 'GENERAL',
        unit: product.unit || 'Cái',
        weightKg: product.weightKg || 1,
        reorderPoint: product.reorderPoint || 20,
        safetyStock: product.safetyStock || 10,
        currentStock: 0,
        storageZone: product.storageZone || 'ZONE_A',
        supplierCode: product.supplierCode || 'SUP-GENERAL',
        supplierName: product.supplierName || 'Đối Tác Phân Phối',
        status: 'ACTIVE',
      }; */
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
      /* return {
        id: String(Date.now()),
        code: supplier.code || 'SUP-' + Date.now(),
        name: supplier.name!,
        contactPerson: supplier.contactPerson || 'Đại diện NCC',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        suppliedCategories: supplier.suppliedCategories || ['GENERAL'],
        activeProductsCount: 0,
        status: 'ACTIVE',
      }; */
    }
  },

  async updateProduct(id: string, product: Partial<ProductItem>): Promise<ProductItem> {
    try {
      const payload = {
        name: product.name,
        barcode: product.barcode,
        unit: product.unit,
        safetyStock: product.safetyStock,
        reorderPoint: product.reorderPoint,
        isActive: product.status !== 'INACTIVE',
        categoryId: product.category === 'ELECTRONICS' ? 4 : product.category === 'CHEMICAL' ? 5 : 2,
        supplierId: product.supplierId ? Number(product.supplierId) : undefined,
      };
      const res = await apiClient.put(`/masterdata/products/${id}`, payload);
      const saved = res.data?.data;
      return {
        ...product,
        id: String(saved?.id || id),
        name: saved?.name || product.name!,
        barcode: saved?.barcode || product.barcode!,
        unit: saved?.unit || product.unit!,
        safetyStock: saved?.safetyStock || product.safetyStock!,
        reorderPoint: saved?.reorderPoint || product.reorderPoint!,
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
