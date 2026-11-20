package com.wms.module.identity.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Dòng trong Ma trận phân quyền RBAC chi tiết")
public class RbacMatrixResponse {

    private Integer permissionId;
    private String code;
    private String name;
    private String module;
    private String description;
    private boolean adminAllowed;
    private boolean managerAllowed;
    private boolean operatorAllowed;
}

