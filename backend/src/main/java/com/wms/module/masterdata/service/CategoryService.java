package com.wms.module.masterdata.service;

import com.wms.module.masterdata.entity.Category;
import java.util.List;

public interface CategoryService {
    List<Category> getAllCategories();
    Category createCategory(Category category);
    Category updateCategory(Long id, Category update);
    Category updateStatus(Long id, Boolean active);
    Category softDelete(Long id);
    Category restore(Long id);
}
