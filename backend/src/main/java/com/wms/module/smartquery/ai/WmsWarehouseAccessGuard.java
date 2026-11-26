package com.wms.module.smartquery.ai;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.entity.UserWarehouseAccess;
import com.wms.module.identity.repository.UserRepository;
import com.wms.module.identity.repository.UserWarehouseAccessRepository;
import com.wms.module.identity.util.SecurityUtils;
import com.wms.module.masterdata.entity.Warehouse;
import com.wms.module.masterdata.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Guard bảo mật đa kho và phân quyền RBAC cho mọi công cụ của Trợ lý Gemini AI.
 * Tuyệt đối không tin mã kho từ prompt/LLM; luôn đối chiếu với phiên JWT hiện tại.
 */
@Component
@RequiredArgsConstructor
public class WmsWarehouseAccessGuard {

    private final UserRepository userRepository;
    private final UserWarehouseAccessRepository userWarehouseAccessRepository;
    private final WarehouseRepository warehouseRepository;

    @Transactional(readOnly = true)
    public User requireCurrentUser() {
        String username = SecurityUtils.getCurrentUsername()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED,
                        "Phiên đăng nhập không hợp lệ để sử dụng Trợ lý Gemini AI."));
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED,
                        "Không tìm thấy hồ sơ tài khoản: " + username));
    }

    public boolean isAdmin(User user) {
        return user.getRoles().stream()
                .anyMatch(r -> "ROLE_ADMIN".equalsIgnoreCase(r.getName()));
    }

    public boolean isOperatorOnly(User user) {
        boolean hasOperator = user.getRoles().stream()
                .anyMatch(r -> "ROLE_OPERATOR".equalsIgnoreCase(r.getName()));
        boolean hasManagerOrAdmin = user.getRoles().stream()
                .anyMatch(r -> "ROLE_ADMIN".equalsIgnoreCase(r.getName())
                        || "ROLE_WAREHOUSE_MANAGER".equalsIgnoreCase(r.getName()));
        return hasOperator && !hasManagerOrAdmin;
    }

    @Transactional(readOnly = true)
    public List<Warehouse> getAllowedWarehouses() {
        User user = requireCurrentUser();
        List<Warehouse> all = warehouseRepository.findAll();
        if (isAdmin(user)) {
            return all;
        }
        List<UserWarehouseAccess> accesses = userWarehouseAccessRepository.findByUserId(user.getId());
        if (accesses.isEmpty()) {
            return Collections.emptyList();
        }
        Set<Long> allowedIds = new HashSet<>();
        for (UserWarehouseAccess access : accesses) {
            if (access.getWarehouse() != null && access.getWarehouse().getId() != null) {
                allowedIds.add(access.getWarehouse().getId());
            }
        }
        return all.stream()
                .filter(w -> allowedIds.contains(w.getId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Warehouse resolveAndRequireAccess(String warehouseCodeOrHint) {
        User user = requireCurrentUser();
        if (isOperatorOnly(user)) {
            throw new BusinessException(ErrorCode.FORBIDDEN,
                    "Tài khoản Thủ kho hiện trường (ROLE_OPERATOR) chỉ thao tác trên PDA, không có quyền dùng Trợ lý Gemini AI phân tích dữ liệu quản trị.");
        }

        List<Warehouse> allowed = getAllowedWarehouses();
        if (allowed.isEmpty()) {
            throw new BusinessException(ErrorCode.FORBIDDEN,
                    "Tài khoản hiện tại chưa được cấp quyền quản lý chi nhánh kho nào.");
        }

        if (warehouseCodeOrHint == null || warehouseCodeOrHint.isBlank()
                || "ALL".equalsIgnoreCase(warehouseCodeOrHint.trim())) {
            // Mặc định chọn kho primary hoặc kho đầu tiên trong danh sách được phép
            List<UserWarehouseAccess> accesses = userWarehouseAccessRepository.findByUserId(user.getId());
            for (UserWarehouseAccess acc : accesses) {
                if (Boolean.TRUE.equals(acc.getIsPrimary()) && acc.getWarehouse() != null) {
                    return acc.getWarehouse();
                }
            }
            return allowed.stream()
                    .filter(w -> "WH01".equalsIgnoreCase(w.getCode()))
                    .findFirst()
                    .orElse(allowed.get(0));
        }

        String target = warehouseCodeOrHint.trim();
        Optional<Warehouse> requested = findWarehouseByHint(warehouseRepository.findAll(), target);
        if (requested.isEmpty()) {
            throw new BusinessException(ErrorCode.NOT_FOUND,
                    "Không tìm thấy chi nhánh kho khớp với mã '" + target + "'.");
        }

        Warehouse wh = requested.get();
        boolean hasAccess = allowed.stream().anyMatch(w -> w.getId().equals(wh.getId()));
        if (!hasAccess) {
            String allowedCodes = String.join(", ", allowed.stream().map(Warehouse::getCode).toList());
            throw new BusinessException(ErrorCode.FORBIDDEN,
                    String.format("Từ chối truy xuất liên kho: Tài khoản '%s' không được phân công quản lý '%s (%s)'. Phạm vi hợp lệ: [%s].",
                            user.getUsername(), wh.getName(), wh.getCode(), allowedCodes));
        }
        return wh;
    }

    @Transactional(readOnly = true)
    public Warehouse requireWarehouseAccessById(Long warehouseId) {
        User user = requireCurrentUser();
        if (isOperatorOnly(user)) {
            throw new BusinessException(ErrorCode.FORBIDDEN,
                    "Tài khoản Thủ kho hiện trường (ROLE_OPERATOR) không có quyền truy vấn Trợ lý Gemini AI.");
        }
        Warehouse wh = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy kho ID: " + warehouseId));
        List<Warehouse> allowed = getAllowedWarehouses();
        boolean hasAccess = allowed.stream().anyMatch(w -> w.getId().equals(wh.getId()));
        if (!hasAccess) {
            throw new BusinessException(ErrorCode.FORBIDDEN,
                    String.format("Từ chối truy xuất liên kho: Tài khoản '%s' không có quyền xem dữ liệu tại '%s (%s)'.",
                            user.getUsername(), wh.getName(), wh.getCode()));
        }
        return wh;
    }

    private Optional<Warehouse> findWarehouseByHint(List<Warehouse> all, String hint) {
        String lower = hint.toLowerCase(Locale.ROOT);
        for (Warehouse w : all) {
            if (w.getCode() != null && w.getCode().equalsIgnoreCase(hint)) {
                return Optional.of(w);
            }
            if (String.valueOf(w.getId()).equals(hint)) {
                return Optional.of(w);
            }
        }
        for (Warehouse w : all) {
            if (w.getName() != null && w.getName().toLowerCase(Locale.ROOT).contains(lower)) {
                return Optional.of(w);
            }
        }
        return Optional.empty();
    }
}

