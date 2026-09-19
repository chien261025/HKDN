package com.wms.module.identity.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu khóa hoặc mở khóa tài khoản")
public class UpdateUserStatusRequest {

    @NotNull(message = "Trạng thái isActive không được null")
    @Schema(description = "true = Kích hoạt hoạt động, false = Tạm khóa tài khoản", example = "false")
    private Boolean isActive;
}
