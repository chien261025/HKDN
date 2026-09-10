package com.wms.module.order.controller;

import com.wms.common.response.ApiResponse;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.order.dto.request.FefoOrderRequest;
import com.wms.module.order.dto.request.SuggestLocationRequest;
import com.wms.module.order.dto.response.PickListItemResponse;
import com.wms.module.order.service.InboundService;
import com.wms.module.order.service.OutboundService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Tag(name = "5. Điều Phối Đơn Hàng (Order Operations)", description = "APIs thuật toán gợi ý cất hàng Put-away và xuất hàng theo chuẩn FEFO")
public class OrderController {

    private final InboundService inboundService;
    private final OutboundService outboundService;

    @PostMapping("/inbound/suggest-location")
    @Operation(summary = "Thuật toán gợi ý ô kệ cất hàng (Put-away Algorithm)",
               description = "Nhập phân khu và trọng lượng. Hệ thống tự động phân tích: nếu hàng nặng (>100kg) sẽ ưu tiên xếp vào tầng trệt S01 để an toàn.")
    public ApiResponse<Location> suggestPutAwayLocation(@Valid @RequestBody SuggestLocationRequest request) {
        Location location = inboundService.suggestOptimalPutAwayLocation(request.getPreferredZone(), request.getTotalWeightKg());
        return ApiResponse.success("Gợi ý ô kệ cất hàng tối ưu thành công!", location);
    }

    @PostMapping("/outbound/fefo-pick-list")
    @Operation(summary = "Thuật toán sinh Lộ trình nhặt hàng theo FEFO (First Expired, First Out)",
               description = "Tự động ưu tiên lô cận date xuất trước, tự động khóa giữ tồn kho (Reserve) và sinh lộ trình bước 1, 2... cho nhân viên đi lấy hàng.")
    public ApiResponse<List<PickListItemResponse>> generateFefoPickList(@Valid @RequestBody FefoOrderRequest request) {
        List<PickListItemResponse> pickList = outboundService.generateFefoPickList(request.getProductId(), request.getRequiredQty());
        return ApiResponse.success("Sinh danh sách nhặt hàng FEFO thành công!", pickList);
    }
}
