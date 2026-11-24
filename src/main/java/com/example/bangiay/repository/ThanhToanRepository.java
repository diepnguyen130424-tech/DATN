
package com.example.bangiay.repository;

import com.example.bangiay.entity.ThanhToan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ThanhToanRepository extends JpaRepository<ThanhToan, Long> {

    List<ThanhToan> findByHoaDon_Id(Long hoaDonId);

    List<ThanhToan> findByHoaDon_IdIn(List<Long> hoaDonIds);
}
