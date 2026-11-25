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
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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
            enrichCounts(c);
        }
        return list;
    }

    @Override
    public Category createCategory(Category category) {
        if (category.getCode() == null || category.getCode().isBlank() || category.getName() == null || category.getName().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã và tên danh mục không được để trống!");
        }
        String normalizedCode = category.getCode().trim().toUpperCase();
        String trimmedName = category.getName().trim();
        if (categoryRepository.findByCodeIgnoreCase(normalizedCode).isPresent()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã danh mục đã tồn tại: " + normalizedCode);
        }
        if (category.getParentId() != null) {
            validateParentCategory(null, category.getParentId());
        }
        category.setCode(normalizedCode);
        category.setName(trimmedName);
        category.setIsActive(category.getIsActive() == null ? Boolean.TRUE : category.getIsActive());
        category.setDeletedAt(null);
        category.setCreatedAt(Instant.now());
        category.setUpdatedAt(Instant.now());
        return enrichCounts(categoryRepository.save(category));
    }

    @Override
    public Category updateCategory(Long id, Category update) {
        Category current = findCategory(id);
        if (current.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Không thể chỉnh sửa danh mục đang ở trạng thái Xóa mềm. Vui lòng khôi phục trước!");
        }
        if (update.getCode() != null) {
            if (update.getCode().isBlank()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã danh mục không được để trống!");
            }
            String normalizedCode = update.getCode().trim().toUpperCase();
            if (!normalizedCode.equalsIgnoreCase(current.getCode())) {
                categoryRepository.findByCodeIgnoreCase(normalizedCode).ifPresent(other -> {
                    if (!other.getId().equals(id)) {
                        throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã danh mục đã tồn tại: " + normalizedCode);
                    }
                });
                current.setCode(normalizedCode);
            }
        }
        if (update.getName() != null) {
            if (update.getName().isBlank()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Tên danh mục không được để trống!");
            }
            current.setName(update.getName().trim());
        }
        if (Boolean.TRUE.equals(update.getClearParent())) {
            current.setParentId(null);
        } else if (update.getParentId() != null) {
            validateParentCategory(id, update.getParentId());
            current.setParentId(update.getParentId());
        }
        if (update.getIsActive() != null) {
            current.setIsActive(update.getIsActive());
        }
        current.setUpdatedAt(Instant.now());
        return enrichCounts(categoryRepository.save(current));
    }

    @Override public Category updateStatus(Long id, Boolean active) {
        Category category = findCategory(id);
        if (category.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Không thể đổi trạng thái danh mục đã xóa mềm. Vui lòng khôi phục trước!");
        }
        category.setIsActive(Boolean.TRUE.equals(active));
        category.setUpdatedAt(Instant.now());
        return enrichCounts(categoryRepository.save(category));
    }

    @Override public Category softDelete(Long id) {
        Category category = findCategory(id);
        if (category.getDeletedAt() != null) {
            return enrichCounts(category);
        }
        long productCount = productRepository.countByCategoryIdAndDeletedAtIsNull(id);
        long childCount = categoryRepository.countByParentIdAndDeletedAtIsNull(id);
        if (productCount > 0 || childCount > 0) {
            StringBuilder reason = new StringBuilder("Không thể xóa danh mục '").append(category.getName()).append("' vì ");
            if (productCount > 0 && childCount > 0) {
                reason.append("đang có ").append(productCount).append(" sản phẩm và ").append(childCount).append(" danh mục con liên kết.");
            } else if (productCount > 0) {
                reason.append("đang có ").append(productCount).append(" sản phẩm liên kết.");
            } else {
                reason.append("đang chứa ").append(childCount).append(" danh mục con trực thuộc.");
            }
            reason.append(" Vui lòng điều chuyển sang danh mục khác hoặc chuyển trạng thái sang Tạm ngưng.");
            throw new BusinessException(ErrorCode.BAD_REQUEST, reason.toString());
        }
        category.setDeletedAt(Instant.now());
        category.setIsActive(false);
        category.setUpdatedAt(Instant.now());
        return enrichCounts(categoryRepository.save(category));
    }

    @Override public Category restore(Long id) {
        Category category = findCategory(id);
        if (category.getParentId() != null) {
            Category parent = categoryRepository.findById(category.getParentId()).orElse(null);
            if (parent != null && parent.getDeletedAt() != null) {
                throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Vui lòng khôi phục danh mục cha '" + parent.getName() + "' trước khi khôi phục danh mục con này!");
            }
        }
        category.setDeletedAt(null);
        category.setIsActive(true);
        category.setUpdatedAt(Instant.now());
        return enrichCounts(categoryRepository.save(category));
    }

    private void validateParentCategory(Long selfId, Long parentId) {
        if (selfId != null && selfId.equals(parentId)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Danh mục không thể tự chọn chính mình làm danh mục cha!");
        }
        Category parent = categoryRepository.findById(parentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "Danh mục cha không tồn tại với ID: " + parentId));
        if (parent.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Không thể chọn danh mục cha đang ở trạng thái Đã xóa: " + parent.getName());
        }
        if (selfId != null) {
            Set<Long> visited = new HashSet<>();
            Long cursor = parent.getParentId();
            while (cursor != null) {
                if (cursor.equals(selfId)) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "Không thể gán danh mục cha gây vòng lặp phân cấp!");
                }
                if (!visited.add(cursor)) {
                    break;
                }
                cursor = categoryRepository.findById(cursor).map(Category::getParentId).orElse(null);
            }
        }
    }

    private Category enrichCounts(Category c) {
        if (c.getId() != null) {
            c.setProductCount(productRepository.countByCategoryIdAndDeletedAtIsNull(c.getId()));
            c.setChildCount(categoryRepository.countByParentIdAndDeletedAtIsNull(c.getId()));
        }
        return c;
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy danh mục với ID: " + id));
    }
}
