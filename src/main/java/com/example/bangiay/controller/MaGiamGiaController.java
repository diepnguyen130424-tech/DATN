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


    // ⭐ KIỂM TRA VOUCHER
    @PostMapping("/kiem-tra")
    public ResponseEntity<?> kiemTra(
            @RequestBody Map<String, Object> body
    ) {
        try {
            String ma = (String) body.get("ma");
            BigDecimal tongTien = new BigDecimal(
                    body.get("tongTien").toString()
            );
            // ⭐ Lấy khachHangId (có thể null)
            Long khachHangId = null;
            if (body.get("khachHangId") != null) {
                khachHangId = Long.valueOf(
                        body.get("khachHangId").toString()
                );
            }

            return ResponseEntity.ok(
                    maGiamGiaService.kiemTraVoucher(ma,
                            tongTien,
                            khachHangId)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }


    // ⭐ MỚI — SAO CHÉP: TRỪ 1 LƯỢT VOUCHER
    @PostMapping("/sao-chep/{ma}")
    public ResponseEntity<?> saoChep(
            @PathVariable String ma
    ) {
        try {
            maGiamGiaService.tangSoLuongDaDung(ma);
            return ResponseEntity.ok(
                    Map.of("message", "Đã cập nhật lượt sử dụng")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }
}