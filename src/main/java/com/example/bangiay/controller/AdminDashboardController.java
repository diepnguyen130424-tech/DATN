package com.example.bangiay.controller;

import com.example.bangiay.service.DashboardStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class AdminDashboardController {

    private final DashboardStatsService dashboardStatsService;

    @GetMapping("/thong-ke")
    public ResponseEntity<Map<String, Object>> getOverview(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tuNgay,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate denNgay,

            @RequestParam(required = false) String trangThai,
            @RequestParam(required = false) String loaiHoaDon,
            @RequestParam(required = false) String phuongThucThanhToan
    ) {
        if (tuNgay != null && denNgay != null && tuNgay.isAfter(denNgay)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Từ ngày không được lớn hơn đến ngày"
            ));
        }

        return ResponseEntity.ok(dashboardStatsService.getOverview(
                tuNgay,
                denNgay,
                trangThai,
                loaiHoaDon,
                phuongThucThanhToan
        ));
    }
}
