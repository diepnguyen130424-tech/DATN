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


    // =========================================================
    // LẤY TẤT CẢ
    // =========================================================

    @GetMapping
    public ResponseEntity<List<MaGiamGia>> getAll() {

        return ResponseEntity.ok(
                maGiamGiaService.getAll()
        );
    }


    // =========================================================
    // LẤY VOUCHER ĐANG HOẠT ĐỘNG
    // =========================================================

    @GetMapping("/dang-hoat-dong")
    public ResponseEntity<List<MaGiamGia>> getDangHoatDong() {

        return ResponseEntity.ok(
                maGiamGiaService.getDangHoatDong()
        );
    }


    // =========================================================
    // LẤY THEO ID
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<MaGiamGia> getById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                maGiamGiaService.getById(id)
        );
    }


    // =========================================================
    // LẤY THEO MÃ
    // =========================================================

    @GetMapping("/ma/{maVoucher}")
    public ResponseEntity<MaGiamGia> getByMaVoucher(
            @PathVariable String maVoucher
    ) {

        return ResponseEntity.ok(
                maGiamGiaService.getByMaVoucher(
                        maVoucher
                )
        );
    }


    // =========================================================
    // THÊM VOUCHER
    // =========================================================

    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody MaGiamGia maGiamGia
    ) {

        try {

            return ResponseEntity.ok(
                    maGiamGiaService.save(
                            maGiamGia
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            String message =
                    layMessageLoi(e);

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    message
                            )
                    );
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

            // Kiểm tra voucher có tồn tại
            MaGiamGia existing =
                    maGiamGiaService.getById(id);


            // Giữ ID cũ
            maGiamGia.setId(
                    existing.getId()
            );


            return ResponseEntity.ok(
                    maGiamGiaService.save(
                            maGiamGia
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            String message =
                    layMessageLoi(e);

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    message
                            )
                    );
        }
    }


    // =========================================================
    // XÓA VOUCHER
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id
    ) {

        try {

            maGiamGiaService.delete(id);

            return ResponseEntity
                    .noContent()
                    .build();

        } catch (Exception e) {

            e.printStackTrace();

            String message =
                    layMessageLoi(e);

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    message
                            )
                    );
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
                        "Dữ liệu kiểm tra voucher không hợp lệ"
                );
            }


            // Mã voucher
            String ma =
                    body.get("ma") != null
                            ? body.get("ma").toString()
                            : null;


            // Tổng tiền
            if (body.get("tongTien") == null) {

                throw new RuntimeException(
                        "Tổng tiền không được để trống"
                );
            }


            BigDecimal tongTien =
                    new BigDecimal(
                            body.get("tongTien")
                                    .toString()
                    );


            // Khách hàng
            Long khachHangId = null;

            if (body.get("khachHangId") != null) {

                khachHangId =
                        Long.valueOf(
                                body.get("khachHangId")
                                        .toString()
                        );
            }


            return ResponseEntity.ok(
                    maGiamGiaService.kiemTraVoucher(
                            ma,
                            tongTien,
                            khachHangId
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    layMessageLoi(e)
                            )
                    );
        }
    }


    // =========================================================
    // TĂNG LƯỢT SỬ DỤNG
    // =========================================================

    @PostMapping("/sao-chep/{ma}")
    public ResponseEntity<?> saoChep(
            @PathVariable String ma
    ) {

        try {

            maGiamGiaService
                    .tangSoLuongDaDung(ma);

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Đã cập nhật lượt sử dụng"
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    layMessageLoi(e)
                            )
                    );
        }
    }


    private String layMessageLoi(
            Exception e
    ) {

        Throwable current = e;

        while (current != null) {

            if (current.getMessage() != null
                    && !current.getMessage()
                    .trim()
                    .isEmpty()) {

                return current.getMessage();
            }

            current =
                    current.getCause();
        }

        return "Không thể xử lý voucher";
    }
}