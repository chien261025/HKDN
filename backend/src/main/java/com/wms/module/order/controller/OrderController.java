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
    private final com.wms.module.order.repository.InboundOrderRepository inboundOrderRepository;
    private final com.wms.module.order.repository.OutboundOrderRepository outboundOrderRepository;

    @GetMapping("/inbound")
    @Operation(summary = "Lấy danh sách đơn nhập hàng PO", description = "Trả về toàn bộ danh sách đơn đặt mua hàng từ nhà cung cấp")
    public ApiResponse<List<com.wms.module.order.entity.InboundOrder>> getAllInboundOrders() {
        List<com.wms.module.order.entity.InboundOrder> orders = inboundOrderRepository.findAll();
        return ApiResponse.success("Lấy danh sách đơn nhập kho thành công!", orders);
    }

    @PostMapping("/inbound")
    @Operation(summary = "Tạo mới đơn nhập hàng PO", description = "Tạo mới đơn nhập hàng từ nhà cung ứng với danh sách sản phẩm và số lượng")
    public ApiResponse<com.wms.module.order.entity.InboundOrder> createInboundOrder(@RequestBody com.wms.module.order.entity.InboundOrder order) {
        if (order.getOrderCode() == null || order.getOrderCode().isBlank()) {
            order.setOrderCode("PO-" + System.currentTimeMillis() % 1000000);
        }
        order.setStatus("PENDING");
        order.setCreatedAt(java.time.Instant.now());
        order.setUpdatedAt(java.time.Instant.now());
        if (order.getItems() != null) {
            for (com.wms.module.order.entity.InboundOrderItem item : order.getItems()) {
                item.setInboundOrder(order);
                item.setStatus("PENDING");
            }
        }
        com.wms.module.order.entity.InboundOrder saved = inboundOrderRepository.save(order);
        return ApiResponse.success("Tạo đơn nhập kho thành công!", saved);
    }

    @PutMapping("/inbound/{id}/receive")
    @Operation(summary = "Tiếp nhận và nhập kho đơn hàng PO", description = "Xác nhận nhận đủ hàng và chuyển trạng thái đơn sang RECEIVED")
    public ApiResponse<com.wms.module.order.entity.InboundOrder> receiveInboundOrder(@PathVariable Long id) {
        com.wms.module.order.entity.InboundOrder order = inboundOrderRepository.findById(id)
                .orElseThrow(() -> new com.wms.common.exception.BusinessException(com.wms.common.exception.ErrorCode.NOT_FOUND, "Không tìm thấy đơn nhập: " + id));
        order.setStatus("RECEIVED");
        order.setUpdatedAt(java.time.Instant.now());
        if (order.getItems() != null) {
            for (com.wms.module.order.entity.InboundOrderItem item : order.getItems()) {
                item.setReceivedQty(item.getExpectedQty());
                item.setStatus("COMPLETED");
            }
        }
        com.wms.module.order.entity.InboundOrder saved = inboundOrderRepository.save(order);
        return ApiResponse.success("Tiếp nhận đơn hàng nhập kho thành công!", saved);
    }

    @GetMapping("/outbound")
    @Operation(summary = "Lấy danh sách đơn xuất hàng SO", description = "Trả về toàn bộ danh sách đơn bán hàng xuất kho")
    public ApiResponse<List<com.wms.module.order.entity.OutboundOrder>> getAllOutboundOrders() {
        List<com.wms.module.order.entity.OutboundOrder> orders = outboundOrderRepository.findAll();
        return ApiResponse.success("Lấy danh sách đơn xuất kho thành công!", orders);
    }

    @PostMapping("/outbound")
    @Operation(summary = "Tạo mới đơn xuất hàng SO", description = "Tạo mới đơn xuất hàng bán cho khách hàng")
    public ApiResponse<com.wms.module.order.entity.OutboundOrder> createOutboundOrder(@RequestBody com.wms.module.order.entity.OutboundOrder order) {
        if (order.getOrderCode() == null || order.getOrderCode().isBlank()) {
            order.setOrderCode("SO-" + System.currentTimeMillis() % 1000000);
        }
        order.setStatus("PENDING");
        order.setCreatedAt(java.time.Instant.now());
        order.setUpdatedAt(java.time.Instant.now());
        if (order.getItems() != null) {
            for (com.wms.module.order.entity.OutboundOrderItem item : order.getItems()) {
                item.setOutboundOrder(order);
            }
        }
        com.wms.module.order.entity.OutboundOrder saved = outboundOrderRepository.save(order);
        return ApiResponse.success("Tạo đơn xuất kho thành công!", saved);
    }

    @PutMapping("/outbound/{id}/dispatch")
    @Operation(summary = "Xuất kho và bàn giao vận chuyển đơn SO", description = "Chuyển trạng thái đơn thành DISPATCHED")
    public ApiResponse<com.wms.module.order.entity.OutboundOrder> dispatchOutboundOrder(@PathVariable Long id) {
        com.wms.module.order.entity.OutboundOrder order = outboundOrderRepository.findById(id)
                .orElseThrow(() -> new com.wms.common.exception.BusinessException(com.wms.common.exception.ErrorCode.NOT_FOUND, "Không tìm thấy đơn xuất: " + id));
        order.setStatus("DISPATCHED");
        order.setUpdatedAt(java.time.Instant.now());
        com.wms.module.order.entity.OutboundOrder saved = outboundOrderRepository.save(order);
        return ApiResponse.success("Xuất kho và bàn giao vận chuyển thành công!", saved);
    }

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
