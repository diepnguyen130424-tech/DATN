package com.example.bangiay.controller;

import com.example.bangiay.dto.ShipQuote;
import com.example.bangiay.service.ShippingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ship")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class ShippingController {

    private final ShippingService shippingService;
    private final com.example.bangiay.service.GhnClient ghnClient;

    /** GET /api/ship/tinh-phi?diaChi=... -> khoảng cách + phí ship */
    @GetMapping("/tinh-phi")
    public ResponseEntity<ShipQuote> tinhPhi(@RequestParam String diaChi,
                                             @RequestParam(defaultValue = "1") int soLuong,
                                             @RequestParam(required = false) String tinh,
                                             @RequestParam(required = false) String xa) {
        return ResponseEntity.ok(shippingService.tinhPhi(diaChi, soLuong, tinh, xa));
    }

    /** GET /api/ship/ghn-check?tinh=...&xa=... -> kiểm tra cấu hình/kết nối GHN (chỉ dùng khi phát triển) */
    @GetMapping("/ghn-check")
    public ResponseEntity<java.util.Map<String, Object>> ghnCheck(@RequestParam(defaultValue = "Thành phố Hà Nội") String tinh,
                                                                 @RequestParam(defaultValue = "Xã Thư Lâm") String xa) {
        return ResponseEntity.ok(ghnClient.chanDoan(tinh, xa));
    }
}
