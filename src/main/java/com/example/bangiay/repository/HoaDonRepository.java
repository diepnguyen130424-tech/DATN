package com.example.bangiay.repository;

import com.example.bangiay.entity.HoaDon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface HoaDonRepository extends JpaRepository<HoaDon, Long> {

    Optional<HoaDon> findByMaHoaDon(String maHoaDon);

    boolean existsByMaHoaDon(String maHoaDon);

    List<HoaDon> findByKhachHang_Id(Long khachHangId);

    List<HoaDon> findByNhanVien_Id(Long nhanVienId);

    List<HoaDon> findByTrangThai(String trangThai);

    List<HoaDon> findByLoaiHoaDon(String loaiHoaDon);

    // Đơn đã giao nhưng khách chưa xác nhận nhận hàng, cập nhật trước mốc thời gian
    List<HoaDon> findByTrangThaiAndNgayNhanHangIsNullAndNgayCapNhatBefore(
            String trangThai, LocalDateTime mocThoiGian);

    // ⭐ Kiểm tra khách đã dùng voucher này chưa
    boolean existsByKhachHang_IdAndVoucher_Id(Long khachHangId, Long voucherId);
}