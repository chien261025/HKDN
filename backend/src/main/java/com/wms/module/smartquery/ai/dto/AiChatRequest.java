package com.wms.module.smartquery.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiChatRequest(
        @NotBlank(message = "Câu hỏi không được để trống")
        @Size(max = 1000, message = "Câu hỏi không được vượt quá 1000 ký tự")
        String question,
        String warehouseCode
) {}
