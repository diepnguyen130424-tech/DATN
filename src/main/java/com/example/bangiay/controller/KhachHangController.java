package com.example.bangiay.controller;

import com.example.bangiay.entity.KhachHang;
import com.example.bangiay.service.KhachHangService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/khach-hang")
@RequiredArgsConstructor
public class KhachHangController {

    private final KhachHangService khachHangService;

    @GetMapping
    public ResponseEntity<List<KhachHang>> getAll() {
        return ResponseEntity.ok(khachHangService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<KhachHang> getById(@PathVariable Long id) {
        return ResponseEntity.ok(khachHangService.getById(id));
    }

    @GetMapping("/tai-khoan/{taiKhoanId}")
    public ResponseEntity<KhachHang> getByTaiKhoanId(
            @PathVariable Long taiKhoanId) {

        return ResponseEntity.ok(
                khachHangService.getByTaiKhoanId(taiKhoanId)
        );
    }

    @PostMapping
    public ResponseEntity<KhachHang> create(
            @RequestBody KhachHang khachHang) {

        return ResponseEntity.ok(
                khachHangService.save(khachHang)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<KhachHang> update(
            @PathVariable Long id,
            @RequestBody KhachHang khachHang) {

        KhachHang existing = khachHangService.getById(id);

        existing.setHoTen(khachHang.getHoTen());
        existing.setSoDienThoai(khachHang.getSoDienThoai());
        existing.setNgaySinh(khachHang.getNgaySinh());
        existing.setGioiTinh(khachHang.getGioiTinh());

        return ResponseEntity.ok(
                khachHangService.save(existing)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {

        khachHangService.delete(id);

        return ResponseEntity.noContent().build();
    }
}