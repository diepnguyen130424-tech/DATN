package com.example.bangiay.service;

import com.example.bangiay.dto.DatHangRequest;
import com.example.bangiay.dto.HoaDonResponse;
import com.example.bangiay.dto.TaoHoaDonTaiQuayRequest;
import com.example.bangiay.entity.*;
import com.example.bangiay.repository.*;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HoaDonService {

    private final HoaDonRepository hoaDonRepository;
    private final ChiTietHoaDonRepository chiTietHoaDonRepository;
    private final ThanhToanRepository thanhToanRepository;
    private final LichSuHoaDonRepository lichSuHoaDonRepository;
    private final MaGiamGiaRepository maGiamGiaRepository;
    private final GioHangRepository gioHangRepository;
    private final ChiTietGioHangRepository chiTietGioHangRepository;
    private final SanPhamChiTietRepository sanPhamChiTietRepository;

    private final KhoService khoService;
    private final DiaChiRepository diaChiRepository;


    // =========================================================
    // HÓA ĐƠN
    // =========================================================

    public List<HoaDon> getAll() {
        return hoaDonRepository.findAll();
    }


    public HoaDon getById(Long id) {
        return hoaDonRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy hóa đơn"
                        )
                );
    }


    public HoaDon getByMaHoaDon(String maHoaDon) {
        return hoaDonRepository.findByMaHoaDon(maHoaDon)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy hóa đơn"
                        )
                );
    }


    public HoaDon save(HoaDon hoaDon) {

        // Không để PUT cả object làm mất thời điểm khách đã xác nhận nhận hàng
        if (hoaDon.getId() != null && hoaDon.getNgayNhanHang() == null) {
            hoaDonRepository.findById(hoaDon.getId()).ifPresent(cu ->
                    hoaDon.setNgayNhanHang(cu.getNgayNhanHang())
            );
        }

        if (hoaDon.getNgayLap() == null) {
            hoaDon.setNgayLap(
                    LocalDateTime.now()
            );
        }

        if (hoaDon.getNgayCapNhat() == null) {
            hoaDon.setNgayCapNhat(
                    LocalDateTime.now()
            );
        } else {
            hoaDon.setNgayCapNhat(
                    LocalDateTime.now()
            );
        }

        if (hoaDon.getTienGiam() == null) {
            hoaDon.setTienGiam(
                    BigDecimal.ZERO
            );
        }

        if (hoaDon.getPhiVanChuyen() == null) {
            hoaDon.setPhiVanChuyen(
                    BigDecimal.ZERO
            );
        }

        if (hoaDon.getTrangThai() == null) {
            hoaDon.setTrangThai(
                    "CHO_XAC_NHAN"
            );
        }

        return hoaDonRepository.save(
                hoaDon
        );
    }


    public void delete(Long id) {

        hoaDonRepository.deleteById(id);
    }


    // =========================================================
    // ĐẶT HÀNG
    // =========================================================

    @Transactional
    public HoaDon datHang(
            Long gioHangId,
            Long voucherId,
            Long voucherFreeshipId,
            DatHangRequest request
    ) {

        // -----------------------------------------------------
        // 1. KIỂM TRA THÔNG TIN KHÁCH HÀNG
        // -----------------------------------------------------

        if (request == null) {

            throw new RuntimeException(
                    "Thông tin đặt hàng không được để trống"
            );
        }


        if (request.getHoTen() == null
                || request.getHoTen().trim().isEmpty()) {

            throw new RuntimeException(
                    "Họ tên không được để trống"
            );
        }


        if (request.getSoDienThoai() == null
                || request.getSoDienThoai().trim().isEmpty()) {

            throw new RuntimeException(
                    "Số điện thoại không được để trống"
            );
        }


        if (request.getDiaChi() == null
                || request.getDiaChi().trim().isEmpty()) {

            throw new RuntimeException(
                    "Địa chỉ không được để trống"
            );
        }


        // -----------------------------------------------------
        // 2. LẤY GIỎ HÀNG
        // -----------------------------------------------------

        GioHang gioHang =
                gioHangRepository.findById(
                                gioHangId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy giỏ hàng"
                                )
                        );


        // -----------------------------------------------------
        // 3. KIỂM TRA KHÁCH HÀNG TRONG GIỎ
        // -----------------------------------------------------

        if (gioHang.getKhachHang() == null) {

            throw new RuntimeException(
                    "Giỏ hàng chưa có khách hàng"
            );
        }


        // -----------------------------------------------------
        // 4. CẬP NHẬT THÔNG TIN KHÁCH HÀNG
        // -----------------------------------------------------

        KhachHang khachHang =
                gioHang.getKhachHang();

        khachHang.setHoTen(
                request.getHoTen().trim()
        );

        khachHang.setSoDienThoai(
                request.getSoDienThoai().trim()
        );


        // -----------------------------------------------------
        // 5. LẤY CHI TIẾT GIỎ HÀNG
        // -----------------------------------------------------

        List<ChiTietGioHang> danhSachGioHang =
                chiTietGioHangRepository
                        .findByGioHang_Id(
                                gioHangId
                        );


        if (danhSachGioHang == null
                || danhSachGioHang.isEmpty()) {

            throw new RuntimeException(
                    "Giỏ hàng đang trống"
            );
        }


        // -----------------------------------------------------
        // 6. TÍNH TỔNG TIỀN HÀNG
        // -----------------------------------------------------

        BigDecimal tongTienHang =
                BigDecimal.ZERO;


        for (ChiTietGioHang chiTiet :
                danhSachGioHang) {

            if (chiTiet.getSanPhamChiTiet() == null) {

                throw new RuntimeException(
                        "Chi tiết giỏ hàng không có sản phẩm"
                );
            }


            Long spctId =
                    chiTiet
                            .getSanPhamChiTiet()
                            .getId();


            SanPhamChiTiet spct =
                    sanPhamChiTietRepository
                            .findById(spctId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Không tìm thấy sản phẩm chi tiết"
                                    )
                            );


            Integer soLuong =
                    chiTiet.getSoLuong();


            if (soLuong == null
                    || soLuong <= 0) {

                throw new RuntimeException(
                        "Số lượng sản phẩm không hợp lệ"
                );
            }


            // -------------------------------------------------
            // KIỂM TRA TRẠNG THÁI SẢN PHẨM
            // -------------------------------------------------

            if (spct.getTrangThai() == null
                    ||
                    (
                            !"HOAT_DONG".equalsIgnoreCase(
                                    spct.getTrangThai()
                            )
                                    &&
                                    !"ACTIVE".equalsIgnoreCase(
                                            spct.getTrangThai()
                                    )
                    )
            ) {

                throw new RuntimeException(
                        "Sản phẩm đang không hoạt động"
                );
            }


            // -------------------------------------------------
            // KIỂM TRA TỒN KHO
            // -------------------------------------------------

            if (spct.getSoLuongTon() == null
                    || spct.getSoLuongTon() < soLuong) {

                throw new RuntimeException(
                        "Sản phẩm không đủ số lượng tồn kho"
                );
            }


            // -------------------------------------------------
            // LẤY GIÁ
            // -------------------------------------------------

            BigDecimal donGia =
                    spct.getGiaBan();


            if (donGia == null) {

                throw new RuntimeException(
                        "Sản phẩm chưa có giá bán"
                );
            }


            BigDecimal thanhTien =
                    donGia.multiply(
                            BigDecimal.valueOf(
                                    soLuong
                            )
                    );


            tongTienHang =
                    tongTienHang.add(
                            thanhTien
                    );
        }


        // -----------------------------------------------------
        // 7. XỬ LÝ VOUCHER GIẢM GIÁ (VOUCHER CHÍNH)
        // -----------------------------------------------------

        MaGiamGia voucher = null;

        BigDecimal tienGiam =
                BigDecimal.ZERO;


        if (voucherId != null) {

            voucher =
                    maGiamGiaRepository
                            .findById(voucherId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Không tìm thấy voucher"
                                    )
                            );

            if ("PHAN_TRAM".equalsIgnoreCase(voucher.getLoaiGiam())) {

                tienGiam = tongTienHang
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
                // SO_TIEN
                tienGiam = voucher.getGiaTriGiam();
            }

            // Không giảm quá tổng tiền
            if (tienGiam.compareTo(tongTienHang) > 0) {
                tienGiam = tongTienHang;
            }
        }


        // -----------------------------------------------------
        // 7.5. XỬ LÝ VOUCHER FREESHIP (VOUCHER PHỤ)
        // -----------------------------------------------------

        MaGiamGia voucherFreeship = null;

        if (voucherFreeshipId != null) {

            voucherFreeship =
                    maGiamGiaRepository
                            .findById(voucherFreeshipId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Không tìm thấy voucher FREESHIP"
                                    )
                            );

            // ⭐ Kiểm tra đúng loại FREESHIP
            if (!"FREESHIP".equalsIgnoreCase(voucherFreeship.getLoaiGiam())) {
                throw new RuntimeException(
                        "Voucher này không phải là FREESHIP"
                );
            }
        }


        // -----------------------------------------------------
        // 8. PHÍ VẬN CHUYỂN
        // -----------------------------------------------------

        BigDecimal phiVanChuyen = BigDecimal.ZERO;

        // ⭐ Nếu có voucher FREESHIP → miễn phí ship
        if (voucherFreeship != null) {
            phiVanChuyen = BigDecimal.ZERO;
        } else if (request.getPhiVanChuyen() != null) {
            // Nếu FE gửi phí ship cụ thể (khi không có freeship)
            phiVanChuyen = BigDecimal.valueOf(request.getPhiVanChuyen());
        } else {
            // Mặc định 30.000đ
            phiVanChuyen = BigDecimal.valueOf(30000);
        }


        // -----------------------------------------------------
        // 9. TỔNG THANH TOÁN
        // -----------------------------------------------------

        BigDecimal tongThanhToan =
                tongTienHang
                        .subtract(tienGiam)
                        .add(phiVanChuyen);


        // -----------------------------------------------------
        // 10. TẠO ĐỊA CHỈ NHẬN HÀNG
        // -----------------------------------------------------

        DiaChi diaChi =
                DiaChi.builder()
                        .khachHang(
                                gioHang.getKhachHang()
                        )
                        .tenNguoiNhan(
                                request
                                        .getHoTen()
                                        .trim()
                        )
                        .soDienThoai(
                                request
                                        .getSoDienThoai()
                                        .trim()
                        )
                        .diaChi(
                                request
                                        .getDiaChi()
                                        .trim()
                        )
                        .macDinh(false)
                        .build();


        DiaChi diaChiDaLuu =
                diaChiRepository.save(
                        diaChi
                );


        // -----------------------------------------------------
        // 11. TẠO HÓA ĐƠN
        // -----------------------------------------------------

        HoaDon hoaDon =
                new HoaDon();


        hoaDon.setMaHoaDon(
                "HD" + System.currentTimeMillis()
        );


        hoaDon.setKhachHang(
                gioHang.getKhachHang()
        );


        hoaDon.setDiaChi(
                diaChiDaLuu
        );


        // ⭐ GÁN VOUCHER GIẢM GIÁ
        hoaDon.setVoucher(
                voucher
        );


        hoaDon.setLoaiHoaDon(
                "ONLINE"
        );


        hoaDon.setNgayLap(
                LocalDateTime.now()
        );


        hoaDon.setTongTienHang(
                tongTienHang
        );


        hoaDon.setTienGiam(
                tienGiam
        );


        hoaDon.setPhiVanChuyen(
                phiVanChuyen
        );


        hoaDon.setTongThanhToan(
                tongThanhToan
        );


        hoaDon.setTrangThai(
                "CHO_XAC_NHAN"
        );


        hoaDon.setGhiChu(
                request.getGhiChu()
        );


        hoaDon.setNgayCapNhat(
                LocalDateTime.now()
        );


        HoaDon hoaDonDaLuu =
                hoaDonRepository.save(
                        hoaDon
                );


        // -----------------------------------------------------
        // 11.5. TRỪ LƯỢT VOUCHER
        // -----------------------------------------------------

        // ⭐ Trừ lượt voucher giảm giá
        if (voucher != null) {
            try {
                int daDung = voucher.getSoLuongDaDung() != null
                        ? voucher.getSoLuongDaDung()
                        : 0;

                voucher.setSoLuongDaDung(daDung + 1);
                maGiamGiaRepository.save(voucher);

                System.out.println("✅ Đã trừ 1 lượt voucher: "
                        + voucher.getMaVoucher()
                        + " (" + (daDung + 1) + "/" + voucher.getSoLuong() + ")");

            } catch (Exception e) {
                System.err.println("❌ Lỗi trừ lượt voucher: " + e.getMessage());
            }
        }

        // ⭐ Trừ lượt voucher FREESHIP
        if (voucherFreeship != null) {
            try {
                int daDung = voucherFreeship.getSoLuongDaDung() != null
                        ? voucherFreeship.getSoLuongDaDung()
                        : 0;

                voucherFreeship.setSoLuongDaDung(daDung + 1);
                maGiamGiaRepository.save(voucherFreeship);

                System.out.println("✅ Đã trừ 1 lượt voucher FREESHIP: "
                        + voucherFreeship.getMaVoucher()
                        + " (" + (daDung + 1) + "/" + voucherFreeship.getSoLuong() + ")");

            } catch (Exception e) {
                System.err.println("❌ Lỗi trừ lượt voucher FREESHIP: " + e.getMessage());
            }
        }


        // -----------------------------------------------------
        // 12. TẠO CHI TIẾT HÓA ĐƠN
        // -----------------------------------------------------

        for (ChiTietGioHang chiTiet :
                danhSachGioHang) {

            Long spctId =
                    chiTiet
                            .getSanPhamChiTiet()
                            .getId();


            SanPhamChiTiet spct =
                    sanPhamChiTietRepository
                            .findById(spctId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Không tìm thấy sản phẩm chi tiết"
                                    )
                            );


            Integer soLuong =
                    chiTiet.getSoLuong();


            BigDecimal donGia =
                    spct.getGiaBan();


            BigDecimal thanhTien =
                    donGia.multiply(
                            BigDecimal.valueOf(
                                    soLuong
                            )
                    );


            ChiTietHoaDon chiTietHoaDon =
                    new ChiTietHoaDon();


            chiTietHoaDon.setHoaDon(
                    hoaDonDaLuu
            );


            chiTietHoaDon.setSanPhamChiTiet(
                    spct
            );


            chiTietHoaDon.setSoLuong(
                    soLuong
            );


            chiTietHoaDon.setDonGia(
                    donGia
            );


            chiTietHoaDon.setThanhTien(
                    thanhTien
            );


            chiTietHoaDonRepository.save(
                    chiTietHoaDon
            );
        }


        // -----------------------------------------------------
        // 13. LƯU LỊCH SỬ HÓA ĐƠN
        // -----------------------------------------------------

        LichSuHoaDon lichSu =
                new LichSuHoaDon();


        lichSu.setHoaDon(
                hoaDonDaLuu
        );


        lichSu.setTrangThai(
                "CHO_XAC_NHAN"
        );


        lichSu.setThoiGian(
                LocalDateTime.now()
        );


        lichSu.setGhiChu(
                "Khách hàng đặt hàng online"
        );


        lichSuHoaDonRepository.save(
                lichSu
        );


        // -----------------------------------------------------
        // 14. TẠO THANH TOÁN
        // -----------------------------------------------------

        if (request.getPhuongThuc() != null
                &&
                !request
                        .getPhuongThuc()
                        .trim()
                        .isEmpty()) {

            ThanhToan thanhToan =
                    new ThanhToan();


            thanhToan.setHoaDon(
                    hoaDonDaLuu
            );


            thanhToan.setPhuongThuc(
                    request.getPhuongThuc()
            );


            thanhToan.setSoTien(
                    tongThanhToan
            );


            thanhToan.setTrangThai(
                    "CHO_THANH_TOAN"
            );


            thanhToan.setMaGiaoDich(
                    "GD_" + hoaDonDaLuu.getId()
            );


            thanhToanRepository.save(
                    thanhToan
            );
        }


        // -----------------------------------------------------
        // 15. LẤY CHI TIẾT HÓA ĐƠN ĐÃ LƯU
        // -----------------------------------------------------

        List<ChiTietHoaDon> chiTietDaLuu =
                chiTietHoaDonRepository
                        .findByHoaDon_Id(
                                hoaDonDaLuu.getId()
                        );


        // -----------------------------------------------------
        // 16. XUẤT KHO
        // -----------------------------------------------------

        khoService.xuatKhoTuHoaDon(
                hoaDonDaLuu.getMaHoaDon(),
                chiTietDaLuu
        );


        // -----------------------------------------------------
        // 17. XÓA GIỎ HÀNG
        // -----------------------------------------------------

        chiTietGioHangRepository.deleteAll(
                danhSachGioHang
        );


        return hoaDonDaLuu;
    }


    // =========================================================
    // TẠO HÓA ĐƠN TẠI QUẦY (POS)
    // =========================================================

    @Transactional
    public HoaDonResponse taoHoaDonTaiQuay(
            TaoHoaDonTaiQuayRequest request
    ) {

        // -----------------------------------------------------
        // 1. KIỂM TRA REQUEST
        // -----------------------------------------------------

        if (request == null) {

            throw new RuntimeException(
                    "Thông tin hóa đơn không được để trống"
            );
        }


        if (request.getChiTiet() == null
                || request.getChiTiet().isEmpty()) {

            throw new RuntimeException(
                    "Giỏ hàng đang trống"
            );
        }


        // -----------------------------------------------------
        // 2. TẠO HÓA ĐƠN
        // -----------------------------------------------------

        HoaDon hoaDon =
                new HoaDon();


        hoaDon.setMaHoaDon(
                "HD" + System.currentTimeMillis()
        );


        hoaDon.setLoaiHoaDon(
                "TAI_QUAY"
        );


        hoaDon.setTrangThai(
                "DA_THANH_TOAN"
        );


        hoaDon.setNgayLap(
                LocalDateTime.now()
        );


        hoaDon.setNgayCapNhat(
                LocalDateTime.now()
        );


        hoaDon.setTongTienHang(
                BigDecimal.ZERO
        );


        hoaDon.setTienGiam(
                BigDecimal.ZERO
        );


        hoaDon.setPhiVanChuyen(
                BigDecimal.ZERO
        );


        hoaDon.setTongThanhToan(
                BigDecimal.ZERO
        );


        hoaDon.setGhiChu(
                "Hóa đơn bán tại quầy"
        );


        HoaDon hoaDonDaLuu =
                hoaDonRepository.save(
                        hoaDon
                );


        // -----------------------------------------------------
        // 3. TÍNH TỔNG TIỀN + TẠO CHI TIẾT HÓA ĐƠN
        // -----------------------------------------------------

        BigDecimal tongTienHang =
                BigDecimal.ZERO;


        for (TaoHoaDonTaiQuayRequest.ChiTiet ct :
                request.getChiTiet()) {

            if (ct.getSanPhamChiTietId() == null) {

                throw new RuntimeException(
                        "Chi tiết hóa đơn không có sản phẩm"
                );
            }


            SanPhamChiTiet spct =
                    sanPhamChiTietRepository
                            .findById(
                                    ct.getSanPhamChiTietId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Không tìm thấy sản phẩm chi tiết"
                                    )
                            );


            Integer soLuong =
                    ct.getSoLuong();


            if (soLuong == null
                    || soLuong <= 0) {

                throw new RuntimeException(
                        "Số lượng sản phẩm không hợp lệ"
                );
            }


            // -------------------------------------------------
            // KIỂM TRA TRẠNG THÁI SẢN PHẨM
            // -------------------------------------------------

            if (spct.getTrangThai() == null
                    ||
                    (
                            !"HOAT_DONG".equalsIgnoreCase(
                                    spct.getTrangThai()
                            )
                                    &&
                                    !"ACTIVE".equalsIgnoreCase(
                                            spct.getTrangThai()
                                    )
                    )
            ) {

                throw new RuntimeException(
                        "Sản phẩm đang không hoạt động"
                );
            }


            // -------------------------------------------------
            // KIỂM TRA TỒN KHO
            // -------------------------------------------------

            if (spct.getSoLuongTon() == null
                    || spct.getSoLuongTon() < soLuong) {

                throw new RuntimeException(
                        "Sản phẩm không đủ số lượng tồn kho"
                );
            }


            // -------------------------------------------------
            // LẤY GIÁ
            // -------------------------------------------------

            BigDecimal donGia =
                    spct.getGiaBan();


            if (donGia == null) {

                throw new RuntimeException(
                        "Sản phẩm chưa có giá bán"
                );
            }


            BigDecimal thanhTien =
                    donGia.multiply(
                            BigDecimal.valueOf(
                                    soLuong
                            )
                    );


            // -------------------------------------------------
            // TẠO CHI TIẾT HÓA ĐƠN
            // -------------------------------------------------

            ChiTietHoaDon chiTietHoaDon =
                    new ChiTietHoaDon();


            chiTietHoaDon.setHoaDon(
                    hoaDonDaLuu
            );


            chiTietHoaDon.setSanPhamChiTiet(
                    spct
            );


            chiTietHoaDon.setSoLuong(
                    soLuong
            );


            chiTietHoaDon.setDonGia(
                    donGia
            );


            chiTietHoaDon.setThanhTien(
                    thanhTien
            );


            chiTietHoaDonRepository.save(
                    chiTietHoaDon
            );


            tongTienHang =
                    tongTienHang.add(
                            thanhTien
                    );
        }


        // -----------------------------------------------------
        // 4. CẬP NHẬT TỔNG TIỀN VÀO HÓA ĐƠN
        // -----------------------------------------------------

        hoaDonDaLuu.setTongTienHang(
                tongTienHang
        );


        hoaDonDaLuu.setTongThanhToan(
                tongTienHang
        );


        hoaDonDaLuu.setNgayCapNhat(
                LocalDateTime.now()
        );


        HoaDon hoaDonCapNhat =
                hoaDonRepository.save(
                        hoaDonDaLuu
                );


        // -----------------------------------------------------
        // 5. LẤY CHI TIẾT HÓA ĐƠN ĐÃ LƯU
        // -----------------------------------------------------

        List<ChiTietHoaDon> chiTietDaLuu =
                chiTietHoaDonRepository
                        .findByHoaDon_Id(
                                hoaDonCapNhat.getId()
                        );


        // -----------------------------------------------------
        // 6. TẠO THANH TOÁN
        // -----------------------------------------------------

        String phuongThuc =
                request.getPhuongThucThanhToan();


        if (phuongThuc == null
                || phuongThuc.trim().isEmpty()) {

            phuongThuc = "TIEN_MAT";
        }


        ThanhToan thanhToan =
                new ThanhToan();


        thanhToan.setHoaDon(
                hoaDonCapNhat
        );


        thanhToan.setPhuongThuc(
                phuongThuc
        );


        thanhToan.setSoTien(
                tongTienHang
        );


        thanhToan.setTrangThai(
                "DA_THANH_TOAN"
        );


        thanhToan.setMaGiaoDich(
                "GD_" + hoaDonCapNhat.getId()
        );


        thanhToan.setNgayThanhToan(
                LocalDateTime.now()
        );


        thanhToanRepository.save(
                thanhToan
        );


        // -----------------------------------------------------
        // 7. LƯU LỊCH SỬ HÓA ĐƠN
        // -----------------------------------------------------

        LichSuHoaDon lichSu =
                new LichSuHoaDon();


        lichSu.setHoaDon(
                hoaDonCapNhat
        );


        lichSu.setTrangThai(
                "DA_THANH_TOAN"
        );


        lichSu.setThoiGian(
                LocalDateTime.now()
        );


        lichSu.setGhiChu(
                "Tạo hóa đơn tại quầy"
        );


        lichSuHoaDonRepository.save(
                lichSu
        );


        // -----------------------------------------------------
        // 8. XUẤT KHO
        //    (khoService tự trừ tồn kho, giống datHang)
        // -----------------------------------------------------

        try {

            khoService.xuatKhoTuHoaDon(
                    hoaDonCapNhat.getMaHoaDon(),
                    chiTietDaLuu
            );

        } catch (Exception e) {

            System.err.println(
                    "❌ Lỗi xuất kho: " + e.getMessage()
            );
        }


        // -----------------------------------------------------
        // 9. MAP SANG DTO
        // -----------------------------------------------------

        HoaDonResponse response =
                new HoaDonResponse();


        response.setId(
                hoaDonCapNhat.getId()
        );


        response.setMaHoaDon(
                hoaDonCapNhat.getMaHoaDon()
        );


        response.setLoaiHoaDon(
                hoaDonCapNhat.getLoaiHoaDon()
        );


        response.setTrangThai(
                hoaDonCapNhat.getTrangThai()
        );


        response.setTongThanhToan(
                hoaDonCapNhat.getTongThanhToan() != null
                        ? hoaDonCapNhat.getTongThanhToan().doubleValue()
                        : 0.0
        );


        response.setPhuongThucThanhToan(
                phuongThuc
        );


        response.setNgayLap(
                hoaDonCapNhat.getNgayLap()
        );


        response.setNgayCapNhat(
                hoaDonCapNhat.getNgayCapNhat()
        );


        response.setGhiChu(
                hoaDonCapNhat.getGhiChu()
        );


        response.setChiTiet(
                chiTietDaLuu
                        .stream()
                        .map(ct -> {

                            HoaDonResponse.ChiTietResponse item =
                                    new HoaDonResponse.ChiTietResponse();

                            item.setId(
                                    ct.getId()
                            );

                            item.setSanPhamChiTietId(
                                    ct.getSanPhamChiTiet().getId()
                            );

                            item.setSoLuong(
                                    ct.getSoLuong()
                            );

                            item.setDonGia(
                                    ct.getDonGia() != null
                                            ? ct.getDonGia().doubleValue()
                                            : 0.0
                            );

                            item.setThanhTien(
                                    ct.getThanhTien() != null
                                            ? ct.getThanhTien().doubleValue()
                                            : 0.0
                            );

                            return item;
                        })
                        .toList()
        );


        return response;
    }


    // =========================================================
    // CHI TIẾT HÓA ĐƠN
    // =========================================================

    public List<ChiTietHoaDon> getChiTietByHoaDonId(
            Long hoaDonId
    ) {

        return chiTietHoaDonRepository
                .findByHoaDon_Id(
                        hoaDonId
                );
    }


    public ChiTietHoaDon saveChiTiet(
            ChiTietHoaDon chiTietHoaDon
    ) {

        return chiTietHoaDonRepository.save(
                chiTietHoaDon
        );
    }


    public void deleteChiTiet(Long id) {

        chiTietHoaDonRepository.deleteById(id);
    }


    // =========================================================
    // THANH TOÁN
    // =========================================================

    public ThanhToan getThanhToanByHoaDonId(
            Long hoaDonId
    ) {

        return thanhToanRepository
                .findByHoaDon_Id(
                        hoaDonId
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy thanh toán"
                        )
                );
    }


    public ThanhToan saveThanhToan(
            ThanhToan thanhToan
    ) {

        if (thanhToan.getHoaDon() == null
                || thanhToan.getHoaDon().getId() == null) {

            throw new RuntimeException(
                    "Thanh toán phải có hóa đơn"
            );
        }


        HoaDon hoaDon =
                hoaDonRepository.findById(
                                thanhToan
                                        .getHoaDon()
                                        .getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy hóa đơn"
                                )
                        );


        thanhToan.setHoaDon(
                hoaDon
        );


        thanhToan.setSoTien(
                hoaDon.getTongThanhToan()
        );


        if ("DA_THANH_TOAN".equalsIgnoreCase(
                thanhToan.getTrangThai()
        )) {

            thanhToan.setNgayThanhToan(
                    LocalDateTime.now()
            );
        }


        return thanhToanRepository.save(
                thanhToan
        );
    }


    // =========================================================
    // LỊCH SỬ HÓA ĐƠN
    // =========================================================

    public List<LichSuHoaDon> getLichSuByHoaDonId(
            Long hoaDonId
    ) {

        return lichSuHoaDonRepository
                .findByHoaDon_IdOrderByThoiGianDesc(
                        hoaDonId
                );
    }


    public LichSuHoaDon saveLichSu(
            LichSuHoaDon lichSuHoaDon
    ) {

        if (lichSuHoaDon.getThoiGian() == null) {

            lichSuHoaDon.setThoiGian(
                    LocalDateTime.now()
            );
        }


        return lichSuHoaDonRepository.save(
                lichSuHoaDon
        );
    }


    // =========================================================
    // TÌM HÓA ĐƠN THEO KHÁCH HÀNG
    // =========================================================

    public List<HoaDon> getByKhachHangId(
            Long khachHangId
    ) {

        return hoaDonRepository
                .findByKhachHang_Id(
                        khachHangId
                );
    }


    // =========================================================
    // TÌM HÓA ĐƠN THEO NHÂN VIÊN
    // =========================================================

    public List<HoaDon> getByNhanVienId(
            Long nhanVienId
    ) {

        return hoaDonRepository
                .findByNhanVien_Id(
                        nhanVienId
                );
    }


    // =========================================================
    // TÌM HÓA ĐƠN THEO TRẠNG THÁI
    // =========================================================

    public List<HoaDon> getByTrangThai(
            String trangThai
    ) {

        return hoaDonRepository
                .findByTrangThai(
                        trangThai
                );
    }


    // =========================================================
    // TÌM HÓA ĐƠN THEO LOẠI
    // =========================================================

    public List<HoaDon> getByLoaiHoaDon(
            String loaiHoaDon
    ) {

        return hoaDonRepository
                .findByLoaiHoaDon(
                        loaiHoaDon
                );
    }


    // =========================================================
    // CẬP NHẬT TRẠNG THÁI HÓA ĐƠN
    // =========================================================

    @Transactional
    public HoaDon capNhatTrangThai(
            Long id,
            String trangThai,
            String ghiChu
    ) {

        HoaDon hoaDon =
                hoaDonRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy hóa đơn"
                                )
                        );


        hoaDon.setTrangThai(
                trangThai
        );


        if (ghiChu != null
                && !ghiChu.trim().isEmpty()) {

            hoaDon.setGhiChu(
                    ghiChu
            );
        }


        hoaDon.setNgayCapNhat(
                LocalDateTime.now()
        );


        HoaDon hoaDonDaLuu =
                hoaDonRepository.save(
                        hoaDon
                );


        LichSuHoaDon lichSu =
                new LichSuHoaDon();


        lichSu.setHoaDon(
                hoaDonDaLuu
        );


        lichSu.setTrangThai(
                trangThai
        );


        lichSu.setThoiGian(
                LocalDateTime.now()
        );


        lichSu.setGhiChu(
                ghiChu
        );


        lichSuHoaDonRepository.save(
                lichSu
        );


        return hoaDonDaLuu;
    }


    // =========================================================
    // KHÁCH XÁC NHẬN ĐÃ NHẬN HÀNG
    // =========================================================

    @Transactional
    public HoaDon xacNhanDaNhanHang(Long id, Long khachHangId) {

        HoaDon hoaDon = hoaDonRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy hóa đơn"));

        if (hoaDon.getKhachHang() == null
                || khachHangId == null
                || !hoaDon.getKhachHang().getId().equals(khachHangId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Bạn không có quyền xác nhận đơn hàng này");
        }

        if (!"DA_GIAO".equalsIgnoreCase(hoaDon.getTrangThai())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Chỉ xác nhận được khi đơn hàng đã giao");
        }

        // Bấm lại nhiều lần vẫn an toàn
        if (hoaDon.getNgayNhanHang() != null) {
            return hoaDon;
        }

        return danhDauDaNhan(hoaDon, "Khách hàng đã xác nhận nhận hàng");
    }

    // Chạy tự động mỗi giờ: đơn DA_GIAO quá soNgay ngày mà khách chưa xác nhận
    @Transactional
    public int tuDongXacNhanNhanHang(int soNgay) {

        LocalDateTime moc = LocalDateTime.now().minusDays(soNgay);

        List<HoaDon> dsDon = hoaDonRepository
                .findByTrangThaiAndNgayNhanHangIsNullAndNgayCapNhatBefore("DA_GIAO", moc);

        for (HoaDon hoaDon : dsDon) {
            danhDauDaNhan(hoaDon,
                    "Hệ thống tự động xác nhận đã nhận hàng sau " + soNgay + " ngày");
        }

        return dsDon.size();
    }

    private HoaDon danhDauDaNhan(HoaDon hoaDon, String ghiChu) {

        LocalDateTime now = LocalDateTime.now();

        hoaDon.setNgayNhanHang(now);
        hoaDon.setNgayCapNhat(now);

        HoaDon daLuu = hoaDonRepository.save(hoaDon);

        LichSuHoaDon lichSu = new LichSuHoaDon();
        lichSu.setHoaDon(daLuu);
        lichSu.setTrangThai("DA_GIAO");
        lichSu.setThoiGian(now);
        lichSu.setGhiChu(ghiChu);
        lichSuHoaDonRepository.save(lichSu);

        return daLuu;
    }

}
