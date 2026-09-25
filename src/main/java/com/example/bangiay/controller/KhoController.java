package com.example.bangiay.controller;

import com.example.bangiay.dto.*;
import com.example.bangiay.entity.Kho;
import com.example.bangiay.entity.NhaCungCap;
import com.example.bangiay.service.KhoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kho")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class KhoController {

    private final KhoService khoService;

    @GetMapping("/overview")
    public ResponseEntity<KhoOverviewResponse> overview() {
        return ResponseEntity.ok(khoService.getOverview());
    }

    @GetMapping("/ton-kho")
    public ResponseEntity<List<TonKhoResponse>> tonKho(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String trangThai) {
        return ResponseEntity.ok(khoService.getTonKho(keyword, trangThai));
    }

    @GetMapping("/danh-sach")
    public ResponseEntity<List<Kho>> danhSachKho() {
        return ResponseEntity.ok(khoService.getAllKho());
    }

    @GetMapping("/nha-cung-cap")
    public ResponseEntity<List<NhaCungCap>> nhaCungCap() {
        return ResponseEntity.ok(khoService.getAllNhaCungCap());
    }

    @PostMapping("/nha-cung-cap")
    public ResponseEntity<NhaCungCap> taoNhaCungCap(
            @RequestBody NhaCungCap nhaCungCap) {
        return ResponseEntity.ok(khoService.taoNhaCungCap(nhaCungCap));
    }

    @GetMapping("/phieu")
    public ResponseEntity<List<PhieuKhoResponse>> phieuKho() {
        return ResponseEntity.ok(khoService.getPhieuKho());
    }

    @GetMapping("/phieu/{id}")
    public ResponseEntity<PhieuKhoResponse> phieuKho(
            @PathVariable Long id) {
        return ResponseEntity.ok(khoService.getPhieuById(id));
    }

    @PostMapping("/phieu")
    public ResponseEntity<PhieuKhoResponse> taoPhieu(
            @RequestBody KhoPhieuRequest request) {
        return ResponseEntity.ok(khoService.taoPhieu(request));
    }

    @GetMapping("/bien-dong")
    public ResponseEntity<List<BienDongKhoResponse>> bienDong() {
        return ResponseEntity.ok(khoService.getBienDong());
    }
}
