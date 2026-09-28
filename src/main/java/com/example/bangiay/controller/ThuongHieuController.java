package com.example.bangiay.controller;

import com.example.bangiay.entity.ThuongHieu;
import com.example.bangiay.service.ThuongHieuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/thuong-hieu")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class ThuongHieuController {

    private final ThuongHieuService thuongHieuService;

    @GetMapping
    public ResponseEntity<List<ThuongHieu>> getAll() {
        return ResponseEntity.ok(thuongHieuService.getAll());
    }

    /** {thuongHieuId: soSanPham} - dùng cho cột "Số sản phẩm" */
    @GetMapping("/thong-ke")
    public ResponseEntity<Map<Long, Long>> thongKe() {
        return ResponseEntity.ok(thuongHieuService.thongKeSoSanPham());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ThuongHieu> getById(@PathVariable Long id) {
        return ResponseEntity.ok(thuongHieuService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ThuongHieu> create(@RequestBody ThuongHieu thuongHieu) {
        return ResponseEntity.ok(thuongHieuService.create(thuongHieu));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ThuongHieu> update(
            @PathVariable Long id,
            @RequestBody ThuongHieu thuongHieu) {
        return ResponseEntity.ok(thuongHieuService.update(id, thuongHieu));
    }

    /** Xóa mềm -> NGUNG_HOAT_DONG */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        thuongHieuService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Xóa hẳn khỏi database (chỉ khi chưa có sản phẩm dùng) */
    @DeleteMapping("/{id}/vinh-vien")
    public ResponseEntity<Void> xoaVinhVien(@PathVariable Long id) {
        thuongHieuService.xoaVinhVien(id);
        return ResponseEntity.noContent().build();
    }
}
