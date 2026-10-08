package com.example.bangiay.service;

import com.example.bangiay.entity.MaGiamGia;
import com.example.bangiay.repository.HoaDonRepository;
import com.example.bangiay.repository.MaGiamGiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class MaGiamGiaService {

    private final MaGiamGiaRepository maGiamGiaRepository;
    private final HoaDonRepository hoaDonRepository;


    // =========================================================
    // LẤY TẤT CẢ VOUCHER
    // =========================================================

    public List<MaGiamGia> getAll() {

        tuDongCapNhatTrangThai();

        return maGiamGiaRepository.findAll();
    }


    // =========================================================
    // LẤY VOUCHER THEO ID
    // =========================================================

    public MaGiamGia getById(Long id) {

        return maGiamGiaRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy mã giảm giá"
                        )
                );
    }


    // =========================================================
    // LẤY VOUCHER THEO MÃ
    // =========================================================

    public MaGiamGia getByMaVoucher(String maVoucher) {

        if (maVoucher == null || maVoucher.trim().isEmpty()) {
            throw new RuntimeException(
                    "Mã voucher không được để trống"
            );
        }

        String maChuan = maVoucher.trim().toUpperCase();

        return maGiamGiaRepository
                .findByMaVoucher(maChuan)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy mã voucher"
                        )
                );
    }


    // =========================================================
    // THÊM / SỬA VOUCHER
    // =========================================================

    @Transactional
    public MaGiamGia save(MaGiamGia maGiamGia) {

        if (maGiamGia == null) {
            throw new RuntimeException(
                    "Dữ liệu voucher không được để trống"
            );
        }


        // -----------------------------------------------------
        // MÃ VOUCHER
        // -----------------------------------------------------

        if (maGiamGia.getMaVoucher() == null
                || maGiamGia.getMaVoucher().trim().isEmpty()) {

            throw new RuntimeException(
                    "Mã voucher không được để trống"
            );
        }

        String maVoucher = maGiamGia
                .getMaVoucher()
                .trim()
                .toUpperCase();

        maGiamGia.setMaVoucher(maVoucher);


        // -----------------------------------------------------
        // TÊN VOUCHER
        // -----------------------------------------------------

        if (maGiamGia.getTenVoucher() == null
                || maGiamGia.getTenVoucher().trim().isEmpty()) {

            throw new RuntimeException(
                    "Tên voucher không được để trống"
            );
        }

        maGiamGia.setTenVoucher(
                maGiamGia.getTenVoucher().trim()
        );


        // -----------------------------------------------------
        // KIỂM TRA MÃ TRÙNG
        // -----------------------------------------------------

        maGiamGiaRepository
                .findByMaVoucher(maVoucher)
                .ifPresent(voucherTonTai -> {

                    boolean dangThemMoi =
                            maGiamGia.getId() == null;

                    boolean laVoucherKhac =
                            maGiamGia.getId() != null
                                    && !Objects.equals(
                                    voucherTonTai.getId(),
                                    maGiamGia.getId()
                            );

                    if (dangThemMoi || laVoucherKhac) {

                        throw new RuntimeException(
                                "Mã voucher "
                                        + maVoucher
                                        + " đã tồn tại"
                        );
                    }
                });


        // -----------------------------------------------------
        // LOẠI GIẢM
        // -----------------------------------------------------

        if (maGiamGia.getLoaiGiam() == null
                || maGiamGia.getLoaiGiam().trim().isEmpty()) {

            throw new RuntimeException(
                    "Loại giảm không được để trống"
            );
        }

        maGiamGia.setLoaiGiam(
                maGiamGia.getLoaiGiam()
                        .trim()
                        .toUpperCase()
        );


        // -----------------------------------------------------
        // GIÁ TRỊ GIẢM
        // -----------------------------------------------------

        if (maGiamGia.getGiaTriGiam() == null) {

            throw new RuntimeException(
                    "Giá trị giảm không được để trống"
            );
        }

        if (maGiamGia.getGiaTriGiam()
                .compareTo(BigDecimal.ZERO) < 0) {

            throw new RuntimeException(
                    "Giá trị giảm không được nhỏ hơn 0"
            );
        }


        // -----------------------------------------------------
        // PHẦN TRĂM
        // -----------------------------------------------------

        if ("PHAN_TRAM".equalsIgnoreCase(
                maGiamGia.getLoaiGiam())) {

            if (maGiamGia.getGiaTriGiam()
                    .compareTo(BigDecimal.valueOf(100)) > 0) {

                throw new RuntimeException(
                        "Giá trị giảm phần trăm không được vượt quá 100%"
                );
            }
        }


        // -----------------------------------------------------
        // GIẢM TỐI ĐA
        // -----------------------------------------------------

        if (maGiamGia.getGiamToiDa() != null
                && maGiamGia.getGiamToiDa()
                .compareTo(BigDecimal.ZERO) < 0) {

            throw new RuntimeException(
                    "Giảm tối đa không được nhỏ hơn 0"
            );
        }


        // -----------------------------------------------------
        // ĐƠN TỐI THIỂU
        // -----------------------------------------------------

        if (maGiamGia.getDonToiThieu() != null
                && maGiamGia.getDonToiThieu()
                .compareTo(BigDecimal.ZERO) < 0) {

            throw new RuntimeException(
                    "Đơn tối thiểu không được nhỏ hơn 0"
            );
        }


        // -----------------------------------------------------
        // SỐ LƯỢNG
        // -----------------------------------------------------

        if (maGiamGia.getSoLuong() == null
                || maGiamGia.getSoLuong() <= 0) {

            throw new RuntimeException(
                    "Số lượng voucher phải lớn hơn 0"
            );
        }


        // -----------------------------------------------------
        // SỐ LƯỢNG ĐÃ DÙNG
        // -----------------------------------------------------

        if (maGiamGia.getSoLuongDaDung() == null) {

            maGiamGia.setSoLuongDaDung(0);
        }

        if (maGiamGia.getSoLuongDaDung() < 0) {

            maGiamGia.setSoLuongDaDung(0);
        }

        if (maGiamGia.getSoLuongDaDung()
                > maGiamGia.getSoLuong()) {

            throw new RuntimeException(
                    "Số lượng đã dùng không được lớn hơn số lượng voucher"
            );
        }


        // -----------------------------------------------------
        // NGÀY
        // -----------------------------------------------------

        if (maGiamGia.getNgayBatDau() != null
                && maGiamGia.getNgayKetThuc() != null
                && maGiamGia.getNgayKetThuc()
                .isBefore(maGiamGia.getNgayBatDau())) {

            throw new RuntimeException(
                    "Ngày kết thúc phải sau ngày bắt đầu"
            );
        }


        // -----------------------------------------------------
        // TRẠNG THÁI
        // -----------------------------------------------------

        if (maGiamGia.getTrangThai() == null
                || maGiamGia.getTrangThai().trim().isEmpty()) {

            maGiamGia.setTrangThai("HOAT_DONG");
        } else {

            maGiamGia.setTrangThai(
                    maGiamGia.getTrangThai()
                            .trim()
                            .toUpperCase()
            );
        }


        // -----------------------------------------------------
        // LƯU DATABASE NGAY
        // saveAndFlush giúp phát hiện lỗi DB ngay tại đây
        // -----------------------------------------------------

        return maGiamGiaRepository.saveAndFlush(
                maGiamGia
        );
    }


    // =========================================================
    // XÓA
    // =========================================================

    @Transactional
    public void delete(Long id) {

        if (id == null) {
            throw new RuntimeException(
                    "ID voucher không hợp lệ"
            );
        }

        if (!maGiamGiaRepository.existsById(id)) {

            throw new RuntimeException(
                    "Không tìm thấy voucher cần xóa"
            );
        }

        maGiamGiaRepository.deleteById(id);
    }


    // =========================================================
    // KIỂM TRA MÃ ĐÃ TỒN TẠI
    // =========================================================

    public boolean existsByMaVoucher(String maVoucher) {

        if (maVoucher == null
                || maVoucher.trim().isEmpty()) {

            return false;
        }

        return maGiamGiaRepository.existsByMaVoucher(
                maVoucher.trim().toUpperCase()
        );
    }


    // =========================================================
    // DANH SÁCH VOUCHER ĐANG HOẠT ĐỘNG
    // =========================================================

    public List<MaGiamGia> getDangHoatDong() {

        tuDongCapNhatTrangThai();

        LocalDateTime now = LocalDateTime.now();

        return maGiamGiaRepository.findAll()
                .stream()

                // Trạng thái
                .filter(v ->
                        "HOAT_DONG".equalsIgnoreCase(
                                v.getTrangThai()
                        )
                )

                // Ngày bắt đầu
                .filter(v ->
                        v.getNgayBatDau() == null
                                || !now.isBefore(
                                v.getNgayBatDau()
                        )
                )

                // Ngày kết thúc
                .filter(v ->
                        v.getNgayKetThuc() == null
                                || !now.isAfter(
                                v.getNgayKetThuc()
                        )
                )

                // Số lượng
                .filter(v -> {

                    if (v.getSoLuong() == null) {
                        return true;
                    }

                    int daDung =
                            v.getSoLuongDaDung() != null
                                    ? v.getSoLuongDaDung()
                                    : 0;

                    return daDung < v.getSoLuong();
                })

                .toList();
    }


    // =========================================================
    // KIỂM TRA VOUCHER
    // =========================================================

    public Map<String, Object> kiemTraVoucher(
            String ma,
            BigDecimal tongTien,
            Long khachHangId
    ) {

        // -----------------------------------------------------
        // KIỂM TRA MÃ
        // -----------------------------------------------------

        if (ma == null || ma.trim().isEmpty()) {

            throw new RuntimeException(
                    "Vui lòng nhập mã giảm giá"
            );
        }


        // -----------------------------------------------------
        // KIỂM TRA TỔNG TIỀN
        // -----------------------------------------------------

        if (tongTien == null) {

            throw new RuntimeException(
                    "Tổng tiền không hợp lệ"
            );
        }

        if (tongTien.compareTo(BigDecimal.ZERO) < 0) {

            throw new RuntimeException(
                    "Tổng tiền không hợp lệ"
            );
        }


        String maChuan =
                ma.trim().toUpperCase();


        // -----------------------------------------------------
        // TÌM VOUCHER
        // -----------------------------------------------------

        MaGiamGia voucher =
                maGiamGiaRepository
                        .findByMaVoucher(maChuan)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Mã giảm giá không tồn tại"
                                )
                        );


        // -----------------------------------------------------
        // KIỂM TRA KHÁCH ĐÃ DÙNG CHƯA
        // -----------------------------------------------------

        if (khachHangId != null
                && hoaDonRepository
                .existsByKhachHang_IdAndVoucher_Id(
                        khachHangId,
                        voucher.getId()
                )) {

            throw new RuntimeException(
                    "Bạn đã sử dụng mã giảm giá này rồi"
            );
        }


        // -----------------------------------------------------
        // KIỂM TRA TRẠNG THÁI
        // -----------------------------------------------------

        if (!"HOAT_DONG".equalsIgnoreCase(
                voucher.getTrangThai()
        )) {

            throw new RuntimeException(
                    "Mã giảm giá đã hết hiệu lực"
            );
        }


        LocalDateTime now =
                LocalDateTime.now();


        // -----------------------------------------------------
        // KIỂM TRA NGÀY BẮT ĐẦU
        // -----------------------------------------------------

        if (voucher.getNgayBatDau() != null
                && now.isBefore(
                voucher.getNgayBatDau()
        )) {

            throw new RuntimeException(
                    "Mã giảm giá chưa đến thời gian sử dụng"
            );
        }


        // -----------------------------------------------------
        // KIỂM TRA NGÀY KẾT THÚC
        // -----------------------------------------------------

        if (voucher.getNgayKetThuc() != null
                && now.isAfter(
                voucher.getNgayKetThuc()
        )) {

            throw new RuntimeException(
                    "Mã giảm giá đã hết hạn"
            );
        }


        // -----------------------------------------------------
        // KIỂM TRA SỐ LƯỢNG
        // -----------------------------------------------------

        if (voucher.getSoLuong() != null) {

            int daDung =
                    voucher.getSoLuongDaDung() != null
                            ? voucher.getSoLuongDaDung()
                            : 0;

            if (daDung >= voucher.getSoLuong()) {

                throw new RuntimeException(
                        "Mã giảm giá đã hết lượt sử dụng"
                );
            }
        }


        // -----------------------------------------------------
        // KIỂM TRA ĐƠN TỐI THIỂU
        // -----------------------------------------------------

        if (voucher.getDonToiThieu() != null
                && tongTien.compareTo(
                voucher.getDonToiThieu()
        ) < 0) {

            throw new RuntimeException(
                    "Đơn hàng tối thiểu "
                            + formatTien(
                            voucher.getDonToiThieu()
                    )
                            + " để dùng mã này"
            );
        }


        // -----------------------------------------------------
        // XÁC ĐỊNH LOẠI VOUCHER
        // -----------------------------------------------------

        boolean laFreeship =
                "FREESHIP".equalsIgnoreCase(
                        voucher.getLoaiGiam()
                );


        BigDecimal tienGiam;


        // -----------------------------------------------------
        // FREESHIP
        // -----------------------------------------------------

        if (laFreeship) {

            tienGiam =
                    BigDecimal.ZERO;
        }


        // -----------------------------------------------------
        // PHẦN TRĂM
        // -----------------------------------------------------

        else if ("PHAN_TRAM".equalsIgnoreCase(
                voucher.getLoaiGiam()
        )) {

            tienGiam =
                    tongTien
                            .multiply(
                                    voucher.getGiaTriGiam()
                            )
                            .divide(
                                    BigDecimal.valueOf(100),
                                    0,
                                    RoundingMode.HALF_UP
                            );


            // Giảm tối đa
            if (voucher.getGiamToiDa() != null
                    && tienGiam.compareTo(
                    voucher.getGiamToiDa()
            ) > 0) {

                tienGiam =
                        voucher.getGiamToiDa();
            }
        }


        // -----------------------------------------------------
        // GIẢM THEO SỐ TIỀN
        // -----------------------------------------------------

        else {

            tienGiam =
                    voucher.getGiaTriGiam();
        }


        // -----------------------------------------------------
        // KHÔNG CHO GIẢM QUÁ TỔNG TIỀN
        // -----------------------------------------------------

        if (tienGiam.compareTo(tongTien) > 0) {

            tienGiam =
                    tongTien;
        }


        BigDecimal tongTienSauGiam =
                tongTien.subtract(tienGiam);


        // -----------------------------------------------------
        // KẾT QUẢ
        // -----------------------------------------------------

        Map<String, Object> result =
                new HashMap<>();

        result.put(
                "id",
                voucher.getId()
        );

        result.put(
                "maVoucher",
                voucher.getMaVoucher()
        );

        result.put(
                "tenVoucher",
                voucher.getTenVoucher()
        );

        result.put(
                "loaiGiam",
                voucher.getLoaiGiam()
        );

        result.put(
                "giaTriGiam",
                voucher.getGiaTriGiam()
        );

        result.put(
                "tienGiam",
                tienGiam
        );

        result.put(
                "tongTienSauGiam",
                tongTienSauGiam
        );

        result.put(
                "freeship",
                laFreeship
        );

        result.put(
                "message",
                laFreeship
                        ? "Áp dụng mã thành công! Đơn hàng được miễn phí vận chuyển."
                        : "Áp dụng mã giảm giá thành công"
        );

        return result;
    }


    // =========================================================
    // FORMAT TIỀN
    // =========================================================

    private String formatTien(BigDecimal tien) {

        return String.format(
                        "%,.0fđ",
                        tien.doubleValue()
                )
                .replace(",", ".");
    }


    // =========================================================
    // TĂNG SỐ LƯỢNG ĐÃ DÙNG
    // =========================================================

    @Transactional
    public void tangSoLuongDaDung(String ma) {

        if (ma == null || ma.trim().isEmpty()) {

            throw new RuntimeException(
                    "Mã voucher không được để trống"
            );
        }

        String maChuan =
                ma.trim().toUpperCase();


        MaGiamGia voucher =
                maGiamGiaRepository
                        .findByMaVoucher(maChuan)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy mã voucher"
                                )
                        );


        int daDung =
                voucher.getSoLuongDaDung() != null
                        ? voucher.getSoLuongDaDung()
                        : 0;


        if (voucher.getSoLuong() != null
                && daDung >= voucher.getSoLuong()) {

            throw new RuntimeException(
                    "Mã giảm giá đã hết lượt sử dụng"
            );
        }


        voucher.setSoLuongDaDung(
                daDung + 1
        );


        maGiamGiaRepository.saveAndFlush(
                voucher
        );
    }


    // =========================================================
    // TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI
    // =========================================================

    @Transactional
    public void tuDongCapNhatTrangThai() {

        LocalDateTime now =
                LocalDateTime.now();

        List<MaGiamGia> all =
                maGiamGiaRepository.findAll();


        for (MaGiamGia voucher : all) {

            // -------------------------------------------------
            // ĐÃ HẾT HẠN
            // -------------------------------------------------

            if ("HOAT_DONG".equalsIgnoreCase(
                    voucher.getTrangThai()
            )
                    && voucher.getNgayKetThuc() != null
                    && now.isAfter(
                    voucher.getNgayKetThuc()
            )) {

                voucher.setTrangThai(
                        "NGUNG_HOAT_DONG"
                );

                maGiamGiaRepository.save(
                        voucher
                );
            }


            // -------------------------------------------------
            // HẾT LƯỢT
            // -------------------------------------------------

            else if ("HOAT_DONG".equalsIgnoreCase(
                    voucher.getTrangThai()
            )
                    && voucher.getSoLuong() != null
                    && voucher.getSoLuongDaDung() != null
                    && voucher.getSoLuongDaDung()
                    >= voucher.getSoLuong()) {

                voucher.setTrangThai(
                        "NGUNG_HOAT_DONG"
                );

                maGiamGiaRepository.save(
                        voucher
                );
            }
        }
    }
}