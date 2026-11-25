import { apiClient } from '../../../services/api';
import { CategoryItem, ProductItem, SupplierItem, ProductCategory, StorageZoneReq, StorageConditionType } from '../types';
import { inventoryService } from '../../inventory/services/inventoryService';
import { PRIMARY_WAREHOUSE } from '../../../config/warehouse';
import { SmartProductAnalysis, analyzeProductAndGenerateSku } from '../utils/smartSkuGenerator';

const mapCategoryToId = (cat?: ProductCategory, zone?: string): number => {
  if (cat === 'ELECTRONICS') return 3;
  if (cat === 'CHEMICAL') return 5;
  if (cat === 'GENERAL') return 8;
  if (cat === 'PHARMACEUTICAL' || (cat as any) === 'PHARMA') return 9;
  if (cat === 'FASHION') return 10;
  return zone === 'ZONE_B' ? 2 : 1;
};

export const inferCategoryGroup = (catId?: number, code?: string, name?: string): ProductCategory => {
  const c = (code || '').toUpperCase();
  const n = (name || '').toLowerCase();
  if ([3, 4].includes(Number(catId)) || c.includes('ELEC') || c.includes('PHONE') || n.includes('điện tử') || n.includes('điện thoại')) {
    return 'ELECTRONICS';
  }
  if (Number(catId) === 5 || c.includes('CHEM') || n.includes('hóa mỹ phẩm') || n.includes('tẩy rửa')) {
    return 'CHEMICAL';
  }
  if (Number(catId) === 9 || c.includes('MED') || c.includes('PHARM') || n.includes('dược') || n.includes('y tế')) {
    return 'PHARMACEUTICAL';
  }
  if (Number(catId) === 10 || c.includes('FASH') || n.includes('thời trang') || n.includes('may mặc')) {
    return 'FASHION';
  }
  if ([8, 11].includes(Number(catId)) || c.includes('FURN') || c.includes('GEN') || n.includes('nội thất') || n.includes('tổng hợp')) {
    return 'GENERAL';
  }
  if ([1, 2, 6, 7].includes(Number(catId)) || c.includes('FOOD') || c.includes('COOL') || c.includes('BEV') || c.includes('COND')) {
    return 'FOOD_BEVERAGE';
  }
  return 'GENERAL';
};

export const productService = {
  async getProducts(stockedOnly = false): Promise<ProductItem[]> {
    try {
      const [res, closingBalances, supplierResponse, categoryResponse] = await Promise.all([
        apiClient.get('/masterdata/products'),
        inventoryService.getClosingBalances().catch(() => []),
        apiClient.get('/masterdata/suppliers').catch(() => ({ data: { data: [] } })),
        apiClient.get('/masterdata/categories').catch(() => ({ data: { data: [] } })),
      ]);
      const suppliers = new Map<number, { code: string; name: string }>((supplierResponse.data.data || [])
        .map((s: any) => [Number(s.id), { code: s.code, name: s.name }]));
      const categoriesMap = new Map<number, { code: string; name: string }>((categoryResponse.data.data || [])
        .map((c: any) => [Number(c.id), { code: c.code, name: c.name }]));
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

          const catId = Number(p.categoryId);
          const catMeta = categoriesMap.get(catId);
          const categoryType: ProductCategory = inferCategoryGroup(catId, catMeta?.code, catMeta?.name);

          return {
            id: String(p.id),
            sku: p.sku,
            barcode: p.barcode,
            name: p.name,
            description: p.description || '',
            category: categoryType,
            categoryId: Number.isFinite(catId) && catId > 0 ? catId : undefined,
            categoryCode: catMeta?.code,
            categoryName: catMeta?.name,
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
            reorderPoint: p.reorderPoint ?? 20,
            safetyStock: p.safetyStock ?? 10,
            maxStock: p.maxStock ?? 500,
            purchasePrice: Number(p.purchasePrice || 0),
            sellingPrice: Number(p.sellingPrice || 0),
            businessStatus: p.businessStatus || (p.isActive === false ? 'SUSPENDED' : 'ACTIVE'),
            currentStock: stockByProduct.get(Number(p.id)) ?? 0,
            storageZone: zone as any,
            supplierCode: suppliers.get(Number(p.supplierId))?.code || '',
            supplierId: p.supplierId ? String(p.supplierId) : undefined,
            supplierName: suppliers.get(Number(p.supplierId))?.name || '',
            status: p.deletedAt ? 'DELETED' : p.isActive === false ? 'INACTIVE' : 'ACTIVE',
            isBatchManaged: p.isBatchManaged !== undefined ? Boolean(p.isBatchManaged) : true,
            isExpiryManaged: p.isExpiryManaged !== undefined ? Boolean(p.isExpiryManaged) : categoryType === 'FOOD_BEVERAGE',
            shelfLifeDays: p.shelfLifeDays !== undefined ? Number(p.shelfLifeDays) : (p.sku === 'SKU-YOGURT-04' ? 45 : 365),
            outboundStrategy: p.outboundStrategy || (categoryType === 'FOOD_BEVERAGE' ? 'FEFO' : 'FIFO'),
            trackingMethod:
              p.trackingMethod ||
              (categoryType === 'ELECTRONICS'
                ? 'SERIAL_IMEI'
                : p.isBatchManaged !== false &&
                  (categoryType === 'FOOD_BEVERAGE' || categoryType === 'PHARMACEUTICAL' || p.isExpiryManaged === true)
                ? 'FEFO_BATCH'
                : 'STANDARD'),
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
        id: String(c.id),
        code: c.code,
        name: c.name,
        parentId: c.parentId ? String(c.parentId) : null,
        status: c.deletedAt ? 'DELETED' : c.isActive === false ? 'INACTIVE' : 'ACTIVE',
        productCount: Number(c.productCount || 0),
        childCount: Number(c.childCount || 0),
      }));
    } catch (err) {
      console.error('Cannot load categories from backend:', err);
      throw err;
    }
  },

  async createCategory(category: { code: string; name: string; parentId?: number | null }): Promise<CategoryItem> {
    const res = await apiClient.post('/masterdata/categories', {
      code: category.code,
      name: category.name,
      parentId: category.parentId || null,
    });
    const c = res.data?.data;
    return {
      id: String(c.id),
      code: c.code,
      name: c.name,
      parentId: c.parentId ? String(c.parentId) : null,
      status: c.deletedAt ? 'DELETED' : c.isActive === false ? 'INACTIVE' : 'ACTIVE',
      productCount: Number(c.productCount || 0),
      childCount: Number(c.childCount || 0),
    };
  },

  async updateCategory(id: string, category: { code?: string; name?: string; parentId?: number | null; clearParent?: boolean; isActive?: boolean }): Promise<CategoryItem> {
    const res = await apiClient.put(`/masterdata/categories/${id}`, {
      code: category.code,
      name: category.name,
      parentId: category.parentId || null,
      clearParent: category.clearParent || category.parentId === null,
      isActive: category.isActive,
    });
    const c = res.data?.data;
    return {
      id: String(c.id),
      code: c.code,
      name: c.name,
      parentId: c.parentId ? String(c.parentId) : null,
      status: c.deletedAt ? 'DELETED' : c.isActive === false ? 'INACTIVE' : 'ACTIVE',
      productCount: Number(c.productCount || 0),
      childCount: Number(c.childCount || 0),
    };
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
        safetyStock: product.safetyStock ?? 10,
        reorderPoint: product.reorderPoint ?? 20,
        maxStock: product.maxStock ?? 500,
        purchasePrice: product.purchasePrice || 0,
        sellingPrice: product.sellingPrice || 0,
        businessStatus: product.businessStatus || 'ACTIVE',
        categoryId: product.categoryId || mapCategoryToId(product.category, product.storageZone),
        trackingMethod: product.trackingMethod,
        isBatchManaged: product.isBatchManaged !== undefined ? product.isBatchManaged : true,
        isExpiryManaged: product.isExpiryManaged !== undefined ? product.isExpiryManaged : (product.category === 'FOOD_BEVERAGE'),
        shelfLifeDays: product.shelfLifeDays,
        outboundStrategy: product.outboundStrategy || (product.category === 'FOOD_BEVERAGE' ? 'FEFO' : 'FIFO'),
        packagingUnit: (product as any).packagingUnit || 'Thùng',
        conversionRate: (product as any).conversionRate || 24,
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
        reorderPoint: saved?.reorderPoint ?? product.reorderPoint ?? 20,
        safetyStock: saved?.safetyStock ?? product.safetyStock ?? 10,
        maxStock: saved?.maxStock ?? product.maxStock ?? 500,
        purchasePrice: Number(saved?.purchasePrice || product.purchasePrice || 0),
        sellingPrice: Number(saved?.sellingPrice || product.sellingPrice || 0),
        businessStatus: saved?.businessStatus || product.businessStatus || 'ACTIVE',
        currentStock: 0,
        storageZone: product.storageZone || 'ZONE_A',
        supplierCode: product.supplierCode || 'SUP-GENERAL',
        supplierName: product.supplierName || 'Đối Tác Phân Phối',
        status: 'ACTIVE',
        trackingMethod: product.trackingMethod || (product.category === 'ELECTRONICS' ? 'SERIAL_IMEI' : product.isBatchManaged ? 'FEFO_BATCH' : 'STANDARD'),
      };
    } catch (err) {
      console.error('Could not save product to backend:', err);
      throw err;
    }
  },

  async batchCreateProducts(products: Partial<ProductItem>[]): Promise<{ created: ProductItem[]; errors: { sku: string; error: string }[] }> {
    const created: ProductItem[] = [];
    const errors: { sku: string; error: string }[] = [];
    for (const p of products) {
      try {
        const item = await this.createProduct(p);
        created.push(item);
      } catch (err: any) {
        errors.push({
          sku: p.sku || 'UNKNOWN',
          error: err?.response?.data?.message || err?.message || 'Lỗi khi lưu sản phẩm',
        });
      }
    }
    return { created, errors };
  },

  async getSuppliers(): Promise<SupplierItem[]> {
    try {
      const res = await apiClient.get('/masterdata/suppliers');
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((s: any) => {
          const catList: string[] = Array.isArray(s.categories) && s.categories.length > 0
            ? s.categories.map((c: any) => c.name || c.code)
            : Array.isArray(s.suppliedCategories) && s.suppliedCategories.length > 0
            ? s.suppliedCategories
            : ['Chưa phân loại'];

          return {
            id: String(s.id),
            code: s.code,
            name: s.name,
            contactPerson: s.contactPerson || 'Bộ phận Tiếp nhận',
            phone: s.contactPhone || '028.1234.5678',
            email: s.email || `${s.code.toLowerCase()}@partner.vn`,
            address: s.address || 'Khu Công Nghiệp Tân Bình, TP.HCM',
            suppliedCategories: catList,
            categories: s.categories || [],
            activeProductsCount: Number(s.activeProductsCount ?? 0),
            status: s.isActive === false ? 'INACTIVE' : ('ACTIVE' as const),
          };
        });
      }
      return [];
    } catch (err) {
      console.error('Cannot load suppliers from backend:', err);
      throw err;
    }
  },

  async createSupplier(supplier: Partial<SupplierItem> & { categoryIds?: number[] }): Promise<SupplierItem> {
    try {
      const payload: any = {
        code: supplier.code,
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        contactPhone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        isActive: supplier.status !== 'INACTIVE',
      };
      if (supplier.categoryIds !== undefined) {
        payload.categoryIds = supplier.categoryIds;
      }
      const res = await apiClient.post('/masterdata/suppliers', payload);
      const saved = res.data?.data;
      return {
        id: String(saved?.id || Date.now()),
        code: saved?.code || supplier.code || 'SUP-' + Date.now(),
        name: saved?.name || supplier.name!,
        contactPerson: saved?.contactPerson || supplier.contactPerson || 'Đại diện NCC',
        phone: saved?.contactPhone || supplier.phone || '',
        email: saved?.email || supplier.email || '',
        address: saved?.address || supplier.address || '',
        suppliedCategories: saved?.suppliedCategories || supplier.suppliedCategories || ['Chưa phân loại'],
        categories: saved?.categories || [],
        activeProductsCount: 0,
        status: saved?.isActive === false ? 'INACTIVE' : 'ACTIVE',
      };
    } catch (err) {
      console.error('Could not save supplier to backend:', err);
      throw err;
    }
  },

  async updateSupplierStatus(id: string, isActive: boolean): Promise<void> {
    await apiClient.patch(`/masterdata/suppliers/${id}/status`, { isActive });
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
        categoryId: product.categoryId || mapCategoryToId(product.category, product.storageZone),
        trackingMethod: product.trackingMethod,
        isBatchManaged: product.isBatchManaged !== undefined ? product.isBatchManaged : true,
        isExpiryManaged: product.isExpiryManaged !== undefined ? product.isExpiryManaged : (product.category === 'FOOD_BEVERAGE'),
        shelfLifeDays: product.shelfLifeDays,
        outboundStrategy: product.outboundStrategy || (product.category === 'FOOD_BEVERAGE' ? 'FEFO' : 'FIFO'),
        packagingUnit: (product as any).packagingUnit || 'Thùng',
        conversionRate: (product as any).conversionRate || 24,
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
        safetyStock: saved?.safetyStock ?? product.safetyStock!,
        reorderPoint: saved?.reorderPoint ?? product.reorderPoint!,
        maxStock: saved?.maxStock ?? product.maxStock ?? 500,
        purchasePrice: Number(saved?.purchasePrice || product.purchasePrice || 0),
        sellingPrice: Number(saved?.sellingPrice || product.sellingPrice || 0),
        businessStatus: saved?.businessStatus || product.businessStatus || 'ACTIVE',
        trackingMethod: product.trackingMethod,
      } as ProductItem;
    } catch (err) {
      console.error('Could not update product on backend:', err);
      throw err;
    }
  },

  async updateSupplier(id: string, supplier: Partial<SupplierItem> & { categoryIds?: number[] }): Promise<SupplierItem> {
    try {
      const payload: any = {
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        contactPhone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        isActive: supplier.status !== 'INACTIVE',
      };
      if (supplier.categoryIds !== undefined) {
        payload.categoryIds = supplier.categoryIds;
      }
      const res = await apiClient.put(`/masterdata/suppliers/${id}`, payload);
      const saved = res.data?.data;
      return {
        ...supplier,
        id: String(saved?.id || id),
        name: saved?.name || supplier.name!,
        code: saved?.code || supplier.code!,
        phone: saved?.contactPhone || supplier.phone!,
        contactPerson: saved?.contactPerson || supplier.contactPerson!,
        email: saved?.email || supplier.email!,
        address: saved?.address || supplier.address!,
        suppliedCategories: saved?.suppliedCategories || supplier.suppliedCategories || [],
        categories: saved?.categories || supplier.categories || [],
        activeProductsCount: saved?.activeProductsCount ?? supplier.activeProductsCount ?? 0,
        status: saved?.isActive === false ? 'INACTIVE' : 'ACTIVE',
      } as SupplierItem;
    } catch (err) {
      console.error('Could not update supplier on backend:', err);
      throw err;
    }
  },

  async suggestSkuByAi(name: string): Promise<SmartProductAnalysis & { aiPowered?: boolean }> {
    try {
      const res = await apiClient.post('/masterdata/products/ai-suggest-sku', { name });
      const d = res.data?.data;
      if (d && d.sku) {
        return {
          sku: d.sku,
          category: (d.category || 'GENERAL') as ProductCategory,
          categoryLabel: d.categoryLabel || '',
          storageZone: (d.storageZone || 'ZONE_A') as StorageZoneReq,
          storageCondition: (d.storageCondition || 'AMBIENT') as StorageConditionType,
          unit: d.unit || 'Cái',
          isExpiryManaged: Boolean(d.isExpiryManaged),
          outboundStrategy: (d.outboundStrategy === 'FEFO' ? 'FEFO' : 'FIFO') as 'FEFO' | 'FIFO',
          shelfLifeDays: Number(d.shelfLifeDays || 0),
          reason: d.reason || 'AI phân tích thành công',
          aiPowered: Boolean(d.aiPowered),
        };
      }
      return analyzeProductAndGenerateSku(name);
    } catch (err) {
      console.warn('Backend AI SKU endpoint error, fallback to client semantic engine:', err);
      return analyzeProductAndGenerateSku(name);
    }
  },
};
