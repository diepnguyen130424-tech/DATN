package com.example.bangiay.service;
import com.example.bangiay.entity.SanPhamChiTiet;
import com.example.bangiay.repository.SanPhamChiTietRepository;
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
    private final SanPhamChiTietRepository sanPhamChiTietRepository;

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

            GioHang gioHangCu = gioHangRepository.findById(gioHang.getId())
                    .orElseThrow(() ->
                            new RuntimeException("Không tìm thấy giỏ hàng"));
            gioHang.setNgayTao(gioHangCu.getNgayTao());
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

    public ChiTietGioHang getChiTietById(Long id) {
        return chiTietGioHangRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy chi tiết giỏ hàng"));
    }

    public ChiTietGioHang saveChiTiet(ChiTietGioHang chiTietGioHang) {

        if (chiTietGioHang.getSoLuong() == null
                || chiTietGioHang.getSoLuong() <= 0) {

            throw new RuntimeException(
                    "Số lượng sản phẩm phải lớn hơn 0"
            );
        }

        if (chiTietGioHang.getGioHang() == null
                || chiTietGioHang.getGioHang().getId() == null) {

            throw new RuntimeException(
                    "Giỏ hàng không hợp lệ"
            );
        }

        if (chiTietGioHang.getSanPhamChiTiet() == null
                || chiTietGioHang.getSanPhamChiTiet().getId() == null) {

            throw new RuntimeException(
                    "Sản phẩm chi tiết không hợp lệ"
            );
        }

        Long gioHangId = chiTietGioHang.getGioHang().getId();
        Long spctId = chiTietGioHang.getSanPhamChiTiet().getId();

        SanPhamChiTiet spct = sanPhamChiTietRepository.findById(spctId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy sản phẩm chi tiết"
                        )
                );

        if (!"HOAT_DONG".equalsIgnoreCase(spct.getTrangThai())
                && !"ACTIVE".equalsIgnoreCase(spct.getTrangThai())) {

            throw new RuntimeException(
                    "Sản phẩm chi tiết không hoạt động"
            );
        }

        if (spct.getSoLuongTon() == null
                || spct.getSoLuongTon() <= 0) {

            throw new RuntimeException(
                    "Sản phẩm đã hết hàng"
            );
        }

        if (chiTietGioHang.getSoLuong() > spct.getSoLuongTon()) {

            throw new RuntimeException(
                    "Số lượng mua vượt quá số lượng tồn kho"
            );
        }

        if (chiTietGioHang.getId() == null) {

            chiTietGioHangRepository
                    .findByGioHang_IdAndSanPhamChiTiet_Id(
                            gioHangId,
                            spctId
                    )
                    .ifPresent(existing -> {
                        throw new RuntimeException(
                                "Sản phẩm đã có trong giỏ hàng"
                        );
                    });
        }

        chiTietGioHang.setSanPhamChiTiet(spct);

        return chiTietGioHangRepository.save(chiTietGioHang);
    }

    public void deleteChiTiet(Long id) {
        chiTietGioHangRepository.deleteById(id);
    }
}
