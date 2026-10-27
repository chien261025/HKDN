package com.wms.module.identity.util;

import com.wms.module.identity.entity.User;
import com.wms.module.identity.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Optional<String> getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            return Optional.empty();
        }
        return Optional.ofNullable(authentication.getName());
    }

    public static Long getCurrentUserIdOrDefault(UserRepository userRepository, Long defaultId) {
        return getCurrentUsername()
                .flatMap(userRepository::findByUsername)
                .map(User::getId)
                .orElse(defaultId);
    }
}
