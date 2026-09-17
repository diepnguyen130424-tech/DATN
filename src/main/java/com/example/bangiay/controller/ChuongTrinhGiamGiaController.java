package com.example.bangiay.controller;

import com.example.bangiay.entity.ChuongTrinhGiamGia;
import com.example.bangiay.entity.SanPhamGiamGia;
import com.example.bangiay.service.ChuongTrinhGiamGiaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chuong-trinh-giam-gia")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class ChuongTrinhGiamGiaController {

    private final ChuongTrinhGiamGiaService chuongTrinhGiamGiaService;

    @GetMapping
    public ResponseEntity<List<ChuongTrinhGiamGia>> getAll() {
        return ResponseEntity.ok(
                chuongTrinhGiamGiaService.getAll()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChuongTrinhGiamGia> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                chuongTrinhGiamGiaService.getById(id)
        );
    }

    @GetMapping("/trang-thai/{trangThai}")
    public ResponseEntity<List<ChuongTrinhGiamGia>> getByTrangThai(
            @PathVariable String trangThai) {

        return ResponseEntity.ok(
                chuongTrinhGiamGiaService.getByTrangThai(trangThai)
        );
    }

    @PostMapping
    public ResponseEntity<ChuongTrinhGiamGia> create(
            @RequestBody ChuongTrinhGiamGia chuongTrinhGiamGia) {

        return ResponseEntity.ok(
                chuongTrinhGiamGiaService.save(chuongTrinhGiamGia)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChuongTrinhGiamGia> update(
            @PathVariable Long id,
            @RequestBody ChuongTrinhGiamGia chuongTrinhGiamGia) {

        chuongTrinhGiamGia.setId(id);

        return ResponseEntity.ok(
                chuongTrinhGiamGiaService.save(chuongTrinhGiamGia)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        chuongTrinhGiamGiaService.delete(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{chuongTrinhId}/san-pham")
    public ResponseEntity<List<SanPhamGiamGia>> getSanPhamByChuongTrinh(
            @PathVariable Long chuongTrinhId) {

        return ResponseEntity.ok(
                chuongTrinhGiamGiaService
                        .getSanPhamByChuongTrinh(chuongTrinhId)
        );
    }

    @GetMapping("/san-pham/{sanPhamId}")
    public ResponseEntity<List<SanPhamGiamGia>> getChuongTrinhBySanPham(
            @PathVariable Long sanPhamId) {

        return ResponseEntity.ok(
                chuongTrinhGiamGiaService
                        .getChuongTrinhBySanPham(sanPhamId)
        );
    }

    @PostMapping("/san-pham")
    public ResponseEntity<SanPhamGiamGia> createSanPhamGiamGia(
            @RequestBody SanPhamGiamGia sanPhamGiamGia) {

        return ResponseEntity.ok(
                chuongTrinhGiamGiaService
                        .saveSanPhamGiamGia(sanPhamGiamGia)
        );
    }

    @DeleteMapping("/san-pham/{id}")
    public ResponseEntity<Void> deleteSanPhamGiamGia(
            @PathVariable Long id) {

        chuongTrinhGiamGiaService.deleteSanPhamGiamGia(id);

        return ResponseEntity.noContent().build();
    }
}
