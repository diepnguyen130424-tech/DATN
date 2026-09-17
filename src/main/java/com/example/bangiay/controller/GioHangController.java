package com.example.bangiay.controller;

import com.example.bangiay.entity.ChiTietGioHang;
import com.example.bangiay.entity.GioHang;
import com.example.bangiay.service.GioHangService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gio-hang")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class GioHangController {

    private final GioHangService gioHangService;

    @GetMapping
    public ResponseEntity<List<GioHang>> getAll() {
        return ResponseEntity.ok(gioHangService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GioHang> getById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(gioHangService.getById(id));
    }

    @GetMapping("/khach-hang/{khachHangId}")
    public ResponseEntity<GioHang> getByKhachHangId(
            @PathVariable Long khachHangId
    ) {
        return ResponseEntity.ok(
                gioHangService.getByKhachHangId(khachHangId)
        );
    }

    @PostMapping
    public ResponseEntity<GioHang> create(
            @RequestBody GioHang gioHang
    ) {
        return ResponseEntity.ok(
                gioHangService.save(gioHang)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<GioHang> update(
            @PathVariable Long id,
            @RequestBody GioHang gioHang
    ) {
        gioHang.setId(id);

        return ResponseEntity.ok(
                gioHangService.save(gioHang)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        gioHangService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{gioHangId}/chi-tiet")
    public ResponseEntity<List<ChiTietGioHang>> getChiTiet(
            @PathVariable Long gioHangId
    ) {
        return ResponseEntity.ok(
                gioHangService.getChiTietByGioHangId(gioHangId)
        );
    }

    @GetMapping("/chi-tiet/{id}")
    public ResponseEntity<ChiTietGioHang> getChiTietById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                gioHangService.getChiTietById(id)
        );
    }

    @PostMapping("/chi-tiet")
    public ResponseEntity<ChiTietGioHang> createChiTiet(
            @RequestBody ChiTietGioHang chiTietGioHang
    ) {
        return ResponseEntity.ok(
                gioHangService.saveChiTiet(chiTietGioHang)
        );
    }

    @PutMapping("/chi-tiet/{id}")
    public ResponseEntity<ChiTietGioHang> updateChiTiet(
            @PathVariable Long id,
            @RequestBody ChiTietGioHang chiTietGioHang
    ) {
        chiTietGioHang.setId(id);

        return ResponseEntity.ok(
                gioHangService.saveChiTiet(chiTietGioHang)
        );
    }

    @DeleteMapping("/chi-tiet/{id}")
    public ResponseEntity<Void> deleteChiTiet(
            @PathVariable Long id
    ) {
        gioHangService.deleteChiTiet(id);
        return ResponseEntity.noContent().build();
    }



}
