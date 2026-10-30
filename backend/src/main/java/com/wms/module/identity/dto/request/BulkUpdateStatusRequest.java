package com.wms.module.identity.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu khóa hoặc mở khóa hàng loạt tài khoản (Bulk Inactivation / Activation)")
public class BulkUpdateStatusRequest {

    @NotEmpty(message = "Danh sách ID tài khoản không được để trống!")
    @Schema(description = "Danh sách ID người dùng cần thao tác", example = "[2, 3, 5]")
    private List<Long> userIds;

    @NotNull(message = "Trạng thái isActive không được null")
    @Schema(description = "true = Mở khóa hàng loạt, false = Khóa hàng loạt tài khoản", example = "false")
    private Boolean isActive;
}

