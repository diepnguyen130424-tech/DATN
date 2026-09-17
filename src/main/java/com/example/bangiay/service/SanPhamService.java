package com.example.bangiay.service;



import com.example.bangiay.entity.SanPham;
import com.example.bangiay.entity.SanPhamChiTiet;
import com.example.bangiay.repository.SanPhamChiTietRepository;
import com.example.bangiay.repository.SanPhamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SanPhamService {

    private final SanPhamRepository sanPhamRepository;
    private final SanPhamChiTietRepository sanPhamChiTietRepository;

    public List<SanPham> getAll() {
        return sanPhamRepository.findAll();
    }

    public SanPham getById(Long id) {
        return sanPhamRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy sản phẩm"));
    }

    public SanPham save(SanPham sanPham) {

        if (sanPham.getId() == null) {

            if (sanPham.getNgayTao() == null) {
                sanPham.setNgayTao(LocalDateTime.now());
            }

            if (sanPham.getTrangThai() == null) {
                sanPham.setTrangThai("HOAT_DONG");
            }
        }

        return sanPhamRepository.save(sanPham);
    }

    public void delete(Long id) {
        sanPhamRepository.deleteById(id);
    }

    public List<SanPhamChiTiet> getChiTietBySanPhamId(Long sanPhamId) {
        return sanPhamChiTietRepository.findBySanPham_Id(sanPhamId);
    }

    public SanPhamChiTiet getChiTietById(Long id) {
        return sanPhamChiTietRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy sản phẩm chi tiết"));
    }

    public SanPhamChiTiet saveChiTiet(SanPhamChiTiet sanPhamChiTiet) {
        if (sanPhamChiTiet.getId() == null) {

            if (sanPhamChiTiet.getSoLuongTon() == null) {
                sanPhamChiTiet.setSoLuongTon(0);
            }

            if (sanPhamChiTiet.getTrangThai() == null) {
                sanPhamChiTiet.setTrangThai("HOAT_DONG");
            }

            if (sanPhamChiTiet.getNgayTao() == null) {
                sanPhamChiTiet.setNgayTao(LocalDateTime.now());
            }

            if (sanPhamChiTiet.getNgayCapNhat() == null) {
                sanPhamChiTiet.setNgayCapNhat(LocalDateTime.now());
            }
        }

        return sanPhamChiTietRepository.save(sanPhamChiTiet);
    }

    public void deleteChiTiet(Long id) {
        sanPhamChiTietRepository.deleteById(id);
    }
}