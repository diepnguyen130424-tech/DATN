package com.example.bangiay.controller;

import com.example.bangiay.dto.ChuongTrinhGiamGiaRequest;
import com.example.bangiay.dto.ChuongTrinhGiamGiaResponse;
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

    private final ChuongTrinhGiamGiaService service;

    // ⭐ Public cho khách hàng — đặt TRƯỚC /{id}
    @GetMapping("/dang-hoat-dong")
    public ResponseEntity<List<ChuongTrinhGiamGiaResponse>> getDangHoatDong() {
        return ResponseEntity.ok(service.getDangHoatDong());
    }

    @GetMapping
    public ResponseEntity<List<ChuongTrinhGiamGiaResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChuongTrinhGiamGiaResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<ChuongTrinhGiamGiaResponse> create(
            @RequestBody ChuongTrinhGiamGiaRequest req) {
        return ResponseEntity.ok(service.save(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChuongTrinhGiamGiaResponse> update(
            @PathVariable Long id,
            @RequestBody ChuongTrinhGiamGiaRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}