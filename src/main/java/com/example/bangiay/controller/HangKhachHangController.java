package com.example.bangiay.controller;

import com.example.bangiay.service.HangKhachHangService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hang-khach-hang")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175"
})
public class HangKhachHangController {

    private final HangKhachHangService hangKhachHangService;

    // Danh sách các hạng + mốc chi tiêu (đặt TRƯỚC /{khachHangId})
    @GetMapping("/cac-hang")
    public ResponseEntity<List<Map<String, Object>>> cacHang() {
        return ResponseEntity.ok(hangKhachHangService.danhSachHang());
    }

    // Hạng + tổng chi tiêu + tiến độ lên hạng của 1 khách hàng
    @GetMapping("/{khachHangId}")
    public ResponseEntity<Map<String, Object>> thongTin(@PathVariable Long khachHangId) {
        return ResponseEntity.ok(hangKhachHangService.thongTinHang(khachHangId));
    }
}