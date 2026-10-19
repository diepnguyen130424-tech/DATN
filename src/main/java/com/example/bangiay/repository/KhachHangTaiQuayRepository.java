package com.example.bangiay.repository;

import com.example.bangiay.entity.KhachHangTaiQuay;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface KhachHangTaiQuayRepository extends JpaRepository<KhachHangTaiQuay, Long> {

    Optional<KhachHangTaiQuay> findBySoDienThoai(String soDienThoai);
}