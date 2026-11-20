package com.wms.module.masterdata.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.masterdata.entity.Category;
import com.wms.module.masterdata.repository.CategoryRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.masterdata.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Override @Transactional(readOnly = true)
    public List<Category> getAllCategories() {
        List<Category> list = categoryRepository.findAllByOrderByCreatedAtDesc();
        for (Category c : list) {
            c.setProductCount(productRepository.countByCategoryIdAndDeletedAtIsNull(c.getId()));
        }
        return list;
    }

    @Override
    public Category createCategory(Category category) {
        if (category.getCode() == null || category.getCode().isBlank() || category.getName() == null || category.getName().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã và tên danh mục không được để trống!");
        }
        if (categoryRepository.findByCode(category.getCode()).isPresent()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã danh mục đã tồn tại: " + category.getCode());
        }
        category.setIsActive(true);
        category.setDeletedAt(null);
        category.setCreatedAt(Instant.now());
        category.setUpdatedAt(Instant.now());
        return categoryRepository.save(category);
    }

    @Override
    public Category updateCategory(Long id, Category update) {
        Category current = findCategory(id);
        if (update.getCode() != null && !update.getCode().isBlank()) current.setCode(update.getCode());
        if (update.getName() != null && !update.getName().isBlank()) current.setName(update.getName());
        if (update.getParentId() != null) current.setParentId(update.getParentId());
        if (update.getIsActive() != null) current.setIsActive(update.getIsActive());
        current.setUpdatedAt(Instant.now());
        return categoryRepository.save(current);
    }

    @Override public Category updateStatus(Long id, Boolean active) {
        Category category = findCategory(id);
        category.setIsActive(Boolean.TRUE.equals(active));
        category.setUpdatedAt(Instant.now());
        return categoryRepository.save(category);
    }

    @Override public Category softDelete(Long id) {
        Category category = findCategory(id);
        long productCount = productRepository.countByCategoryIdAndDeletedAtIsNull(id);
        if (productCount > 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                "Không thể xóa danh mục '" + category.getName() + "' vì đang có " + productCount + " sản phẩm liên kết! " +
                "Quy tắc bảo toàn dữ liệu Master Data không cho phép xóa danh mục đã có dữ liệu sản phẩm. " +
                "Vui lòng điều chuyển sản phẩm sang danh mục khác hoặc chuyển trạng thái danh mục sang Tạm Ngưng (INACTIVE).");
        }
        category.setDeletedAt(Instant.now());
        category.setIsActive(false);
        category.setUpdatedAt(Instant.now());
        return categoryRepository.save(category);
    }

    @Override public Category restore(Long id) {
        Category category = findCategory(id);
        category.setDeletedAt(null);
        category.setIsActive(true);
        category.setUpdatedAt(Instant.now());
        return categoryRepository.save(category);
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy danh mục với ID: " + id));
    }
}
