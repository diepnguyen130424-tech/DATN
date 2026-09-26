package com.example.bangiay.controller;

import com.example.bangiay.entity.MaGiamGia;
import com.example.bangiay.service.MaGiamGiaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ma-giam-gia")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class MaGiamGiaController {

    private final MaGiamGiaService maGiamGiaService;


    @GetMapping
    public ResponseEntity<List<MaGiamGia>> getAll() {
        return ResponseEntity.ok(
                maGiamGiaService.getAll()
        );
    }

    @GetMapping("/dang-hoat-dong")
    public ResponseEntity<List<MaGiamGia>> getDangHoatDong() {
        return ResponseEntity.ok(
                maGiamGiaService.getDangHoatDong()
        );
    }


    @GetMapping("/{id}")
    public ResponseEntity<MaGiamGia> getById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                maGiamGiaService.getById(id)
        );
    }

    @GetMapping("/ma/{maVoucher}")
    public ResponseEntity<MaGiamGia> getByMaVoucher(
            @PathVariable String maVoucher
    ) {
        return ResponseEntity.ok(
                maGiamGiaService.getByMaVoucher(maVoucher)
        );
    }

    @PostMapping
    public ResponseEntity<MaGiamGia> create(
            @RequestBody MaGiamGia maGiamGia
    ) {
        return ResponseEntity.ok(
                maGiamGiaService.save(maGiamGia)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaGiamGia> update(
            @PathVariable Long id,
            @RequestBody MaGiamGia maGiamGia
    ) {
        maGiamGia.setId(id);

        return ResponseEntity.ok(
                maGiamGiaService.save(maGiamGia)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        maGiamGiaService.delete(id);

        return ResponseEntity.noContent().build();
    }
    // ⭐ MỚI — KIỂM TRA VOUCHER
    @PostMapping("/kiem-tra")
    public ResponseEntity<?> kiemTra(
            @RequestBody Map<String, Object> body
    ) {
        try {
            String ma = (String) body.get("ma");
            BigDecimal tongTien = new BigDecimal(
                    body.get("tongTien").toString()
            );

            return ResponseEntity.ok(
                    maGiamGiaService.kiemTraVoucher(ma, tongTien)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
