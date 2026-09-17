package com.example.bangiay.service;

import com.example.bangiay.entity.MaGiamGia;
import com.example.bangiay.repository.MaGiamGiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MaGiamGiaService {

    private final MaGiamGiaRepository maGiamGiaRepository;

    public List<MaGiamGia> getAll() {
        return maGiamGiaRepository.findAll();
    }

    public MaGiamGia getById(Long id) {
        return maGiamGiaRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy mã giảm giá"));
    }

    public MaGiamGia getByMaVoucher(String maVoucher) {
        return maGiamGiaRepository.findByMaVoucher(maVoucher)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy mã voucher"));
    }

    public MaGiamGia save(MaGiamGia maGiamGia) {

        if (maGiamGia.getId() == null) {

            if (maGiamGia.getSoLuongDaDung() == null) {
                maGiamGia.setSoLuongDaDung(0);
            }

            if (maGiamGia.getTrangThai() == null) {
                maGiamGia.setTrangThai("HOAT_DONG");
            }
        }

        return maGiamGiaRepository.save(maGiamGia);
    }

    public void delete(Long id) {
        maGiamGiaRepository.deleteById(id);
    }

    public boolean existsByMaVoucher(String maVoucher) {
        return maGiamGiaRepository.existsByMaVoucher(maVoucher);
    }
}
