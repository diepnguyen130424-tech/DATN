package com.example.bangiay.service;

import com.example.bangiay.entity.ChiTietGioHang;
import com.example.bangiay.entity.GioHang;
import com.example.bangiay.repository.ChiTietGioHangRepository;
import com.example.bangiay.repository.GioHangRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GioHangService {

    private final GioHangRepository gioHangRepository;
    private final ChiTietGioHangRepository chiTietGioHangRepository;

    public List<GioHang> getAll() {
        return gioHangRepository.findAll();
    }

    public GioHang getById(Long id) {
        return gioHangRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy giỏ hàng"));
    }

    public GioHang getByKhachHangId(Long khachHangId) {
        return gioHangRepository.findByKhachHang_Id(khachHangId)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy giỏ hàng"));
    }

    public GioHang save(GioHang gioHang) {

        if (gioHang.getId() == null) {

            if (gioHang.getNgayTao() == null) {
                gioHang.setNgayTao(LocalDateTime.now());
            }

            if (gioHang.getNgayCapNhat() == null) {
                gioHang.setNgayCapNhat(LocalDateTime.now());
            }

        } else {
            gioHang.setNgayCapNhat(LocalDateTime.now());
        }

        return gioHangRepository.save(gioHang);
    }

    public void delete(Long id) {
        gioHangRepository.deleteById(id);
    }

    public List<ChiTietGioHang> getChiTietByGioHangId(Long gioHangId) {
        return chiTietGioHangRepository.findByGioHang_Id(gioHangId);
    }

    // Lấy chi tiết theo ID
    public ChiTietGioHang getChiTietById(Long id) {
        return chiTietGioHangRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy chi tiết giỏ hàng"));
    }

    public ChiTietGioHang saveChiTiet(
            ChiTietGioHang chiTietGioHang) {

        return chiTietGioHangRepository.save(chiTietGioHang);
    }

    public void deleteChiTiet(Long id) {
        chiTietGioHangRepository.deleteById(id);
    }
}
