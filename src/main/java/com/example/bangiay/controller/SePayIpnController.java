
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

    private final SePayService sePayService;
    private final HoaDonService hoaDonService;

    @PostMapping("/checkout/{hoaDonId}")
    public ResponseEntity<Map<String, String>> taoCheckout(
            @PathVariable Long hoaDonId) {

        return ResponseEntity.ok(
                sePayService.taoCheckout(hoaDonId)
        );
    }

    @PostMapping("/ipn")
    public ResponseEntity<Map<String, Object>> receiveIpn(
            @RequestHeader(
                    value = "X-Secret-Key",
                    required = false
            ) String receivedSecret,

            @RequestBody(required = false)
            Map<String, Object> payload) {

        // 1. Xác thực Secret Key
        if (receivedSecret == null
                || receivedSecret.isBlank()
                || ipnSecretKey == null
                || ipnSecretKey.isBlank()
                || !MessageDigest.isEqual(
                ipnSecretKey.getBytes(StandardCharsets.UTF_8),
                receivedSecret.getBytes(StandardCharsets.UTF_8)
        )) {

            System.err.println(
                    "SePay IPN: Xác thực X-Secret-Key thất bại"
            );

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "message", "Unauthorized"
                    ));
        }

        // 2. Kiểm tra payload
        if (payload == null || payload.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", "Empty payload"
                    ));
        }

        try {
            Object notificationType =
                    payload.get("notification_type");

            System.out.println(
                    "SePay IPN nhận được: " + notificationType
            );

            // 3. Xử lý thanh toán và tự động cập nhật đơn hàng
            hoaDonService.xuLyIpnSePay(payload);

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "IPN processed successfully"
                    )
            );

        } catch (Exception e) {

            System.err.println(
                    "Lỗi xử lý SePay IPN: " + e.getMessage()
            );

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", "IPN processing failed"
                    ));
        }
    }
}
