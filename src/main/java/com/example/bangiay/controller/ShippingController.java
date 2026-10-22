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

    /** GET /api/ship/tinh-phi?diaChi=... -> khoảng cách + phí ship */
    @GetMapping("/tinh-phi")
    public ResponseEntity<ShipQuote> tinhPhi(@RequestParam String diaChi) {
        return ResponseEntity.ok(shippingService.tinhPhi(diaChi));
    }
}
