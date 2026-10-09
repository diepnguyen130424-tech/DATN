package com.example.bangiay.repository;

import com.example.bangiay.entity.DanhGia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DanhGiaRepository extends JpaRepository<DanhGia, Long> {

    List<DanhGia> findBySanPham_IdAndTrangThaiOrderByNgayTaoDesc(Long sanPhamId, String trangThai);

    List<DanhGia> findByChiTietHoaDon_HoaDon_Id(Long hoaDonId);

    boolean existsByChiTietHoaDon_Id(Long chiTietHoaDonId);

    /** [sanPhamId, điểm trung bình, số lượt] của các đánh giá đang hiển thị */
    @Query("select d.sanPham.id, avg(d.soSao), count(d) from DanhGia d "
            + "where d.trangThai = 'HIEN' group by d.sanPham.id")
    List<Object[]> thongKeTheoSanPham();
}
