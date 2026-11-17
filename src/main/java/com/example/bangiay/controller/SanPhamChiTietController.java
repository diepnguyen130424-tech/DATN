package com.example.bangiay.controller;

import com.example.bangiay.entity.SanPhamChiTiet;
import com.example.bangiay.service.SanPhamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/san-pham-chi-tiet")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class SanPhamChiTietController {

    private final SanPhamService sanPhamService;

    @GetMapping
    public ResponseEntity<List<SanPhamChiTiet>> getAll() {
        return ResponseEntity.ok(
                sanPhamService.getAllChiTiet()
        );
    }

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
    public ResponseEntity<?> create(
            @RequestBody SanPhamChiTiet sanPhamChiTiet) {
        try {
            return ResponseEntity.ok(sanPhamService.saveChiTiet(sanPhamChiTiet));
        } catch (IllegalArgumentException ex) {
            return buildValidationError(ex);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody SanPhamChiTiet sanPhamChiTiet) {
        try {
            sanPhamChiTiet.setId(id);
            return ResponseEntity.ok(sanPhamService.saveChiTiet(sanPhamChiTiet));
        } catch (IllegalArgumentException ex) {
            return buildValidationError(ex);
        }
    }

    /** Trả lỗi nghiệp vụ có cấu trúc thống nhất để Frontend đọc được message. */
    private ResponseEntity<Map<String, String>> buildValidationError(IllegalArgumentException ex) {
        String message = (ex.getMessage() == null || ex.getMessage().isBlank())
                ? "Dữ liệu biến thể không hợp lệ."
                : ex.getMessage();
        boolean conflict = message.toLowerCase(Locale.ROOT).contains("trùng")
                || message.toLowerCase(Locale.ROOT).contains("đã tồn tại");

        return ResponseEntity.status(conflict ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "error", conflict ? "DUPLICATE_VARIANT" : "VALIDATION_ERROR",
                        "message", message
                ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        sanPhamService.deleteChiTiet(id);

        return ResponseEntity.noContent().build();
    }
}