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
    private final KhachHangRepository khachHangRepository;
    private final KhachHangTaiQuayRepository khachHangTaiQuayRepository;
    private final ShippingService shippingService;


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

        List<ChiTietGioHang> tatCaGioHang =
                chiTietGioHangRepository.findByGioHang_Id(gioHangId);

        if (tatCaGioHang == null || tatCaGioHang.isEmpty()) {
            throw new RuntimeException("Giỏ hàng đang trống");
        }

        if (request.getChiTietGioHangIds() == null
                || request.getChiTietGioHangIds().isEmpty()) {
            throw new RuntimeException("Vui lòng chọn sản phẩm để đặt hàng");
        }

        List<Long> idsDuocChon = request.getChiTietGioHangIds()
                .stream()
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();

        if (idsDuocChon.isEmpty()) {
            throw new RuntimeException("Không tìm thấy sản phẩm được chọn");
        }

        List<ChiTietGioHang> danhSachGioHang = tatCaGioHang.stream()
                .filter(ct -> idsDuocChon.contains(ct.getId()))
                .collect(java.util.stream.Collectors.toList());

        if (danhSachGioHang.size() != idsDuocChon.size()) {
            throw new RuntimeException(
                    "Một hoặc nhiều sản phẩm được chọn không tồn tại trong giỏ hàng"
            );
        }


        if (danhSachGioHang == null
                || danhSachGioHang.isEmpty()) {

            throw new RuntimeException(
                    "Giỏ hàng đang trống"
            );
        }


        // -----------------------------------------------------
        // 6. TÍNH TỔNG TIỀN HÀNG & KIỂM TRA TRẠNG THÁI
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


            // ⭐ SỬA TẠI ĐÂY: KIỂM TRA CẢ SẢN PHẨM CHA VÀ BIẾN THỂ
            SanPham sanPhamCha = spct.getSanPham();

            // 1. Kiểm tra sản phẩm cha (Quan trọng nhất)
            if (sanPhamCha == null || sanPhamCha.getTrangThai() == null
                    || (!"HOAT_DONG".equalsIgnoreCase(sanPhamCha.getTrangThai())
                    && !"ACTIVE".equalsIgnoreCase(sanPhamCha.getTrangThai()))) {
                String tenSp = sanPhamCha != null ? sanPhamCha.getTenSanPham() : "Không xác định";
                throw new RuntimeException("Sản phẩm '" + tenSp + "' đã ngừng kinh doanh, không thể đặt hàng!");
            }

            // 2. Kiểm tra biến thể
            if (spct.getTrangThai() == null
                    || (!"HOAT_DONG".equalsIgnoreCase(spct.getTrangThai())
                    && !"ACTIVE".equalsIgnoreCase(spct.getTrangThai()))) {
                throw new RuntimeException("Biến thể sản phẩm đang không hoạt động");
            }


            // -------------------------------------------------
            // KIỂM TRA VÀ TRỪ TỒN KHO NGAY LẬP TỨC
            // -------------------------------------------------

            if (spct.getSoLuongTon() == null
                    || spct.getSoLuongTon() < soLuong) {

                throw new RuntimeException(
                        "Sản phẩm " + spct.getMaSku() + " chỉ còn " + spct.getSoLuongTon() + " sản phẩm. Không đủ để đặt hàng!"
                );
            }

            // ⭐ TRỪ KHO NGAY TẠI ĐÂY
            spct.setSoLuongTon(spct.getSoLuongTon() - soLuong);
            sanPhamChiTietRepository.save(spct);


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
        } else {
            // ⭐ Phí ship tính theo khoảng cách cửa hàng → địa chỉ nhận (server tự tính, không tin FE)
            phiVanChuyen = BigDecimal.valueOf(
                    shippingService.tinhPhi(
                            request.getDiaChi(),
                            danhSachGioHang.stream()
                                    .mapToInt(ct -> ct.getSoLuong() != null ? ct.getSoLuong() : 1)
                                    .sum()
                    ).getPhiShip()
            );
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
                        .khachHang(gioHang.getKhachHang())
                        .tenNguoiNhan(request.getHoTen().trim())
                        .soDienThoai(request.getSoDienThoai().trim())
                        .diaChi(request.getDiaChi().trim())
                        .macDinh(false)
                        .phiShip(
                                voucherFreeship != null
                                        ? 0
                                        : phiVanChuyen.intValue()
                        )
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
        // GÁN VOUCHER GIẢM GIÁ
        hoaDon.setVoucher(voucher);

// GÁN VOUCHER FREESHIP
        hoaDon.setVoucherFreeship(voucherFreeship);


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
        // 15. XÓA GIỎ HÀNG (Kho đã được trừ ở bước 6)
        // -----------------------------------------------------

        chiTietGioHangRepository.deleteAll(
                danhSachGioHang
        );


        return hoaDonDaLuu;
    }


    // =========================================================
    // CHUẨN HÓA SĐT NGƯỜI MUA (null/rỗng = không nhập)
    // Chấp nhận: 0912345678, 0912 345 678, +84912345678, 84912345678
    // =========================================================

    private String chuanHoaSoDienThoai(String raw) {

        if (raw == null || raw.trim().isEmpty()) {
            return null;
        }

        String sdt = raw.replaceAll("[\\s.\\-()]", "");

        if (sdt.startsWith("+84")) {
            sdt = "0" + sdt.substring(3);
        } else if (sdt.startsWith("84") && sdt.length() == 11) {
            sdt = "0" + sdt.substring(2);
        }

        if (!sdt.matches("^0\\d{9}$")) {
            throw new RuntimeException(
                    "Số điện thoại không hợp lệ (cần 10 chữ số, bắt đầu bằng 0)"
            );
        }

        return sdt;
    }


    // =========================================================
    // TRA CỨU TÊN KHÁCH THEO SĐT (POS tự điền tên)
    // Ưu tiên: khách đã đăng ký  →  hóa đơn tại quầy gần nhất
    // =========================================================

    public java.util.Map<String, String> traCuuTenTheoSdt(String raw) {

        String sdt;

        try {
            sdt = chuanHoaSoDienThoai(raw);
        } catch (RuntimeException e) {
            return java.util.Map.of();
        }

        if (sdt == null) {
            return java.util.Map.of();
        }

        KhachHang daDangKy = timKhachDaDangKy(sdt).orElse(null);

        if (daDangKy != null
                && daDangKy.getHoTen() != null
                && !daDangKy.getHoTen().trim().isEmpty()) {
            return java.util.Map.of(
                    "tenKhach", daDangKy.getHoTen().trim(),
                    "khachHangId", String.valueOf(daDangKy.getId()),
                    "maKhachHang", String.valueOf(daDangKy.getId()),
                    "nguon", "KHACH_HANG"
            );
        }

        KhachHangTaiQuay khachQuay =
                khachHangTaiQuayRepository.findBySoDienThoai(sdt).orElse(null);

        if (khachQuay != null) {

            java.util.Map<String, String> kq = new java.util.HashMap<>();
            kq.put("maKhachHang", String.valueOf(khachQuay.getId()));
            kq.put("nguon", "KHACH_QUAY");

            if (khachQuay.getHoTen() != null
                    && !khachQuay.getHoTen().trim().isEmpty()) {
                kq.put("tenKhach", khachQuay.getHoTen().trim());
            } else {
                String tuHoaDon = timTenTuHoaDonCu(sdt);
                if (tuHoaDon != null) {
                    kq.put("tenKhach", tuHoaDon);
                }
            }

            return kq;
        }

        String tuHoaDon = timTenTuHoaDonCu(sdt);

        if (tuHoaDon != null) {
            return java.util.Map.of(
                    "tenKhach", tuHoaDon,
                    "nguon", "HOA_DON"
            );
        }

        return java.util.Map.of();
    }

    private String timTenTheoSdt(String sdtChuan) {

        String ten = timTenKhachDaDangKy(sdtChuan);

        return ten != null ? ten : timTenTuHoaDonCu(sdtChuan);
    }

    private java.util.Optional<KhachHang> timKhachDaDangKy(String sdtChuan) {

        List<String> cacDang = List.of(
                sdtChuan,
                "+84" + sdtChuan.substring(1),
                "84" + sdtChuan.substring(1)
        );

        return khachHangRepository.findFirstBySoDienThoaiIn(cacDang);
    }

    private KhachHangTaiQuay luuKhachTaiQuay(String sdtChuan, String ten) {

        KhachHangTaiQuay khach =
                khachHangTaiQuayRepository
                        .findBySoDienThoai(sdtChuan)
                        .orElse(null);

        if (khach == null) {

            khach = new KhachHangTaiQuay();
            khach.setSoDienThoai(sdtChuan);
            khach.setHoTen(ten);
            khach.setNgayTao(LocalDateTime.now());

            return khachHangTaiQuayRepository.save(khach);
        }

        // Nhập tên mới cho SĐT đã có → cập nhật theo lần nhập gần nhất
        if (ten != null && !ten.equals(khach.getHoTen())) {
            khach.setHoTen(ten);
            return khachHangTaiQuayRepository.save(khach);
        }

        return khach;
    }

    private String timTenKhachDaDangKy(String sdtChuan) {

        return timKhachDaDangKy(sdtChuan)
                .map(KhachHang::getHoTen)
                .filter(t -> t != null && !t.trim().isEmpty())
                .orElse(null);
    }

    private String timTenTuHoaDonCu(String sdtChuan) {

        String tuKhachQuay =
                khachHangTaiQuayRepository
                        .findBySoDienThoai(sdtChuan)
                        .map(KhachHangTaiQuay::getHoTen)
                        .filter(t -> t != null && !t.trim().isEmpty())
                        .orElse(null);

        if (tuKhachQuay != null) {
            return tuKhachQuay;
        }

        return hoaDonRepository
                .findFirstBySoDienThoaiKhachAndTenKhachIsNotNullOrderByNgayLapDesc(
                        sdtChuan
                )
                .map(HoaDon::getTenKhach)
                .filter(t -> !t.trim().isEmpty())
                .orElse(null);
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
        // 1b. CHUẨN HÓA + KIỂM TRA SĐT NGƯỜI MUA (không bắt buộc)
        // -----------------------------------------------------

        String soDienThoaiKhach =
                chuanHoaSoDienThoai(
                        request.getSoDienThoaiKhach()
                );


        String tenKhach =
                request.getTenKhach() == null
                        ? ""
                        : request.getTenKhach().trim().replaceAll("\\s+", " ");

        if (tenKhach.length() > 100) {

            throw new RuntimeException(
                    "Tên khách hàng tối đa 100 ký tự"
            );
        }

        if (tenKhach.isEmpty()) {
            tenKhach = null;
        }

        // Có SĐT mà chưa nhập tên → tự lấy tên theo SĐT (nếu đã từng có)
        if (tenKhach == null && soDienThoaiKhach != null) {
            tenKhach = timTenTheoSdt(soDienThoaiKhach);
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


        hoaDon.setSoDienThoaiKhach(
                soDienThoaiKhach
        );


        hoaDon.setTenKhach(
                tenKhach
        );


        // Có SĐT: trùng khách đã đăng ký → gắn ID khách đó;
        // chưa đăng ký → tìm/tạo "khách tại quầy" theo SĐT để có ID (Q…)
        if (soDienThoaiKhach != null) {

            KhachHang daDangKy =
                    timKhachDaDangKy(soDienThoaiKhach).orElse(null);

            if (daDangKy != null) {

                hoaDon.setKhachHang(daDangKy);

            } else {

                hoaDon.setKhachHangQuay(
                        luuKhachTaiQuay(soDienThoaiKhach, tenKhach)
                );
            }
        }


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


            // ⭐ SỬA TẠI ĐÂY: KIỂM TRA CẢ SẢN PHẨM CHA VÀ BIẾN THỂ
            SanPham sanPhamCha = spct.getSanPham();

            // 1. Kiểm tra sản phẩm cha
            if (sanPhamCha == null || sanPhamCha.getTrangThai() == null
                    || (!"HOAT_DONG".equalsIgnoreCase(sanPhamCha.getTrangThai())
                    && !"ACTIVE".equalsIgnoreCase(sanPhamCha.getTrangThai()))) {
                String tenSp = sanPhamCha != null ? sanPhamCha.getTenSanPham() : "Không xác định";
                throw new RuntimeException("Sản phẩm '" + tenSp + "' đã ngừng kinh doanh, không thể bán!");
            }

            // 2. Kiểm tra biến thể
            if (spct.getTrangThai() == null
                    || (!"HOAT_DONG".equalsIgnoreCase(spct.getTrangThai())
                    && !"ACTIVE".equalsIgnoreCase(spct.getTrangThai()))) {
                throw new RuntimeException("Biến thể sản phẩm đang không hoạt động");
            }

            // -------------------------------------------------
            // KIỂM TRA VÀ TRỪ TỒN KHO
            // -------------------------------------------------
            if (spct.getSoLuongTon() == null
                    || spct.getSoLuongTon() < soLuong) {
                throw new RuntimeException(
                        "Sản phẩm chỉ còn " + spct.getSoLuongTon() + " sản phẩm. Không thể bán!"
                );
            }

            // Trừ kho trực tiếp
            spct.setSoLuongTon(spct.getSoLuongTon() - soLuong);
            sanPhamChiTietRepository.save(spct);


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
        //    (Đơn tại quầy: trừ kho ngay vì đã thanh toán & giao hàng)
        // -----------------------------------------------------

//        try {
//
//            khoService.xuatKhoTuHoaDon(
//                    hoaDonCapNhat.getMaHoaDon(),
//                    chiTietDaLuu
//            );
//
//        } catch (Exception e) {
//
//            System.err.println(
//                    "❌ Lỗi xuất kho: " + e.getMessage()
//            );
//        }


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


        response.setSoDienThoaiKhach(
                hoaDonCapNhat.getSoDienThoaiKhach()
        );


        response.setTenKhach(
                hoaDonCapNhat.getTenKhach()
        );


        response.setKhachHangId(
                hoaDonCapNhat.getKhachHang() != null
                        ? hoaDonCapNhat.getKhachHang().getId()
                        : null
        );


        response.setMaKhachHang(
                hoaDonCapNhat.getKhachHang() != null
                        ? String.valueOf(hoaDonCapNhat.getKhachHang().getId())
                        : hoaDonCapNhat.getKhachHangQuay() != null
                        ? String.valueOf(hoaDonCapNhat.getKhachHangQuay().getId())
                        : null
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

    public ThanhToan getThanhToanByHoaDonId(Long hoaDonId) {
        // Trả về null nếu không tìm thấy, thay vì ném lỗi làm sập app
        return thanhToanRepository.findByHoaDon_Id(hoaDonId).orElse(null);
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

        // ⭐ Lưu trạng thái cũ để quyết định trừ / hoàn kho
        String trangThaiCu = hoaDon.getTrangThai();

        // -----------------------------------------------------
        // ⭐ TRỪ KHO khi Admin xác nhận đơn (CHO_XAC_NHAN → DA_XAC_NHAN)
        //    Chỉ trừ duy nhất 1 lần khi chuyển sang DA_XAC_NHAN
//        // -----------------------------------------------------
//        if ("DA_XAC_NHAN".equalsIgnoreCase(trangThai)
//                && !"DA_XAC_NHAN".equalsIgnoreCase(trangThaiCu)) {
//            truKhoTheoHoaDon(hoaDon);
//        }

        // -----------------------------------------------------
        // ⭐ HOÀN KHO khi hủy đơn, CHỈ khi trước đó đã trừ
        //    (tức là đã ở DA_XAC_NHAN hoặc xa hơn)
        // -----------------------------------------------------
        if ("DA_HUY".equalsIgnoreCase(trangThai)
                && daTruKhoRoi(trangThaiCu)) {
            hoanKhoTheoHoaDon(hoaDon);
        }

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
    // ⭐ HELPER: TRỪ / HOÀN KHO THEO HÓA ĐƠN
    // =========================================================

    /**
     * Kiểm tra trạng thái cũ đã từng trừ kho chưa.
     * Chỉ những trạng thái từ DA_XAC_NHAN trở đi mới coi là đã trừ.
     */
    private boolean daTruKhoRoi(String trangThaiCu) {
        if (trangThaiCu == null) return false;
        String s = trangThaiCu.trim().toUpperCase();
        // Đơn CHO_XAC_NHAN cũng đã bị trừ kho lúc đặt hàng
        return "CHO_XAC_NHAN".equals(s)
                || "DA_XAC_NHAN".equals(s)
                || "DANG_CHUAN_BI".equals(s)
                || "DANG_GIAO".equals(s)
                || "DA_GIAO".equals(s)
                || "DA_THANH_TOAN".equals(s);
    }

    /**
     * Trừ tồn kho cho từng sản phẩm trong hóa đơn.
     * Ném lỗi nếu bất kỳ sản phẩm nào không đủ tồn.
     * @Transactional: nếu 1 dòng lỗi → rollback toàn bộ.
     */
    private void truKhoTheoHoaDon(HoaDon hoaDon) {

        List<ChiTietHoaDon> chiTiets =
                chiTietHoaDonRepository.findByHoaDon_Id(hoaDon.getId());

        if (chiTiets == null || chiTiets.isEmpty()) {
            throw new RuntimeException(
                    "Hóa đơn không có chi tiết sản phẩm để trừ kho"
            );
        }

        for (ChiTietHoaDon ct : chiTiets) {

            SanPhamChiTiet spct = ct.getSanPhamChiTiet();

            if (spct == null) {
                throw new RuntimeException(
                        "Chi tiết hóa đơn thiếu thông tin sản phẩm"
                );
            }

            // Query lại để lấy số tồn kho MỚI NHẤT
            Long spctId = spct.getId();
            SanPhamChiTiet fresh = sanPhamChiTietRepository
                    .findById(spctId)
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy sản phẩm chi tiết #" + spctId
                    ));

            int tonCu = fresh.getSoLuongTon() != null
                    ? fresh.getSoLuongTon() : 0;
            int soLuong = ct.getSoLuong() != null
                    ? ct.getSoLuong() : 0;

            if (tonCu < soLuong) {
                String sku = fresh.getMaSku() != null
                        ? fresh.getMaSku()
                        : ("#" + spctId);
                throw new RuntimeException(
                        "Sản phẩm " + sku + " không đủ tồn kho. " +
                                "Còn " + tonCu + ", cần " + soLuong
                );
            }

            fresh.setSoLuongTon(tonCu - soLuong);
            sanPhamChiTietRepository.save(fresh);
        }
    }

    /**
     * Hoàn tồn kho cho từng sản phẩm (khi hủy đơn).
     * Không ném lỗi — chỉ cộng lại số lượng.
     */
    private void hoanKhoTheoHoaDon(HoaDon hoaDon) {

        List<ChiTietHoaDon> chiTiets =
                chiTietHoaDonRepository.findByHoaDon_Id(hoaDon.getId());

        if (chiTiets == null || chiTiets.isEmpty()) {
            return;
        }

        for (ChiTietHoaDon ct : chiTiets) {

            SanPhamChiTiet spct = ct.getSanPhamChiTiet();
            if (spct == null) continue;

            Long spctId = spct.getId();
            SanPhamChiTiet fresh = sanPhamChiTietRepository
                    .findById(spctId)
                    .orElse(null);

            if (fresh == null) continue;

            int tonCu = fresh.getSoLuongTon() != null
                    ? fresh.getSoLuongTon() : 0;
            int soLuong = ct.getSoLuong() != null
                    ? ct.getSoLuong() : 0;

            fresh.setSoLuongTon(tonCu + soLuong);
            sanPhamChiTietRepository.save(fresh);
        }
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