package com.wms.module.order.controller;



import com.wms.common.response.ApiResponse;

import com.wms.module.masterdata.entity.Location;

import com.wms.module.order.dto.request.FefoOrderRequest;

import com.wms.module.order.dto.request.ReceiveInboundRequest;

import com.wms.module.order.dto.request.SuggestLocationRequest;

import com.wms.module.order.dto.response.PickListItemResponse;

import com.wms.module.order.entity.InboundOrder;

import com.wms.module.order.entity.OutboundOrder;

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

@Tag(name = "5. Điều Phối Đơn Hàng (Order Operations)", description = "APIs quản lý đơn nhập PO, xuất SO, thuật toán Put-away và FEFO")

public class OrderController {



    private final InboundService inboundService;

    private final OutboundService outboundService;



    @GetMapping("/inbound")

    @Operation(summary = "Lấy danh sách đơn nhập hàng PO", description = "Trả về danh sách đơn đặt mua hàng từ nhà cung cấp, hỗ trợ lọc theo kho")

    public ApiResponse<List<InboundOrder>> getAllInboundOrders(@RequestParam(required = false) Long warehouseId) {

        return ApiResponse.success("Lấy danh sách đơn nhập kho thành công!", inboundService.getAllInboundOrders(warehouseId));

    }



    @PostMapping("/inbound")

    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")

    @Operation(summary = "Tạo mới đơn nhập hàng PO", description = "Tạo mới đơn nhập hàng từ nhà cung ứng với danh sách sản phẩm và số lượng")

    public ApiResponse<InboundOrder> createInboundOrder(@Valid @RequestBody com.wms.module.order.dto.request.CreateInboundOrderRequest request) {

        return ApiResponse.success("Tạo đơn nhập kho thành công!", inboundService.createInboundOrder(request));

    }



    @PutMapping("/inbound/{id}/receive")

    @Operation(summary = "Ghi số thực nhận, số lỗi và lô theo từng dòng PO")

    public ApiResponse<InboundOrder> receiveInboundOrder(@PathVariable Long id, @Valid @RequestBody ReceiveInboundRequest request) {

        return ApiResponse.success("Tiếp nhận đơn hàng nhập kho thành công!", inboundService.receiveInboundOrder(id, request));

    }

    @PutMapping("/inbound/{id}/close")
    @Operation(summary = "Đóng đơn nhập kho và hủy phần thừa")
    public ApiResponse<InboundOrder> closeInboundOrder(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Vượt sức chứa kho") String reason) {
        return ApiResponse.success("Đóng đơn nhập kho thành công!", inboundService.closeInboundOrder(id, reason));
    }



    @PostMapping("/inbound/putaway")

    @Operation(summary = "Thực hiện cất hàng lên ô kệ (Put-away Execution)",

               description = "Chuyển hàng từ khu đệm Staging lên ô kệ, tăng số lượng On-hand và ghi sổ cái bất biến.")

    public ApiResponse<InboundOrder> executePutaway(@Valid @RequestBody com.wms.module.order.dto.request.ExecutePutawayRequest request) {

        return ApiResponse.success("Cất hàng lên ô kệ thành công!", inboundService.executePutaway(request));

    }



    @GetMapping("/outbound")

    @Operation(summary = "Lấy danh sách đơn xuất hàng SO", description = "Trả về toàn bộ danh sách đơn bán hàng xuất kho")

    public ApiResponse<List<com.wms.module.order.dto.response.OutboundOrderResponse>> getAllOutboundOrders() {

        return ApiResponse.success("Lấy danh sách đơn xuất kho thành công!", outboundService.getAllOutboundOrders());

    }



    @GetMapping("/outbound/partners")

    public ApiResponse<List<com.wms.module.masterdata.entity.Supplier>> getOutboundPartners(

            @RequestParam(defaultValue = "1") Long warehouseId) {

        return ApiResponse.success(outboundService.getWarehousePartners(warehouseId));

    }



    @GetMapping("/outbound/available-products")

    public ApiResponse<List<com.wms.module.order.dto.response.OutboundStockResponse>> getOutboundProducts(@RequestParam(defaultValue = "false") boolean includeUnavailable) {

        return ApiResponse.success("Danh sách sản phẩm có thể xuất kho", outboundService.getStockProducts(includeUnavailable));

    }



    @PostMapping("/outbound")

    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")

    @Operation(summary = "Tạo mới đơn xuất hàng SO", description = "Tạo mới đơn xuất hàng bán cho khách hàng")

    public ApiResponse<com.wms.module.order.dto.response.OutboundOrderResponse> createOutboundOrder(@Valid @RequestBody com.wms.module.order.dto.request.CreateOutboundOrderRequest request) {

        return ApiResponse.success("Tạo đơn xuất kho thành công!", outboundService.createOutboundOrder(request));

    }



    @PutMapping("/outbound/{id}/allocate-fefo")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER', 'OPERATOR')")
    @Operation(summary = "Thuật toán cấp phát lô tự động theo FEFO cho đơn xuất SO", 
               description = "Tự động phân bổ các lô hàng có hạn sử dụng gần nhất (First Expired, First Out) và khóa giữ tồn kho an toàn.")
    public ApiResponse<com.wms.module.order.dto.response.OutboundOrderResponse> allocateOutboundOrderFefo(@PathVariable Long id) {
        return ApiResponse.success("Cấp phát lô hàng theo FEFO và khóa tồn thành công!", outboundService.allocateOutboundOrderFefo(id));
    }

    @PutMapping(value = {"/outbound/{id}/confirm-picking", "/outbound/{id}/start-picking"})
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER', 'OPERATOR')")
    @Operation(summary = "Xác nhận hoàn tất lấy hàng (Picking Confirmation)",
               description = "Chuyển trạng thái đơn sang PICKING khi nhân viên bắt đầu hoặc hoàn tất nhặt hàng theo lộ trình ô kệ.")
    public ApiResponse<com.wms.module.order.dto.response.OutboundOrderResponse> confirmPickingOutboundOrder(
            @PathVariable Long id,
            @RequestBody(required = false) com.wms.module.order.dto.request.ConfirmPickingRequest request) {
        return ApiResponse.success("Xác nhận lấy hàng thành công!", outboundService.confirmPicking(id, request));
    }



    @PutMapping("/outbound/{id}/dispatch")

    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER', 'OPERATOR')")

    @Operation(summary = "Xuất kho và bàn giao vận chuyển đơn SO", description = "Chuyển trạng thái đơn thành DISPATCHED")

    public ApiResponse<com.wms.module.order.dto.response.OutboundOrderResponse> dispatchOutboundOrder(@PathVariable Long id) {

        return ApiResponse.success("Xuất kho và bàn giao vận chuyển thành công!", outboundService.dispatchOutboundOrder(id));

    }



    @PutMapping("/outbound/{id}/cancel")

    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER', 'OPERATOR')")

    @Operation(summary = "Hủy đơn xuất kho và giải phóng hàng đã giữ (Release Reservation)",

               description = "Hủy đơn SO và tự động giải phóng toàn bộ số lượng tồn kho đã khóa giữ (Reserved Qty).")

    public ApiResponse<com.wms.module.order.dto.response.OutboundOrderResponse> cancelOutboundOrder(@PathVariable Long id) {

        return ApiResponse.success("Hủy đơn xuất kho và giải phóng hàng thành công!", outboundService.cancelOutboundOrder(id));

    }



    @PostMapping("/inbound/suggest-location")

    @Operation(summary = "Thuật toán gợi ý ô kệ cất hàng (Put-away Algorithm)",

               description = "Nhập phân khu và trọng lượng. Hệ thống tự động phân tích: nếu hàng nặng (>100kg) sẽ ưu tiên xếp vào tầng trệt S01 để an toàn.")

    public ApiResponse<Location> suggestPutAwayLocation(@Valid @RequestBody SuggestLocationRequest request) {

        Location location = inboundService.suggestOptimalPutAwayLocation(request.getWarehouseId(), request.getPreferredZone(), request.getTotalWeightKg());

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

