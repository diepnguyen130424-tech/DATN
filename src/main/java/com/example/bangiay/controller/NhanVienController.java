package com.example.bangiay.controller;

import com.example.bangiay.entity.NhanVien;
import com.example.bangiay.service.NhanVienService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nhan-vien")
@RequiredArgsConstructor
public class NhanVienController {

    private final NhanVienService nhanVienService;

    @GetMapping
    public ResponseEntity<List<NhanVien>> getAll() {
        return ResponseEntity.ok(nhanVienService.getAll());
    }

    @GetMapping("/tai-khoan/{taiKhoanId}")
    public ResponseEntity<NhanVien> getByTaiKhoanId(
            @PathVariable Long taiKhoanId) {
        return ResponseEntity.ok(
                nhanVienService.getByTaiKhoanId(taiKhoanId)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<NhanVien> getById(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                nhanVienService.getById(id)
        );
    }

    @PostMapping
    public ResponseEntity<NhanVien> create(
            @RequestBody NhanVien nhanVien) {
        return ResponseEntity.ok(
                nhanVienService.create(nhanVien)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<NhanVien> update(
            @PathVariable Long id,
            @RequestBody NhanVien nhanVien) {
        return ResponseEntity.ok(
                nhanVienService.update(id, nhanVien)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {
        nhanVienService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
