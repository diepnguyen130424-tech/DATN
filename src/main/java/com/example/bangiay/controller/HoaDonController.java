package com.example.bangiay.controller;
import com.example.bangiay.dto.DatHangRequest;
import com.example.bangiay.entity.ChiTietHoaDon;
import com.example.bangiay.entity.ThanhToan;
import com.example.bangiay.entity.HoaDon;
import com.example.bangiay.entity.LichSuHoaDon;
import com.example.bangiay.service.HoaDonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hoa-don")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class HoaDonController {

    private final HoaDonService hoaDonService;

    @GetMapping
    public ResponseEntity<List<HoaDon>> getAll() {
        return ResponseEntity.ok(hoaDonService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HoaDon> getById(@PathVariable Long id) {
        return ResponseEntity.ok(hoaDonService.getById(id));
    }

    @GetMapping("/ma/{maHoaDon}")
    public ResponseEntity<HoaDon> getByMaHoaDon(
            @PathVariable String maHoaDon
    ) {
        return ResponseEntity.ok(
                hoaDonService.getByMaHoaDon(maHoaDon)
        );
    }

    @GetMapping("/khach-hang/{khachHangId}")
    public ResponseEntity<List<HoaDon>> getByKhachHang(
            @PathVariable Long khachHangId
    ) {
        return ResponseEntity.ok(
                hoaDonService.getByKhachHangId(khachHangId)
        );
    }

    @GetMapping("/nhan-vien/{nhanVienId}")
    public ResponseEntity<List<HoaDon>> getByNhanVien(
            @PathVariable Long nhanVienId
    ) {
        return ResponseEntity.ok(
                hoaDonService.getByNhanVienId(nhanVienId)
        );
    }

    @GetMapping("/trang-thai/{trangThai}")
    public ResponseEntity<List<HoaDon>> getByTrangThai(
            @PathVariable String trangThai
    ) {
        return ResponseEntity.ok(
                hoaDonService.getByTrangThai(trangThai)
        );
    }

    @GetMapping("/loai/{loaiHoaDon}")
    public ResponseEntity<List<HoaDon>> getByLoaiHoaDon(
            @PathVariable String loaiHoaDon
    ) {
        return ResponseEntity.ok(
                hoaDonService.getByLoaiHoaDon(loaiHoaDon)
        );
    }

    @PostMapping
    public ResponseEntity<HoaDon> create(
            @RequestBody HoaDon hoaDon
    ) {
        return ResponseEntity.ok(
                hoaDonService.save(hoaDon)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<HoaDon> update(
            @PathVariable Long id,
            @RequestBody HoaDon hoaDon
    ) {
        hoaDon.setId(id);

        return ResponseEntity.ok(
                hoaDonService.save(hoaDon)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        hoaDonService.delete(id);

        return ResponseEntity.noContent().build();
    }

    /*
     * ĐẶT HÀNG
     *
     * Nhận:
     * - gioHangId
     * - voucherId
     * - hoTen
     * - soDienThoai
     * - diaChi
     * - ghiChu
     * - phuongThuc
     */
    @PostMapping("/dat-hang/{gioHangId}")
    public ResponseEntity<HoaDon> datHang(
            @PathVariable Long gioHangId,
            @RequestParam(required = false) Long voucherId,
            @RequestBody DatHangRequest request
    ) {
        return ResponseEntity.ok(
                hoaDonService.datHang(
                        gioHangId,
                        voucherId,
                        request
                )
        );
    }

    /*
     * CHI TIẾT HÓA ĐƠN
     */

    @PostMapping("/chi-tiet")
    public ResponseEntity<ChiTietHoaDon> createChiTiet(
            @RequestBody ChiTietHoaDon chiTietHoaDon
    ) {
        return ResponseEntity.ok(
                hoaDonService.saveChiTiet(chiTietHoaDon)
        );
    }

    @GetMapping("/{hoaDonId}/chi-tiet")
    public ResponseEntity<List<ChiTietHoaDon>> getChiTiet(
            @PathVariable Long hoaDonId
    ) {
        return ResponseEntity.ok(
                hoaDonService.getChiTietByHoaDonId(hoaDonId)
        );
    }

    /*
     * THANH TOÁN
     */

    @PostMapping("/thanh-toan")
    public ResponseEntity<ThanhToan> createThanhToan(
            @RequestBody ThanhToan thanhToan
    ) {
        return ResponseEntity.ok(
                hoaDonService.saveThanhToan(thanhToan)
        );
    }

    @GetMapping("/{hoaDonId}/thanh-toan")
    public ResponseEntity<ThanhToan> getThanhToan(
            @PathVariable Long hoaDonId
    ) {
        return ResponseEntity.ok(
                hoaDonService.getThanhToanByHoaDonId(hoaDonId)
        );
    }

    /*
     * LỊCH SỬ HÓA ĐƠN
     */

    @PostMapping("/lich-su")
    public ResponseEntity<LichSuHoaDon> createLichSu(
            @RequestBody LichSuHoaDon lichSuHoaDon
    ) {
        return ResponseEntity.ok(
                hoaDonService.saveLichSu(lichSuHoaDon)
        );
    }

    @GetMapping("/{hoaDonId}/lich-su")
    public ResponseEntity<List<LichSuHoaDon>> getLichSu(
            @PathVariable Long hoaDonId
    ) {
        return ResponseEntity.ok(
                hoaDonService.getLichSuByHoaDonId(hoaDonId)
        );
    }

    /*
     * CẬP NHẬT TRẠNG THÁI
     */

    @PutMapping("/{id}/trang-thai")
    public ResponseEntity<HoaDon> capNhatTrangThai(
            @PathVariable Long id,
            @RequestParam String trangThai,
            @RequestParam(required = false) String ghiChu
    ) {
        return ResponseEntity.ok(
                hoaDonService.capNhatTrangThai(
                        id,
                        trangThai,
                        ghiChu
                )
        );
    }
}