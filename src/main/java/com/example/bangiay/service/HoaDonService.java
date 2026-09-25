package com.example.bangiay.service;
import com.example.bangiay.entity.ChiTietGioHang;
import com.example.bangiay.entity.ChiTietHoaDon;
import com.example.bangiay.entity.GioHang;
import com.example.bangiay.entity.HoaDon;
import com.example.bangiay.entity.LichSuHoaDon;
import com.example.bangiay.entity.MaGiamGia;
import com.example.bangiay.entity.SanPhamChiTiet;
import com.example.bangiay.entity.ThanhToan;
import com.example.bangiay.repository.ChiTietGioHangRepository;
import com.example.bangiay.repository.ChiTietHoaDonRepository;
import com.example.bangiay.repository.GioHangRepository;
import com.example.bangiay.repository.HoaDonRepository;
import com.example.bangiay.repository.LichSuHoaDonRepository;
import com.example.bangiay.repository.MaGiamGiaRepository;
import com.example.bangiay.repository.SanPhamChiTietRepository;
import com.example.bangiay.repository.ThanhToanRepository;

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
        hoaDon.setNgayCapNhat(LocalDateTime.now());

        if (hoaDon.getTrangThai() == null) {
            hoaDon.setTrangThai("CHO_XAC_NHAN");
        }

        BigDecimal tongTienHang =
                hoaDon.getTongTienHang() != null
                        ? hoaDon.getTongTienHang()
                        : BigDecimal.ZERO;
        BigDecimal phiVanChuyen =
                hoaDon.getPhiVanChuyen() != null
                        ? hoaDon.getPhiVanChuyen()
                        : BigDecimal.ZERO;
        BigDecimal tienGiam = BigDecimal.ZERO;
        if (hoaDon.getVoucher() != null
                && hoaDon.getVoucher().getId() != null) {

            MaGiamGia voucher =
                    maGiamGiaRepository
                            .findById(
                                    hoaDon.getVoucher().getId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Không tìm thấy voucher"
                                    )
                            );
            hoaDon.setVoucher(voucher);
            boolean datDonToiThieu =
                    voucher.getDonToiThieu() == null
                            || tongTienHang.compareTo(
                            voucher.getDonToiThieu()
                    ) >= 0;

            if (datDonToiThieu) {

                if ("PHAN_TRAM".equalsIgnoreCase(
                        voucher.getLoaiGiam())) {

                    tienGiam =
                            tongTienHang
                                    .multiply(
                                            voucher.getGiaTriGiam()
                                    )
                                    .divide(
                                            BigDecimal.valueOf(100)
                                    );
                }

                else if ("SO_TIEN".equalsIgnoreCase(
                        voucher.getLoaiGiam())) {

                    tienGiam =
                            voucher.getGiaTriGiam();
                }

                if (tienGiam.compareTo(tongTienHang) > 0) {

                    tienGiam = tongTienHang;
                }
                if (voucher.getGiamToiDa() != null
                        && tienGiam.compareTo(
                        voucher.getGiamToiDa()) > 0) {

                    tienGiam =
                            voucher.getGiamToiDa();
                }
            }
        }

        hoaDon.setTienGiam(tienGiam);


        BigDecimal tongThanhToan =
                tongTienHang
                        .subtract(tienGiam)
                        .add(phiVanChuyen);
        hoaDon.setTongThanhToan(tongThanhToan);
        return hoaDonRepository.save(hoaDon);
    }

    @Transactional
    public HoaDon datHang(Long gioHangId, Long voucherId) {
        GioHang gioHang =
                gioHangRepository.findById(gioHangId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy giỏ hàng"
                                )
                        );
        List<ChiTietGioHang> danhSachGioHang =
                chiTietGioHangRepository
                        .findByGioHang_Id(gioHangId);


        // Kiểm tra giỏ hàng rỗng
        if (danhSachGioHang.isEmpty()) {

            throw new RuntimeException(
                    "Giỏ hàng đang trống"
            );
        }
        BigDecimal tongTienHang =
                BigDecimal.ZERO;


        for (ChiTietGioHang chiTietGioHang :
                danhSachGioHang) {

            if (chiTietGioHang.getSoLuong() == null
                    || chiTietGioHang.getSoLuong() <= 0) {

                throw new RuntimeException(
                        "Số lượng sản phẩm trong giỏ không hợp lệ"
                );
            }
            if (chiTietGioHang.getSanPhamChiTiet() == null
                    || chiTietGioHang
                    .getSanPhamChiTiet()
                    .getId() == null) {

                throw new RuntimeException(
                        "Sản phẩm chi tiết trong giỏ không hợp lệ"
                );
            }
            Long sanPhamChiTietId =
                    chiTietGioHang
                            .getSanPhamChiTiet()
                            .getId();
            SanPhamChiTiet spct =
                    sanPhamChiTietRepository
                            .findById(sanPhamChiTietId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Không tìm thấy sản phẩm chi tiết"
                                    )
                            );

            if (!"ACTIVE".equalsIgnoreCase(
                    spct.getTrangThai())
                    &&
                    !"HOAT_DONG".equalsIgnoreCase(
                            spct.getTrangThai())) {

                throw new RuntimeException(
                        "Sản phẩm "
                                + spct.getMaSku()
                                + " không còn hoạt động"
                );
            }
            if (spct.getSoLuongTon() == null
                    || spct.getSoLuongTon()
                    < chiTietGioHang.getSoLuong()) {

                throw new RuntimeException(
                        "Sản phẩm "
                                + spct.getMaSku()
                                + " không đủ số lượng tồn kho"
                );
            }
            BigDecimal donGia =
                    spct.getGiaBan();

            BigDecimal thanhTien =
                    donGia.multiply(
                            BigDecimal.valueOf(
                                    chiTietGioHang
                                            .getSoLuong()
                            )
                    );
            tongTienHang =
                    tongTienHang.add(
                            thanhTien
                    );
        }

        HoaDon hoaDon =
                new HoaDon();


        // Mã hóa đơn
        hoaDon.setMaHoaDon(
                "HD" + System.currentTimeMillis()
        );


        // Khách hàng
        hoaDon.setKhachHang(
                gioHang.getKhachHang()
        );


        // Đơn online
        hoaDon.setLoaiHoaDon(
                "ONLINE"
        );


        // Ngày lập
        hoaDon.setNgayLap(
                LocalDateTime.now()
        );


        // Trạng thái
        hoaDon.setTrangThai(
                "CHO_XAC_NHAN"
        );


        // Phí vận chuyển mặc định
        hoaDon.setPhiVanChuyen(
                BigDecimal.ZERO
        );


        // Tổng tiền hàng
        hoaDon.setTongTienHang(
                tongTienHang
        );


        if (voucherId != null) {

            MaGiamGia voucher =
                    maGiamGiaRepository
                            .findById(voucherId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Không tìm thấy voucher"
                                    )
                            );

            hoaDon.setVoucher(voucher);
        }


        hoaDon.setTienGiam(
                BigDecimal.ZERO
        );


        hoaDon.setTongThanhToan(
                tongTienHang
        );


        hoaDon.setNgayCapNhat(
                LocalDateTime.now()
        );


        HoaDon hoaDonDaLuu =
                save(hoaDon);


        for (ChiTietGioHang chiTietGioHang :
                danhSachGioHang) {

            Long sanPhamChiTietId =
                    chiTietGioHang
                            .getSanPhamChiTiet()
                            .getId();

            SanPhamChiTiet spct =
                    sanPhamChiTietRepository
                            .findById(
                                    sanPhamChiTietId
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Không tìm thấy sản phẩm chi tiết"
                                    )
                            );


            Integer soLuong =
                    chiTietGioHang
                            .getSoLuong();


            BigDecimal donGia =
                    spct.getGiaBan();


            BigDecimal thanhTien =
                    donGia.multiply(
                            BigDecimal.valueOf(
                                    soLuong
                            )
                    );


            // Tạo chi tiết hóa đơn
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


            // Lưu chi tiết hóa đơn.
            // Việc trừ tồn kho được KhoService thực hiện trong cùng transaction
            // để tạo luôn lịch sử xuất kho.
            chiTietHoaDonRepository.save(
                    chiTietHoaDon
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

        chiTietGioHangRepository
                .deleteAll(
                        danhSachGioHang
                );


        return hoaDonDaLuu;
    }

    public void delete(Long id) {
        hoaDonRepository.deleteById(id);
    }

    public List<ChiTietHoaDon> getChiTietByHoaDonId(
            Long hoaDonId) {

        return chiTietHoaDonRepository
                .findByHoaDon_Id(hoaDonId);
    }


    public ChiTietHoaDon saveChiTiet(
            ChiTietHoaDon chiTietHoaDon) {

        return chiTietHoaDonRepository
                .save(chiTietHoaDon);
    }


    public void deleteChiTiet(Long id) {
        chiTietHoaDonRepository.deleteById(id);
    }


    public ThanhToan getThanhToanByHoaDonId(
            Long hoaDonId) {

        return thanhToanRepository
                .findByHoaDon_Id(hoaDonId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy thanh toán"
                        )
                );
    }


    public ThanhToan saveThanhToan(
            ThanhToan thanhToan) {

        if (thanhToan.getHoaDon() == null
                || thanhToan.getHoaDon().getId() == null) {

            throw new RuntimeException(
                    "Thanh toán phải có hóa đơn"
            );
        }


        HoaDon hoaDon =
                hoaDonRepository
                        .findById(
                                thanhToan
                                        .getHoaDon()
                                        .getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy hóa đơn"
                                )
                        );


        if (hoaDon.getTongThanhToan() == null) {

            throw new RuntimeException(
                    "Hóa đơn chưa có tổng thanh toán"
            );
        }


        thanhToan.setHoaDon(
                hoaDon
        );


        // Số tiền thanh toán lấy theo hóa đơn
        thanhToan.setSoTien(
                hoaDon.getTongThanhToan()
        );


        // Nếu đã thanh toán thì lưu thời gian
        if ("DA_THANH_TOAN"
                .equalsIgnoreCase(
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
            Long hoaDonId) {

        return lichSuHoaDonRepository
                .findByHoaDon_IdOrderByThoiGianDesc(
                        hoaDonId
                );
    }


    public LichSuHoaDon saveLichSu(
            LichSuHoaDon lichSuHoaDon) {

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
            Long khachHangId) {

        return hoaDonRepository
                .findByKhachHang_Id(
                        khachHangId
                );
    }


    public List<HoaDon> getByNhanVienId(
            Long nhanVienId) {

        return hoaDonRepository
                .findByNhanVien_Id(
                        nhanVienId
                );
    }

    public List<HoaDon> getByTrangThai(
            String trangThai) {

        return hoaDonRepository
                .findByTrangThai(
                        trangThai
                );
    }

    public List<HoaDon> getByLoaiHoaDon(
            String loaiHoaDon) {

        return hoaDonRepository
                .findByLoaiHoaDon(
                        loaiHoaDon
                );
    }


    public HoaDon capNhatTrangThai(
            Long hoaDonId,
            String trangThai,
            String ghiChu) {

        HoaDon hoaDon =
                hoaDonRepository
                        .findById(
                                hoaDonId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy hóa đơn"
                                )
                        );


        // Cập nhật trạng thái
        hoaDon.setTrangThai(
                trangThai
        );


        // Cập nhật thời gian
        hoaDon.setNgayCapNhat(
                LocalDateTime.now()
        );


        // Lưu hóa đơn
        HoaDon hoaDonDaCapNhat =
                hoaDonRepository.save(
                        hoaDon
                );

        LichSuHoaDon lichSu =
                new LichSuHoaDon();


        lichSu.setHoaDon(
                hoaDonDaCapNhat
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


        return hoaDonDaCapNhat;
    }
}