package com.example.bangiay.controller;

import com.example.bangiay.entity.SanPhamChiTiet;
import com.example.bangiay.service.SanPhamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/san-pham-chi-tiet")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class SanPhamChiTietController {

    private final SanPhamService sanPhamService;

    @GetMapping("/san-pham/{sanPhamId}")
    public ResponseEntity<List<SanPhamChiTiet>> getBySanPham(
            @PathVariable Long sanPhamId) {

        return ResponseEntity.ok(
                sanPhamService.getChiTietBySanPhamId(sanPhamId)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<SanPhamChiTiet> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                sanPhamService.getChiTietById(id)
        );
    }

    @PostMapping
    public ResponseEntity<SanPhamChiTiet> create(
            @RequestBody SanPhamChiTiet sanPhamChiTiet) {

        return ResponseEntity.ok(
                sanPhamService.saveChiTiet(sanPhamChiTiet)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<SanPhamChiTiet> update(
            @PathVariable Long id,
            @RequestBody SanPhamChiTiet sanPhamChiTiet) {

        sanPhamChiTiet.setId(id);

        return ResponseEntity.ok(
                sanPhamService.saveChiTiet(sanPhamChiTiet)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        sanPhamService.deleteChiTiet(id);

        return ResponseEntity.noContent().build();
    }
}