package com.example.bangiay.service;

import com.example.bangiay.entity.KhachHang;
import com.example.bangiay.entity.SanPham;
import com.example.bangiay.entity.YeuThich;
import com.example.bangiay.repository.KhachHangRepository;
import com.example.bangiay.repository.SanPhamRepository;
import com.example.bangiay.repository.YeuThichRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class YeuThichService {

    private final YeuThichRepository yeuThichRepository;
    private final KhachHangRepository khachHangRepository;
    private final SanPhamRepository sanPhamRepository;

    @Transactional(readOnly = true)
    public List<Long> getSanPhamIds(Long khachHangId) {

        if (khachHangId == null || khachHangId <= 0) {
            return List.of();
        }
        return yeuThichRepository.findSanPhamIdsByKhachHangId(
                khachHangId
        );
    }

    @Transactional
    public List<Long> them(
            Long khachHangId,
            Long sanPhamId
    ) {

        if (khachHangId == null || khachHangId <= 0) {
            throw new RuntimeException(
                    "Khách hàng không hợp lệ"
            );
        }

        if (sanPhamId == null || sanPhamId <= 0) {
            throw new RuntimeException(
                    "Sản phẩm không hợp lệ"
            );
        }

        if (!khachHangRepository.existsById(khachHangId)) {
            throw new RuntimeException(
                    "Không tìm thấy khách hàng ID: " + khachHangId
            );
        }
        if (!sanPhamRepository.existsById(sanPhamId)) {
            throw new RuntimeException(
                    "Không tìm thấy sản phẩm ID: " + sanPhamId
            );
        }
        if (!yeuThichRepository
                .existsByKhachHang_IdAndSanPham_Id(
                        khachHangId,
                        sanPhamId
                )) {

            KhachHang khachHang =
                    khachHangRepository.getReferenceById(
                            khachHangId
                    );

            SanPham sanPham =
                    sanPhamRepository.getReferenceById(
                            sanPhamId
                    );

            YeuThich yeuThich =
                    YeuThich.builder()
                            .khachHang(khachHang)
                            .sanPham(sanPham)
                            .ngayTao(LocalDateTime.now())
                            .build();

            yeuThichRepository.save(yeuThich);
        }
        return yeuThichRepository
                .findSanPhamIdsByKhachHangId(
                        khachHangId
                );
    }

    @Transactional
    public List<Long> xoa(
            Long khachHangId,
            Long sanPhamId
    ) {

        if (khachHangId == null || khachHangId <= 0) {
            throw new RuntimeException(
                    "Khách hàng không hợp lệ"
            );
        }

        if (sanPhamId == null || sanPhamId <= 0) {
            throw new RuntimeException(
                    "Sản phẩm không hợp lệ"
            );
        }

        yeuThichRepository
                .findByKhachHang_IdAndSanPham_Id(
                        khachHangId,
                        sanPhamId
                )
                .ifPresent(
                        yeuThichRepository::delete
                );

        return yeuThichRepository
                .findSanPhamIdsByKhachHangId(
                        khachHangId
                );
    }
}