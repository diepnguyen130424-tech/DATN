package com.example.bangiay.controller;

import com.example.bangiay.entity.MaGiamGia;
import com.example.bangiay.service.MaGiamGiaService;
import com.example.bangiay.service.ThongBaoService;
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
        "http://localhost:5174",
        "http://localhost:5175"
})
public class MaGiamGiaController {

    private final MaGiamGiaService maGiamGiaService;
    private final ThongBaoService thongBaoService;


    // =========================================================
    // LẤY TẤT CẢ
    // =========================================================

    @GetMapping
    public ResponseEntity<List<MaGiamGia>> getAll() {
        return ResponseEntity.ok(maGiamGiaService.getAll());
    }


    // =========================================================
    // LẤY VOUCHER ĐANG HOẠT ĐỘNG (cho khách)
    // =========================================================

    @GetMapping("/dang-hoat-dong")
    public ResponseEntity<List<MaGiamGia>> getDangHoatDong() {
        return ResponseEntity.ok(maGiamGiaService.getDangHoatDong());
    }


    // =========================================================
    // LẤY VOUCHER SẮP HẾT HẠN (cho khách)
    // =========================================================

    @GetMapping("/sap-het-han")
    public ResponseEntity<List<MaGiamGia>> getSapHetHan(
            @RequestParam(defaultValue = "3") int soNgay
    ) {
        return ResponseEntity.ok(maGiamGiaService.getSapHetHan(soNgay));
    }


    // =========================================================
    // LẤY THEO ID
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<MaGiamGia> getById(@PathVariable Long id) {
        return ResponseEntity.ok(maGiamGiaService.getById(id));
    }


    // =========================================================
    // LẤY THEO MÃ
    // =========================================================

    @GetMapping("/ma/{maVoucher}")
    public ResponseEntity<MaGiamGia> getByMaVoucher(
            @PathVariable String maVoucher
    ) {
        return ResponseEntity.ok(
                maGiamGiaService.getByMaVoucher(maVoucher));
    }


    // =========================================================
    // THÊM VOUCHER
    // =========================================================

    @PostMapping
    public ResponseEntity<?> create(@RequestBody MaGiamGia maGiamGia) {

        try {
            return ResponseEntity.ok(maGiamGiaService.save(maGiamGia));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", layMessageLoi(e)));
        }
    }


    // =========================================================
    // SỬA VOUCHER
    // =========================================================

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody MaGiamGia maGiamGia
    ) {

        try {
            MaGiamGia existing = maGiamGiaService.getById(id);
            maGiamGia.setId(existing.getId());

            return ResponseEntity.ok(maGiamGiaService.save(maGiamGia));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", layMessageLoi(e)));
        }
    }


    // =========================================================
    // XÓA VOUCHER
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {

        try {
            maGiamGiaService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", layMessageLoi(e)));
        }
    }


    // =========================================================
    // KIỂM TRA VOUCHER
    // =========================================================

    @PostMapping("/kiem-tra")
    public ResponseEntity<?> kiemTra(
            @RequestBody Map<String, Object> body
    ) {

        try {
            if (body == null) {
                throw new RuntimeException(
                        "Dữ liệu kiểm tra voucher không hợp lệ");
            }

            String ma = body.get("ma") != null
                    ? body.get("ma").toString() : null;

            if (body.get("tongTien") == null) {
                throw new RuntimeException(
                        "Tổng tiền không được để trống");
            }

            BigDecimal tongTien = new BigDecimal(
                    body.get("tongTien").toString());

            Long khachHangId = null;
            if (body.get("khachHangId") != null) {
                khachHangId = Long.valueOf(
                        body.get("khachHangId").toString());
            }

            return ResponseEntity.ok(
                    maGiamGiaService.kiemTraVoucher(
                            ma, tongTien, khachHangId));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", layMessageLoi(e)));
        }
    }


    // =========================================================
    // TĂNG LƯỢT SỬ DỤNG
    // Đổi route từ /sao-chep/{ma} (copy-paste nhầm) → /tang-luot-dung/{ma}
    // =========================================================

    @PostMapping("/tang-luot-dung/{ma}")
    public ResponseEntity<?> tangLuotDung(@PathVariable String ma) {

        try {
            maGiamGiaService.tangSoLuongDaDung(ma);
            return ResponseEntity.ok(
                    Map.of("message", "Đã cập nhật lượt sử dụng"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", layMessageLoi(e)));
        }
    }


    // =========================================================
    // (ADMIN) TRIGGER QUÉT VOUCHER SẮP HẾT HẠN THỦ CÔNG
    // =========================================================

    @PostMapping("/quet-sap-het-han")
    public ResponseEntity<?> quetSapHetHan() {

        try {
            int dem = thongBaoService.quetVoucherSapHetHanThuCong();
            return ResponseEntity.ok(Map.of(
                    "message", "Đã gửi thông báo cho " + dem + " voucher",
                    "soLuong", dem));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", layMessageLoi(e)));
        }
    }


    private String layMessageLoi(Exception e) {

        Throwable current = e;

        while (current != null) {
            if (current.getMessage() != null
                    && !current.getMessage().trim().isEmpty()) {
                return current.getMessage();
            }
            current = current.getCause();
        }

        return "Không thể xử lý voucher";
    }
}