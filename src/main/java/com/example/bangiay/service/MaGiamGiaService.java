package com.example.bangiay.service;

import com.example.bangiay.entity.MaGiamGia;
import com.example.bangiay.repository.MaGiamGiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
    // ========== DANH SÁCH VOUCHER ĐANG HOẠT ĐỘNG ==========
    public List<MaGiamGia> getDangHoatDong() {

        LocalDateTime now = LocalDateTime.now();

        return maGiamGiaRepository.findAll().stream()
                .filter(v ->
                        "HOAT_DONG".equalsIgnoreCase(v.getTrangThai())
                )
                .filter(v ->
                        v.getNgayBatDau() == null
                                || !now.isBefore(v.getNgayBatDau())
                )
                .filter(v ->
                        v.getNgayKetThuc() == null
                                || !now.isAfter(v.getNgayKetThuc())
                )
                .filter(v ->
                        v.getSoLuong() == null
                                || (v.getSoLuongDaDung() == null
                                ? 0
                                : v.getSoLuongDaDung())
                                < v.getSoLuong()
                )
                .toList();
    }

    // ========== KIỂM TRA VOUCHER ==========
    public Map<String, Object> kiemTraVoucher(
            String ma,
            BigDecimal tongTien
    ) {

        if (ma == null || ma.trim().isEmpty()) {
            throw new RuntimeException("Vui lòng nhập mã giảm giá");
        }

        String maChuan = ma.toUpperCase().trim();

        MaGiamGia voucher = maGiamGiaRepository
                .findByMaVoucher(maChuan)
                .orElseThrow(() ->
                        new RuntimeException("Mã giảm giá không tồn tại"));

        if (!"HOAT_DONG".equalsIgnoreCase(voucher.getTrangThai())) {
            throw new RuntimeException("Mã giảm giá đã hết hiệu lực");
        }

        LocalDateTime now = LocalDateTime.now();

        if (voucher.getNgayBatDau() != null
                && now.isBefore(voucher.getNgayBatDau())) {
            throw new RuntimeException(
                    "Mã giảm giá chưa đến thời gian sử dụng"
            );
        }

        if (voucher.getNgayKetThuc() != null
                && now.isAfter(voucher.getNgayKetThuc())) {
            throw new RuntimeException("Mã giảm giá đã hết hạn");
        }

        if (voucher.getSoLuong() != null) {

            int daDung = voucher.getSoLuongDaDung() != null
                    ? voucher.getSoLuongDaDung()
                    : 0;

            if (daDung >= voucher.getSoLuong()) {
                throw new RuntimeException(
                        "Mã giảm giá đã hết lượt sử dụng"
                );
            }
        }

        if (voucher.getDonToiThieu() != null
                && tongTien.compareTo(voucher.getDonToiThieu()) < 0) {
            throw new RuntimeException(
                    "Đơn hàng tối thiểu "
                            + formatTien(voucher.getDonToiThieu())
                            + " để dùng mã này"
            );
        }

        BigDecimal tienGiam;

        if ("PHAN_TRAM".equalsIgnoreCase(voucher.getLoaiGiam())) {

            tienGiam = tongTien
                    .multiply(voucher.getGiaTriGiam())
                    .divide(
                            BigDecimal.valueOf(100),
                            0,
                            RoundingMode.HALF_UP
                    );

            if (voucher.getGiamToiDa() != null
                    && tienGiam.compareTo(voucher.getGiamToiDa()) > 0) {
                tienGiam = voucher.getGiamToiDa();
            }

        } else {
            tienGiam = voucher.getGiaTriGiam();
        }

        if (tienGiam.compareTo(tongTien) > 0) {
            tienGiam = tongTien;
        }

        BigDecimal tongTienSauGiam = tongTien.subtract(tienGiam);

        Map<String, Object> result = new HashMap<>();
        result.put("id", voucher.getId());
        result.put("maVoucher", voucher.getMaVoucher());
        result.put("tenVoucher", voucher.getTenVoucher());
        result.put("loaiGiam", voucher.getLoaiGiam());
        result.put("giaTriGiam", voucher.getGiaTriGiam());
        result.put("tienGiam", tienGiam);
        result.put("tongTienSauGiam", tongTienSauGiam);
        result.put("message", "Áp dụng mã giảm giá thành công");

        return result;
    }

    private String formatTien(BigDecimal tien) {
        return String.format("%,.0fđ", tien.doubleValue())
                .replace(",", ".");
    }
}
