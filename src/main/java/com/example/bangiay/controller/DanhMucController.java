package com.example.bangiay.controller;

import com.example.bangiay.entity.DanhMuc;
import com.example.bangiay.service.DanhMucService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/danh-muc")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class DanhMucController {

    private final DanhMucService danhMucService;

    @GetMapping
    public ResponseEntity<List<DanhMuc>> getAll() {
        return ResponseEntity.ok(danhMucService.getAll());
    }

    /** {danhMucId: soSanPham} - dùng cho cột "Số sản phẩm" */
    @GetMapping("/thong-ke")
    public ResponseEntity<Map<Long, Long>> thongKe() {
        return ResponseEntity.ok(danhMucService.thongKeSoSanPham());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DanhMuc> getById(@PathVariable Long id) {
        return ResponseEntity.ok(danhMucService.getById(id));
    }

    @PostMapping
    public ResponseEntity<DanhMuc> create(@RequestBody DanhMuc danhMuc) {
        return ResponseEntity.ok(danhMucService.create(danhMuc));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DanhMuc> update(
            @PathVariable Long id,
            @RequestBody DanhMuc danhMuc) {
        return ResponseEntity.ok(danhMucService.update(id, danhMuc));
    }

    /** Xóa mềm -> NGUNG_HOAT_DONG */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        danhMucService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Xóa hẳn khỏi database (chỉ khi chưa có sản phẩm dùng) */
    @DeleteMapping("/{id}/vinh-vien")
    public ResponseEntity<Void> xoaVinhVien(@PathVariable Long id) {
        danhMucService.xoaVinhVien(id);
        return ResponseEntity.noContent().build();
    }
}
