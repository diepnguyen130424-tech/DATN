package com.example.bangiay.repository;

import com.example.bangiay.entity.ChatTinNhan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatTinNhanRepository extends JpaRepository<ChatTinNhan, Long> {

    List<ChatTinNhan> findByHoiThoaiIdOrderByIdAsc(Long hoiThoaiId);

    long countByHoiThoaiIdAndNguoiGuiAndDaDocBoiNvFalse(Long hoiThoaiId, String nguoiGui);

    long countByHoiThoaiIdAndNguoiGuiInAndDaDocBoiKhFalse(Long hoiThoaiId, List<String> nguoiGui);

    @Modifying
    @Query("update ChatTinNhan t set t.daDocBoiNv = true " +
            "where t.hoiThoaiId = :id and t.nguoiGui = 'KHACH' and t.daDocBoiNv = false")
    int danhDauNhanVienDaDoc(@Param("id") Long hoiThoaiId);

    @Modifying
    @Query("update ChatTinNhan t set t.daDocBoiKh = true " +
            "where t.hoiThoaiId = :id and t.nguoiGui <> 'KHACH' and t.daDocBoiKh = false")
    int danhDauKhachDaDoc(@Param("id") Long hoiThoaiId);
}
