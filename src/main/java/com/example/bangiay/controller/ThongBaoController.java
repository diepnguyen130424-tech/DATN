package com.example.bangiay.controller;

import com.example.bangiay.entity.ThongBao;
import com.example.bangiay.repository.ThongBaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/thong-bao")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175"
})
public class ThongBaoController {

    private final ThongBaoRepository thongBaoRepo;


    // =========================================================
    // KHÁCH: LẤY THÔNG BÁO CỦA MÌNH + BROADCAST
    // =========================================================

    @GetMapping("/khach-hang/{khachHangId}")
    public ResponseEntity<List<ThongBao>> getCuaKhach(
            @PathVariable Long khachHangId
    ) {
        return ResponseEntity.ok(
                thongBaoRepo
                        .findByKhachHangIdOrKhachHangIdIsNullOrderByNgayTaoDesc(
                                khachHangId));
    }


    // =========================================================
    // ĐẾM SỐ THÔNG BÁO CHƯA ĐỌC (cho badge)
    // =========================================================

    @GetMapping("/khach-hang/{khachHangId}/chua-doc")
    public ResponseEntity<Map<String, Long>> demChuaDoc(
            @PathVariable Long khachHangId
    ) {
        long count = thongBaoRepo.countByKhachHangIdAndDaDocIsFalse(
                khachHangId);
        return ResponseEntity.ok(Map.of("count", count));
    }


    // =========================================================
    // ĐÁNH DẤU ĐÃ ĐỌC
    // =========================================================

    @PatchMapping("/{id}/da-doc")
    public ResponseEntity<?> danhDauDaDoc(@PathVariable Long id) {

        return thongBaoRepo.findById(id)
                .map(t -> {
                    t.setDaDoc(true);
                    thongBaoRepo.save(t);
                    return ResponseEntity.ok(
                            Map.of("message", "OK"));
                })
                .orElse(ResponseEntity.notFound().build());
    }


    // =========================================================
    // ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC
    // =========================================================

    @PatchMapping("/khach-hang/{khachHangId}/da-doc-tat-ca")
    public ResponseEntity<?> danhDauTatCaDaDoc(
            @PathVariable Long khachHangId
    ) {

        List<ThongBao> ds = thongBaoRepo
                .findByKhachHangIdOrKhachHangIdIsNullOrderByNgayTaoDesc(
                        khachHangId);

        ds.forEach(t -> t.setDaDoc(true));
        thongBaoRepo.saveAll(ds);

        return ResponseEntity.ok(
                Map.of("message", "Đã đánh dấu tất cả đã đọc"));
    }
}