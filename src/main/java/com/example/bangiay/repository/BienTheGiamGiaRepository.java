package com.example.bangiay.repository;

import com.example.bangiay.entity.BienTheGiamGia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BienTheGiamGiaRepository extends JpaRepository<BienTheGiamGia, Long> {

    List<BienTheGiamGia> findByChuongTrinhGiamGia_Id(Long ctggId);

    @Modifying
    @Query("DELETE FROM BienTheGiamGia b WHERE b.chuongTrinhGiamGia.id = :ctggId")
    void deleteByChuongTrinhGiamGiaId(@Param("ctggId") Long ctggId);
}