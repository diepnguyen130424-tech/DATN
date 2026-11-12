package com.example.bangiay.controller;

import com.example.bangiay.entity.SanPham;
import com.example.bangiay.entity.SanPhamChiTiet;
import com.example.bangiay.service.SanPhamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/san-pham")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class SanPhamController {

    private final SanPhamService sanPhamService;

    @GetMapping
    public ResponseEntity<List<SanPham>> getAll() {
        return ResponseEntity.ok(sanPhamService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SanPham> getById(@PathVariable Long id) {
        return ResponseEntity.ok(sanPhamService.getById(id));
    }

    @PostMapping
    public ResponseEntity<SanPham> create(
            @RequestBody SanPham sanPham
    ) {
        return ResponseEntity.ok(
                sanPhamService.save(sanPham)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<SanPham> update(
            @PathVariable Long id,
            @RequestBody SanPham sanPham
    ) {
        sanPham.setId(id);

        return ResponseEntity.ok(
                sanPhamService.save(sanPham)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            sanPhamService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping("/{sanPhamId}/chi-tiet")
    public ResponseEntity<List<SanPhamChiTiet>> getChiTietBySanPhamId(
            @PathVariable Long sanPhamId
    ) {
        return ResponseEntity.ok(
                sanPhamService.getChiTietBySanPhamId(sanPhamId)
        );
    }

    @GetMapping("/chi-tiet/{id}")
    public ResponseEntity<SanPhamChiTiet> getChiTietById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                sanPhamService.getChiTietById(id)
        );
    }

    @PostMapping("/chi-tiet")
    public ResponseEntity<SanPhamChiTiet> createChiTiet(
            @RequestBody SanPhamChiTiet sanPhamChiTiet
    ) {
        return ResponseEntity.ok(
                sanPhamService.saveChiTiet(sanPhamChiTiet)
        );
    }

    @PutMapping("/chi-tiet/{id}")
    public ResponseEntity<SanPhamChiTiet> updateChiTiet(
            @PathVariable Long id,
            @RequestBody SanPhamChiTiet sanPhamChiTiet
    ) {
        sanPhamChiTiet.setId(id);

        return ResponseEntity.ok(
                sanPhamService.saveChiTiet(sanPhamChiTiet)
        );
    }


    @DeleteMapping("/chi-tiet/{id}")
    public ResponseEntity<Void> deleteChiTiet(
            @PathVariable Long id
    ) {
        sanPhamService.deleteChiTiet(id);

        return ResponseEntity.noContent().build();
    }
}
