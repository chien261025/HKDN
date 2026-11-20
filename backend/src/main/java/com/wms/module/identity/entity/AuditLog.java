package com.wms.module.identity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "wms_audit_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(name = "actor_username", nullable = false, length = 50)
    private String actorUsername;

    @Column(name = "target_type", nullable = false, length = 50)
    @Builder.Default
    private String targetType = "USER";

    @Column(name = "target_id", length = 50)
    private String targetId;

    @Column(name = "target_name", length = 100)
    private String targetName;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}

