package com.wms.module.identity.repository;

import com.wms.module.identity.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, String> {

    List<UserSession> findByUserIdOrderByLastActiveAtDesc(Long userId);

    List<UserSession> findByUserIdAndIsActiveTrueOrderByLastActiveAtAsc(Long userId);

    long countByUserIdAndIsActiveTrue(Long userId);

    Optional<UserSession> findFirstByTokenHashOrderByCreatedAtDesc(String tokenHash);

    Optional<UserSession> findByIdAndUserId(String id, Long userId);

    @Modifying
    @Query("UPDATE UserSession s SET s.isActive = false, s.revokedReason = :reason, s.lastActiveAt = :now WHERE s.user.id = :userId AND s.isActive = true AND s.id <> :excludeSessionId")
    void revokeOtherSessions(@Param("userId") Long userId, @Param("excludeSessionId") String excludeSessionId, @Param("reason") String reason, @Param("now") Instant now);

    @Modifying
    @Query("UPDATE UserSession s SET s.isActive = false, s.revokedReason = :reason, s.lastActiveAt = :now WHERE s.user.id = :userId AND s.isActive = true")
    void revokeAllSessions(@Param("userId") Long userId, @Param("reason") String reason, @Param("now") Instant now);
}
