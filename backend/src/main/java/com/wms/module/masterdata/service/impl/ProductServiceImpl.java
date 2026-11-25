package com.wms.module.masterdata.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.masterdata.entity.Category;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.masterdata.repository.SupplierRepository;
import com.wms.module.masterdata.repository.CategoryRepository;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.ProductBatchRepository;
import com.wms.module.masterdata.entity.Supplier;
import com.wms.module.masterdata.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductBatchRepository productBatchRepository;
    private final com.wms.module.inventory.service.WarehouseStockService warehouseStockService;

    @Override
    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        java.util.Map<Long, Integer> closing = warehouseStockService.getClosingBalances(true).stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        com.wms.module.order.dto.response.OutboundStockResponse::getProductId,
                        java.util.stream.Collectors.summingInt(com.wms.module.order.dto.response.OutboundStockResponse::getOnHandQty)));
        List<Product> products = productRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc();
        products.forEach(product -> product.setCurrentStock(closing.getOrDefault(product.getId(), 0)));
        return products;
    }

    @Override
    @Transactional(readOnly = true)
    public Product getProductByBarcode(String barcode) {
        return productRepository.findByBarcodeAndDeletedAtIsNull(barcode)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm với Barcode: " + barcode));
    }

    @Override
    @Transactional(readOnly = true)
    public Product getProductBySku(String sku) {
        return productRepository.findBySkuAndDeletedAtIsNull(sku)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm với SKU: " + sku));
    }

    @Override
    public Product createProduct(Product product) {
        if (product.getSku() == null || product.getSku().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã SKU không được để trống!");
        }
        if (product.getName() == null || product.getName().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Tên hàng hóa/sản phẩm không được để trống!");
        }
        if (product.getUnit() == null || product.getUnit().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đơn vị tính (Unit) không được để trống!");
        }
        if (product.getCategoryId() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Danh mục sản phẩm (Category) không được để trống!");
        }
        validateCategoryAssignable(product.getCategoryId());

        String formattedSku = product.getSku().trim().toUpperCase();
        if (productRepository.findBySkuAndDeletedAtIsNull(formattedSku).isPresent()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã SKU đã tồn tại trong danh mục: " + formattedSku);
        }
        validateSupplierForNewProduct(product.getSupplierId());

        String formattedBarcode = product.getBarcode() != null ? product.getBarcode().trim() : "";
        if (formattedBarcode.isBlank()) {
            formattedBarcode = generateInternalEan13();
            while (productRepository.findByBarcodeAndDeletedAtIsNull(formattedBarcode).isPresent()) {
                formattedBarcode = generateInternalEan13();
            }
        } else if (productRepository.findByBarcodeAndDeletedAtIsNull(formattedBarcode).isPresent()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã vạch (Barcode) đã tồn tại trong danh mục: " + formattedBarcode);
        }

        validateProductSpecifications(product);

        product.setBarcode(formattedBarcode);
        product.setSku(formattedSku);
        product.setCurrentStock(0);
        product.setCreatedAt(Instant.now());
        product.setUpdatedAt(Instant.now());
        return productRepository.save(product);
    }

    @Override
    public Product updateProduct(Long id, Product productUpdate) {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm với ID: " + id));

        if (productUpdate.getName() != null && !productUpdate.getName().isBlank()) {
            existing.setName(productUpdate.getName());
        }
        if (productUpdate.getDescription() != null) {
            existing.setDescription(productUpdate.getDescription());
        }
        if (productUpdate.getBarcode() != null && !productUpdate.getBarcode().isBlank()) {
            String trimmedBarcode = productUpdate.getBarcode().trim();
            productRepository.findByBarcodeAndDeletedAtIsNull(trimmedBarcode).ifPresent(other -> {
                if (!other.getId().equals(existing.getId())) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã vạch (Barcode) đã thuộc về sản phẩm khác: " + trimmedBarcode);
                }
            });
            existing.setBarcode(trimmedBarcode);
        }
        if (productUpdate.getUnit() != null && !productUpdate.getUnit().isBlank()) {
            existing.setUnit(productUpdate.getUnit());
        }
        if (productUpdate.getBrand() != null) {
            existing.setBrand(productUpdate.getBrand());
        }
        if (productUpdate.getOrigin() != null) {
            existing.setOrigin(productUpdate.getOrigin());
        }
        if (productUpdate.getImageUrl() != null) {
            existing.setImageUrl(productUpdate.getImageUrl());
        }
        if (productUpdate.getStorageCondition() != null) {
            existing.setStorageCondition(productUpdate.getStorageCondition());
        }
        if (productUpdate.getWeightKg() != null) {
            existing.setWeightKg(productUpdate.getWeightKg());
        }
        if (productUpdate.getLengthCm() != null) {
            existing.setLengthCm(productUpdate.getLengthCm());
        }
        if (productUpdate.getWidthCm() != null) {
            existing.setWidthCm(productUpdate.getWidthCm());
        }
        if (productUpdate.getHeightCm() != null) {
            existing.setHeightCm(productUpdate.getHeightCm());
        }
        if (productUpdate.getSafetyStock() != null) {
            existing.setSafetyStock(productUpdate.getSafetyStock());
        }
        if (productUpdate.getReorderPoint() != null) {
            existing.setReorderPoint(productUpdate.getReorderPoint());
        }
        if (productUpdate.getMaxStock() != null) {
            existing.setMaxStock(productUpdate.getMaxStock());
        }
        if (productUpdate.getPurchasePrice() != null) {
            existing.setPurchasePrice(productUpdate.getPurchasePrice());
        }
        if (productUpdate.getSellingPrice() != null) {
            existing.setSellingPrice(productUpdate.getSellingPrice());
        }
        if (productUpdate.getBusinessStatus() != null) {
            existing.setBusinessStatus(productUpdate.getBusinessStatus());
        }
        if (productUpdate.getCategoryId() != null && !productUpdate.getCategoryId().equals(existing.getCategoryId())) {
            validateCategoryAssignable(productUpdate.getCategoryId());
            existing.setCategoryId(productUpdate.getCategoryId());
        }
        if (productUpdate.getSupplierId() != null && !productUpdate.getSupplierId().equals(existing.getSupplierId())) {
            validateSupplierForNewProduct(productUpdate.getSupplierId());
            existing.setSupplierId(productUpdate.getSupplierId());
        }
        if (productUpdate.getIsActive() != null) {
            existing.setIsActive(productUpdate.getIsActive());
        }
        if (productUpdate.getIsBatchManaged() != null) {
            existing.setIsBatchManaged(productUpdate.getIsBatchManaged());
        }
        if (productUpdate.getIsExpiryManaged() != null) {
            existing.setIsExpiryManaged(productUpdate.getIsExpiryManaged());
        }
        if (productUpdate.getShelfLifeDays() != null) {
            existing.setShelfLifeDays(productUpdate.getShelfLifeDays());
        }
        if (productUpdate.getOutboundStrategy() != null) {
            existing.setOutboundStrategy(productUpdate.getOutboundStrategy());
        }
        if (productUpdate.getPackagingUnit() != null) {
            existing.setPackagingUnit(productUpdate.getPackagingUnit());
        }
        if (productUpdate.getConversionRate() != null && productUpdate.getConversionRate() > 0) {
            existing.setConversionRate(productUpdate.getConversionRate());
        }
        validateProductSpecifications(existing);
        existing.setUpdatedAt(Instant.now());
        return productRepository.save(existing);
    }

    @Override
    public Product updateStatus(Long id, Boolean active) {
        Product product = findProduct(id);
        product.setIsActive(Boolean.TRUE.equals(active));
        product.setUpdatedAt(Instant.now());
        return productRepository.save(product);
    }

    @Override
    public Product softDelete(Long id) {
        Product product = findProduct(id);
        var inventories = inventoryRepository.findByProductId(id);
        int totalOnHand = inventories.stream().mapToInt(i -> i.getOnHandQty() != null ? i.getOnHandQty() : 0).sum();
        int totalReserved = inventories.stream().mapToInt(i -> i.getReservedQty() != null ? i.getReservedQty() : 0).sum();
        if (totalOnHand > 0 || totalReserved > 0) {
            String unit = product.getUnit() != null ? product.getUnit() : "đơn vị";
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    String.format("Không thể xóa sản phẩm '%s' (%s) khi vẫn còn %d %s tồn kho thực tế (đang giữ chỗ: %d). Vui lòng chuyển trạng thái sang Tạm ngưng nhập / Ngừng kinh doanh!",
                            product.getName(), product.getSku(), totalOnHand, unit, totalReserved));
        }
        product.setDeletedAt(Instant.now());
        product.setIsActive(false);
        product.setUpdatedAt(Instant.now());
        return productRepository.save(product);
    }

    @Override
    public void hardDeleteProduct(Long id) {
        Product product = findProduct(id);
        boolean hasStock = !inventoryRepository.findByProductId(id).isEmpty();
        boolean hasBatches = !productBatchRepository.findByProductId(id).isEmpty();
        if (hasStock || hasBatches) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Sản phẩm đã phát sinh giao dịch xuất/nhập/tồn kho, không được phép xóa vật lý! Chỉ được phép xóa mềm (Soft Delete) để bảo toàn tính toàn vẹn sổ cái.");
        }
        productRepository.delete(product);
    }

    @Override
    public Product restore(Long id) {
        Product product = findProduct(id);
        product.setDeletedAt(null);
        product.setIsActive(true);
        product.setUpdatedAt(Instant.now());
        return productRepository.save(product);
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm với ID: " + id));
    }

    private void validateCategoryAssignable(Long categoryId) {
        Category cat = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "Danh mục sản phẩm không tồn tại: " + categoryId));
        if (cat.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Không thể gán sản phẩm vào danh mục '" + cat.getName() + "' vì danh mục đã bị xóa!");
        }
        if (!Boolean.TRUE.equals(cat.getIsActive())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Danh mục '" + cat.getName() + "' đang tạm ngưng, không thể gán cho sản phẩm mới hoặc chuyển sang danh mục này!");
        }
    }

    private void validateSupplierForNewProduct(Long supplierId) {
        if (supplierId == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Sản phẩm phải thuộc một nhà cung cấp");
        }
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "Nhà cung cấp không tồn tại!"));
        if (!Boolean.TRUE.equals(supplier.getIsActive())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Không thể thêm sản phẩm từ nhà cung cấp đang ngưng hợp tác!");
        }
        if (supplier.getCode() != null && supplier.getCode().toUpperCase().startsWith("CUST-")) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đối tác '" + supplier.getName() + "' là Khách hàng B2B, không phải Nhà cung cấp!");
        }
    }

    private void validateProductSpecifications(Product p) {
        if (p.getWeightKg() != null && p.getWeightKg().doubleValue() <= 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Trọng lượng sản phẩm phải lớn hơn 0 kg!");
        }
        if (p.getLengthCm() != null && p.getLengthCm().doubleValue() <= 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Chiều dài bao bì phải lớn hơn 0 cm!");
        }
        if (p.getWidthCm() != null && p.getWidthCm().doubleValue() <= 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Chiều rộng bao bì phải lớn hơn 0 cm!");
        }
        if (p.getHeightCm() != null && p.getHeightCm().doubleValue() <= 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Chiều cao bao bì phải lớn hơn 0 cm!");
        }
        if (p.getPurchasePrice() != null && p.getPurchasePrice().doubleValue() < 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Giá nhập không được âm!");
        }
        if (p.getSellingPrice() != null && p.getSellingPrice().doubleValue() < 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Giá bán không được âm!");
        }
        int min = p.getSafetyStock() != null ? p.getSafetyStock() : 0;
        int rop = p.getReorderPoint() != null ? p.getReorderPoint() : 0;
        int max = p.getMaxStock() != null ? p.getMaxStock() : 500;
        if (min < 0 || rop < 0 || max < 1) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Định mức tồn kho không hợp lệ!");
        }
        if (min > rop) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Tồn kho tối thiểu (" + min + ") không được lớn hơn Ngưỡng đặt hàng lại (" + rop + ")!");
        }
        if (rop > max) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Ngưỡng đặt hàng lại (" + rop + ") không được vượt quá Tồn tối đa (" + max + ")!");
        }
    }

    private String generateInternalEan13() {
        StringBuilder sb = new StringBuilder("893");
        java.util.concurrent.ThreadLocalRandom rnd = java.util.concurrent.ThreadLocalRandom.current();
        for (int i = 0; i < 9; i++) {
            sb.append(rnd.nextInt(10));
        }
        String first12 = sb.toString();
        int sum = 0;
        for (int i = 0; i < 12; i++) {
            int d = first12.charAt(i) - '0';
            sum += (i % 2 == 0) ? d : d * 3;
        }
        int checkDigit = (10 - (sum % 10)) % 10;
        return first12 + checkDigit;
    }
}
