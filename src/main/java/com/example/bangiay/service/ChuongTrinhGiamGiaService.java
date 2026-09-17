package com.example.bangiay.service;

import com.example.bangiay.entity.ChuongTrinhGiamGia;
import com.example.bangiay.entity.SanPhamGiamGia;
import com.example.bangiay.repository.ChuongTrinhGiamGiaRepository;
import com.example.bangiay.repository.SanPhamGiamGiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChuongTrinhGiamGiaService {

    private final ChuongTrinhGiamGiaRepository chuongTrinhGiamGiaRepository;
    private final SanPhamGiamGiaRepository sanPhamGiamGiaRepository;

    public List<ChuongTrinhGiamGia> getAll() {
        return chuongTrinhGiamGiaRepository.findAll();
    }

    public ChuongTrinhGiamGia getById(Long id) {
        return chuongTrinhGiamGiaRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy chương trình giảm giá"));
    }

    public ChuongTrinhGiamGia save(ChuongTrinhGiamGia chuongTrinhGiamGia) {

        if (chuongTrinhGiamGia.getNgayBatDau() == null
                || chuongTrinhGiamGia.getNgayKetThuc() == null) {

            throw new RuntimeException(
                    "Ngày bắt đầu và ngày kết thúc không được để trống"
            );
        }

        if (!chuongTrinhGiamGia.getNgayKetThuc()
                .isAfter(chuongTrinhGiamGia.getNgayBatDau())) {

            throw new RuntimeException(
                    "Ngày kết thúc phải sau ngày bắt đầu"
            );
        }

        if (chuongTrinhGiamGia.getId() == null) {

            if (chuongTrinhGiamGia.getTrangThai() == null) {
                chuongTrinhGiamGia.setTrangThai("HOAT_DONG");
            }
        }

        return chuongTrinhGiamGiaRepository.save(chuongTrinhGiamGia);
    }

    public void delete(Long id) {
        chuongTrinhGiamGiaRepository.deleteById(id);
    }

    public List<ChuongTrinhGiamGia> getByTrangThai(String trangThai) {
        return chuongTrinhGiamGiaRepository.findByTrangThai(trangThai);
    }

    public List<SanPhamGiamGia> getSanPhamByChuongTrinh(Long chuongTrinhId) {
        return sanPhamGiamGiaRepository
                .findByChuongTrinhGiamGia_Id(chuongTrinhId);
    }

    public List<SanPhamGiamGia> getChuongTrinhBySanPham(Long sanPhamId) {
        return sanPhamGiamGiaRepository
                .findBySanPham_Id(sanPhamId);
    }

    public SanPhamGiamGia saveSanPhamGiamGia(
            SanPhamGiamGia sanPhamGiamGia) {

        return sanPhamGiamGiaRepository.save(sanPhamGiamGia);
    }

    public void deleteSanPhamGiamGia(Long id) {
        sanPhamGiamGiaRepository.deleteById(id);
    }
}
