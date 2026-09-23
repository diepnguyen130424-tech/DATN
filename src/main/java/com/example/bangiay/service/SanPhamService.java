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

            // Tạo mới
            if (sanPham.getNgayTao() == null) {
                sanPham.setNgayTao(LocalDateTime.now());
            }

            if (sanPham.getTrangThai() == null) {
                sanPham.setTrangThai("HOAT_DONG");
            }

        } else {

            // Cập nhật
            SanPham sanPhamCu = sanPhamRepository.findById(sanPham.getId())
                    .orElseThrow(() ->
                            new RuntimeException("Không tìm thấy sản phẩm"));

            // Giữ nguyên ngày tạo
            sanPham.setNgayTao(sanPhamCu.getNgayTao());

            // Giữ nguyên trạng thái cũ nếu PUT không truyền lên
            if (sanPham.getTrangThai() == null) {
                sanPham.setTrangThai(sanPhamCu.getTrangThai());
            }
        }

        return sanPhamRepository.save(sanPham);
    }

    public void delete(Long id) {
        SanPham sanPham = getById(id);

        sanPham.setTrangThai("NGUNG_HOAT_DONG");

        sanPhamRepository.save(sanPham);
    }

    public List<SanPhamChiTiet> getChiTietBySanPhamId(Long sanPhamId) {
        return sanPhamChiTietRepository.findBySanPham_Id(sanPhamId);
    }

    public SanPhamChiTiet getChiTietById(Long id) {
        return sanPhamChiTietRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy sản phẩm chi tiết"));
    }

    public SanPhamChiTiet saveChiTiet(SanPhamChiTiet spct) {

        if (spct.getId() == null) {

            if (spct.getSoLuongTon() == null) {
                spct.setSoLuongTon(0);
            }

            if (spct.getTrangThai() == null) {
                spct.setTrangThai("HOAT_DONG");
            }

            if (spct.getNgayTao() == null) {
                spct.setNgayTao(LocalDateTime.now());
            }

            if (spct.getNgayCapNhat() == null) {
                spct.setNgayCapNhat(LocalDateTime.now());
            }

        } else {

            SanPhamChiTiet spctCu = sanPhamChiTietRepository
                    .findById(spct.getId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Không tìm thấy sản phẩm chi tiết"
                            )
                    );

            // Giữ nguyên ngày tạo cũ
            spct.setNgayTao(spctCu.getNgayTao());

            // Cập nhật ngày sửa
            spct.setNgayCapNhat(LocalDateTime.now());
        }

        return sanPhamChiTietRepository.save(spct);
    }

    public void deleteChiTiet(Long id) {

        SanPhamChiTiet spct = sanPhamChiTietRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy sản phẩm chi tiết"
                        )
                );

        // Không xóa vật lý vì SPCT có thể đang được giỏ hàng/hóa đơn sử dụng
        spct.setTrangThai("INACTIVE");
        spct.setNgayCapNhat(LocalDateTime.now());

        sanPhamChiTietRepository.save(spct);
    }
}