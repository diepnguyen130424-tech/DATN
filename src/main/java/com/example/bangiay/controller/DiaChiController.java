package com.example.bangiay.controller;

import com.example.bangiay.entity.DiaChi;
import com.example.bangiay.service.DiaChiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dia-chi")
@RequiredArgsConstructor
public class DiaChiController {

    private final DiaChiService diaChiService;

    @GetMapping("/khach-hang/{khachHangId}")
    public ResponseEntity<List<DiaChi>> getByKhachHangId(
            @PathVariable Long khachHangId) {

        return ResponseEntity.ok(
                diaChiService.getByKhachHangId(khachHangId)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiaChi> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                diaChiService.getById(id)
        );
    }

    @PostMapping
    public ResponseEntity<DiaChi> create(
            @RequestBody DiaChi diaChi) {

        return ResponseEntity.ok(
                diaChiService.save(diaChi)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<DiaChi> update(
            @PathVariable Long id,
            @RequestBody DiaChi diaChi) {

        return ResponseEntity.ok(
                diaChiService.update(id, diaChi)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        diaChiService.delete(id);
        return ResponseEntity.noContent().build();
    }
}