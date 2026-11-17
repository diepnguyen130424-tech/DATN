package com.example.bangiay.controller;

import com.example.bangiay.service.DashboardStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
    @GetMapping("/xuat-excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tuNgay,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate denNgay,
            @RequestParam(required = false) String trangThai,
            @RequestParam(required = false) String loaiHoaDon,
            @RequestParam(required = false) String phuongThucThanhToan
    ) {
        if (tuNgay != null && denNgay != null && tuNgay.isAfter(denNgay)) {
            return ResponseEntity.badRequest().build();
        }
        byte[] file = dashboardStatsService.exportOverviewExcel(
                tuNgay, denNgay, trangThai, loaiHoaDon, phuongThucThanhToan
        );
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=fshop-tong-quan.xlsx")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(file);
    }
}
