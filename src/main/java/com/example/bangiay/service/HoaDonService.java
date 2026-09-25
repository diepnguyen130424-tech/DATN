package com.example.bangiay.service;

import com.example.bangiay.dto.DatHangRequest;
import com.example.bangiay.entity.*;
import com.example.bangiay.repository.*;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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


    public List<HoaDon> getAll() {
        return hoaDonRepository.findAll();
    }


    public HoaDon getById(Long id) {
        return hoaDonRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy hóa đơn"));
    }


    public HoaDon getByMaHoaDon(String maHoaDon) {
        return hoaDonRepository.findByMaHoaDon(maHoaDon)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy hóa đơn"));
    }


    public HoaDon save(HoaDon hoaDon) {

        if (hoaDon.getNgayLap() == null) {
            hoaDon.setNgayLap(LocalDateTime.now());
        }

        if (hoaDon.getNgayCapNhat() == null) {
            hoaDon.setNgayCapNhat(LocalDateTime.now());
        } else {
            hoaDon.setNgayCapNhat(LocalDateTime.now());
        }

        if (hoaDon.getTienGiam() == null) {
            hoaDon.setTienGiam(BigDecimal.ZERO);
        }

        if (hoaDon.getPhiVanChuyen() == null) {
            hoaDon.setPhiVanChuyen(BigDecimal.ZERO);
        }

        if (hoaDon.getTrangThai() == null) {
            hoaDon.setTrangThai("CHO_XAC_NHAN");
        }

        return hoaDonRepository.save(hoaDon);
    }


    public void delete(Long id) {
        hoaDonRepository.deleteById(id);
    }


    @Transactional
    public HoaDon datHang(
            Long gioHangId,
            Long voucherId,
            DatHangRequest request
    ) {


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


        GioHang gioHang = gioHangRepository.findById(gioHangId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy giỏ hàng"
                        )
                );


        if (gioHang.getKhachHang() == null) {
            throw new RuntimeException(
                    "Giỏ hàng chưa có khách hàng"
            );
        }


        List<ChiTietGioHang> danhSachGioHang =
                chiTietGioHangRepository
                        .findByGioHang_Id(gioHangId);


        if (danhSachGioHang == null
                || danhSachGioHang.isEmpty()) {

            throw new RuntimeException(
                    "Giỏ hàng đang trống"
            );
        }


        BigDecimal tongTienHang =
                BigDecimal.ZERO;


        for (ChiTietGioHang chiTiet : danhSachGioHang) {

            if (chiTiet.getSanPhamChiTiet() == null) {
                throw new RuntimeException(
                        "Chi tiết giỏ hàng không có sản phẩm"
                );
            }


            Long spctId =
                    chiTiet.getSanPhamChiTiet().getId();


            SanPhamChiTiet spct =
                    sanPhamChiTietRepository.findById(spctId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Không tìm thấy sản phẩm chi tiết"
                                    )
                            );


            Integer soLuong =
                    chiTiet.getSoLuong();


            if (soLuong == null || soLuong <= 0) {
                throw new RuntimeException(
                        "Số lượng sản phẩm không hợp lệ"
                );
            }

            if (spct.getTrangThai() == null
                    || (
                    !"HOAT_DONG".equalsIgnoreCase(
                            spct.getTrangThai()
                    )
                            &&
                            !"ACTIVE".equalsIgnoreCase(
                                    spct.getTrangThai()
                            )
            )) {

                throw new RuntimeException(
                        "Sản phẩm đang không hoạt động"
                );
            }

            if (spct.getSoLuongTon() == null
                    || spct.getSoLuongTon() < soLuong) {

                throw new RuntimeException(
                        "Sản phẩm không đủ số lượng tồn kho"
                );
            }


            BigDecimal donGia =
                    spct.getGiaBan();


            if (donGia == null) {
                throw new RuntimeException(
                        "Sản phẩm chưa có giá bán"
                );
            }


            BigDecimal thanhTien =
                    donGia.multiply(
                            BigDecimal.valueOf(soLuong)
                    );


            tongTienHang =
                    tongTienHang.add(thanhTien);
        }

        MaGiamGia voucher = null;

        BigDecimal tienGiam =
                BigDecimal.ZERO;


        if (voucherId != null) {

            voucher =
                    maGiamGiaRepository.findById(voucherId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Không tìm thấy voucher"
                                    )
                            );}

        BigDecimal phiVanChuyen =
                BigDecimal.ZERO;


        BigDecimal tongThanhToan =
                tongTienHang
                        .subtract(tienGiam)
                        .add(phiVanChuyen);

        DiaChi diaChi =
                DiaChi.builder()
                        .khachHang(
                                gioHang.getKhachHang()
                        )
                        .tenNguoiNhan(
                                request.getHoTen().trim()
                        )
                        .soDienThoai(
                                request.getSoDienThoai().trim()
                        )
                        .diaChi(
                                request.getDiaChi().trim()
                        )
                        .macDinh(false)
                        .build();


        DiaChi diaChiDaLuu =
                diaChiRepository.save(diaChi);

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
                hoaDonRepository.save(hoaDon);

        for (ChiTietGioHang chiTiet : danhSachGioHang) {

            Long spctId =
                    chiTiet.getSanPhamChiTiet().getId();


            SanPhamChiTiet spct =
                    sanPhamChiTietRepository.findById(spctId)
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
                            BigDecimal.valueOf(soLuong)
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

        if (request.getPhuongThuc() != null
                && !request.getPhuongThuc()
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

        List<ChiTietHoaDon> chiTietDaLuu =
                chiTietHoaDonRepository.findByHoaDon_Id(
                        hoaDonDaLuu.getId()
                );


        khoService.xuatKhoTuHoaDon(
                hoaDonDaLuu.getMaHoaDon(),
                chiTietDaLuu
        );
        chiTietGioHangRepository.deleteAll(
                danhSachGioHang
        );


        return hoaDonDaLuu;
    }
    public List<ChiTietHoaDon> getChiTietByHoaDonId(
            Long hoaDonId
    ) {

        return chiTietHoaDonRepository
                .findByHoaDon_Id(hoaDonId);
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

    public ThanhToan getThanhToanByHoaDonId(
            Long hoaDonId
    ) {

        return thanhToanRepository
                .findByHoaDon_Id(hoaDonId)
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

    public List<HoaDon> getByKhachHangId(
            Long khachHangId
    ) {

        return hoaDonRepository
                .findByKhachHang_Id(khachHangId);
    }


    public List<HoaDon> getByNhanVienId(
            Long nhanVienId
    ) {

        return hoaDonRepository
                .findByNhanVien_Id(nhanVienId);
    }


    public List<HoaDon> getByTrangThai(
            String trangThai
    ) {

        return hoaDonRepository
                .findByTrangThai(trangThai);
    }


    public List<HoaDon> getByLoaiHoaDon(
            String loaiHoaDon
    ) {

        return hoaDonRepository
                .findByLoaiHoaDon(loaiHoaDon);
    }

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
}