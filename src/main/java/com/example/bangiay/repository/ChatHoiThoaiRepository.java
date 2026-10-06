package com.example.bangiay.repository;

import com.example.bangiay.entity.ChatHoiThoai;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatHoiThoaiRepository extends JpaRepository<ChatHoiThoai, Long> {

    Optional<ChatHoiThoai> findByKhachHangId(Long khachHangId);

    List<ChatHoiThoai> findAllByOrderByNgayCapNhatDesc();
}
