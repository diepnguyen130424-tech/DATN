package com.example.bangiay.controller;

import com.example.bangiay.dto.DanhGiaRequest;
import com.example.bangiay.dto.DanhGiaResponse;
import com.example.bangiay.dto.DanhGiaThongKeResponse;
import com.example.bangiay.dto.DanhGiaTongQuanResponse;
import com.example.bangiay.service.DanhGiaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/danh-gia")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class DanhGiaController {

    private final DanhGiaService danhGiaService;

    /** Khách gửi đánh giá (chỉ khi đơn đã giao và khách đã xác nhận nhận hàng) */
    @PostMapping
    public ResponseEntity<DanhGiaResponse> tao(@RequestBody DanhGiaRequest req) {
        return ResponseEntity.ok(danhGiaService.taoDanhGia(req));
    }

    /** Điểm trung bình + số lượt đánh giá của mọi sản phẩm */
    @GetMapping("/thong-ke")
    public ResponseEntity<List<DanhGiaThongKeResponse>> thongKe() {
        return ResponseEntity.ok(danhGiaService.thongKeTatCa());
    }

    /** Danh sách + thống kê sao của một sản phẩm */
    @GetMapping("/san-pham/{sanPhamId}")
    public ResponseEntity<DanhGiaTongQuanResponse> theoSanPham(@PathVariable Long sanPhamId) {
        return ResponseEntity.ok(danhGiaService.tongQuanTheoSanPham(sanPhamId));
    }

    /** Các đánh giá đã gửi trong một đơn hàng */
    @GetMapping("/hoa-don/{hoaDonId}")
    public ResponseEntity<List<DanhGiaResponse>> theoHoaDon(@PathVariable Long hoaDonId) {
        return ResponseEntity.ok(danhGiaService.theoHoaDon(hoaDonId));
    }

    /** Shop phản hồi đánh giá. Body: { "noiDung": "..." } */
    @PutMapping("/{id}/phan-hoi")
    public ResponseEntity<DanhGiaResponse> phanHoi(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        return ResponseEntity.ok(danhGiaService.phanHoi(id, body.get("noiDung")));
    }

    /** Ẩn/hiện đánh giá vi phạm. ?hien=false để ẩn */
    @PutMapping("/{id}/hien-thi")
    public ResponseEntity<DanhGiaResponse> hienThi(
            @PathVariable Long id,
            @RequestParam boolean hien
    ) {
        return ResponseEntity.ok(danhGiaService.doiTrangThai(id, hien));
    }
}
