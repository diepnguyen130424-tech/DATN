package com.example.bangiay.controller;

import com.example.bangiay.service.HoaDonService;
import com.example.bangiay.service.SePayService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@RestController
@RequestMapping("/api/sepay")
@RequiredArgsConstructor
public class SePayIpnController {

    @Value("${sepay.ipn.secret-key:}")
    private String ipnSecretKey;

    // Chỉ bật cho demo đồ án; tắt bằng sepay.demo.enabled=false khi chạy thanh toán thật.
    @Value("${sepay.demo.enabled:false}")
    private boolean demoEnabled;

    private final SePayService sePayService;
    private final HoaDonService hoaDonService;

    @PostMapping("/checkout/{hoaDonId}")
    public ResponseEntity<Map<String, String>> taoCheckout(
            @PathVariable Long hoaDonId) {

        return ResponseEntity.ok(
                sePayService.taoCheckout(hoaDonId)
        );
    }

    /**
     * Endpoint giả lập dành cho trình diễn đồ án.
     * Không truy cập quan hệ LAZY thanhToan.hoaDon sau khi service đã kết thúc.
     */
    @PostMapping("/demo-confirm/{hoaDonId}")
    public ResponseEntity<Map<String, Object>> xacNhanThanhToanDemo(
            @PathVariable Long hoaDonId) {
        if (!demoEnabled) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "Chế độ thanh toán demo đang bị tắt."
            ));
        }

        try {
            // Lấy bản ghi thanh toán theo ID hóa đơn.
            var thanhToan = hoaDonService.getThanhToanByHoaDonId(hoaDonId);
            if (thanhToan == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Không tìm thấy thông tin thanh toán của đơn hàng."
                ));
            }

            // Truy vấn hóa đơn riêng bằng ID, không gọi thanhToan.getHoaDon()
            // vì quan hệ này được cấu hình FetchType.LAZY.
            var hoaDon = hoaDonService.getById(hoaDonId);

            if (!"ONLINE".equalsIgnoreCase(hoaDon.getLoaiHoaDon())
                    || !"CHUYEN_KHOAN".equalsIgnoreCase(thanhToan.getPhuongThuc())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Chỉ hỗ trợ giả lập thanh toán chuyển khoản cho đơn hàng online."
                ));
            }

            if (thanhToan.getSoTien() == null || hoaDon.getMaHoaDon() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Đơn hàng thiếu số tiền hoặc mã hóa đơn."
                ));
            }

            Map<String, Object> order = new java.util.LinkedHashMap<>();
            order.put("order_status", "CAPTURED");
            order.put("order_invoice_number", hoaDon.getMaHoaDon());
            order.put("order_currency", "VND");
            order.put("order_amount", thanhToan.getSoTien().toPlainString());

            Map<String, Object> transaction = new java.util.LinkedHashMap<>();
            transaction.put("transaction_status", "APPROVED");
            transaction.put("transaction_currency", "VND");
            transaction.put("transaction_amount", thanhToan.getSoTien().toPlainString());
            transaction.put("transaction_id", "DEMO-" + hoaDonId + "-" + System.currentTimeMillis());

            Map<String, Object> payload = new java.util.LinkedHashMap<>();
            payload.put("notification_type", "ORDER_PAID");
            payload.put("order", order);
            payload.put("transaction", transaction);

            // Giữ nguyên luồng xử lý IPN: cập nhật thanh toán và xác nhận đơn hàng.
            hoaDonService.xuLyIpnSePay(payload);

            var paymentUpdated = hoaDonService.getThanhToanByHoaDonId(hoaDonId);
            var invoiceUpdated = hoaDonService.getById(hoaDonId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Giả lập thanh toán thành công. Đơn hàng đã được xác nhận.",
                    "hoaDonId", hoaDonId,
                    "maHoaDon", invoiceUpdated.getMaHoaDon(),
                    "trangThaiThanhToan", paymentUpdated.getTrangThai(),
                    "trangThaiDonHang", invoiceUpdated.getTrangThai()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage() == null ? "Không thể xác nhận thanh toán demo." : e.getMessage()
            ));
        }
    }

    /**
     * Hủy đơn đang chờ thanh toán từ màn hình QR demo và hoàn kho một lần.
     */
    @PostMapping("/demo-cancel/{hoaDonId}")
    public ResponseEntity<Map<String, Object>> huyThanhToanDemo(
            @PathVariable Long hoaDonId) {
        if (!demoEnabled) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "Chế độ thanh toán demo đang bị tắt."
            ));
        }
        try {
            var hoaDon = hoaDonService.huyThanhToanChuyenKhoanDemo(hoaDonId);
            var thanhToan = hoaDonService.getThanhToanByHoaDonId(hoaDonId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã hủy đơn hàng và hoàn lại tồn kho.",
                    "hoaDonId", hoaDonId,
                    "trangThaiDonHang", hoaDon.getTrangThai(),
                    "trangThaiThanhToan", thanhToan.getTrangThai()
            ));
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of(
                    "success", false,
                    "message", e.getReason() == null ? "Không thể hủy đơn hàng." : e.getReason()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage() == null ? "Không thể hủy đơn hàng." : e.getMessage()
            ));
        }
    }

    @PostMapping("/ipn")
    public ResponseEntity<Map<String, Object>> receiveIpn(
            @RequestHeader(value = "X-Secret-Key", required = false) String receivedSecret,
            @RequestBody(required = false) Map<String, Object> payload) {

        // 1. Xác thực Secret Key
        if (receivedSecret == null
                || receivedSecret.isBlank()
                || ipnSecretKey == null
                || ipnSecretKey.isBlank()
                || !MessageDigest.isEqual(
                ipnSecretKey.getBytes(StandardCharsets.UTF_8),
                receivedSecret.getBytes(StandardCharsets.UTF_8))) {

            System.err.println("SePay IPN: Xác thực X-Secret-Key thất bại");

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "Unauthorized"
            ));
        }

        // 2. Kiểm tra payload
        if (payload == null || payload.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Empty payload"
            ));
        }

        try {
            Object notificationType = payload.get("notification_type");
            System.out.println("SePay IPN nhận được: " + notificationType);

            // 3. Xử lý thanh toán và tự động cập nhật đơn hàng
            hoaDonService.xuLyIpnSePay(payload);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "IPN processed successfully"
            ));
        } catch (Exception e) {
            System.err.println("Lỗi xử lý SePay IPN: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "IPN processing failed"
            ));
        }
    }
}
