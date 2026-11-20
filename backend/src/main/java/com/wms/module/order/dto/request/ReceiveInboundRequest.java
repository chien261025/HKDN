package com.wms.module.order.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public record ReceiveInboundRequest(@NotEmpty List<@NotNull @Valid Line> items) {
    public record Line(@NotNull Long id, @NotNull @PositiveOrZero Integer receivedQty,
                       @NotNull @PositiveOrZero Integer rejectedQty,
                       @Size(max = 100) String batchNumber, LocalDate expiryDate) {}
}
