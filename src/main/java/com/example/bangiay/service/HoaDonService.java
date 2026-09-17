package com.example.bangiay.service;
import com.example.bangiay.entity.MaGiamGia;
import com.example.bangiay.entity.ChiTietHoaDon;
import com.example.bangiay.entity.HoaDon;
import com.example.bangiay.entity.LichSuHoaDon;
import com.example.bangiay.entity.ThanhToan;
import com.example.bangiay.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.example.bangiay.repository.MaGiamGiaRepository;

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


    public ThanhToan saveThanhToan(ThanhToan thanhToan) {
        if (thanhToan.getHoaDon() == null
                || thanhToan.getHoaDon().getId() == null) {

            throw new RuntimeException(
                    "Thanh toán phải có hóa đơn"
            );
        }
        HoaDon hoaDon = hoaDonRepository
                .findById(thanhToan.getHoaDon().getId())
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

        thanhToan.setHoaDon(hoaDon);
        thanhToan.setSoTien(hoaDon.getTongThanhToan());
        if ("DA_THANH_TOAN".equalsIgnoreCase(thanhToan.getTrangThai())) {
            thanhToan.setNgayThanhToan(LocalDateTime.now());
        }
        return thanhToanRepository.save(thanhToan);
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
                .findByKhachHang_Id(khachHangId);
    }


    public List<HoaDon> getByNhanVienId(
            Long nhanVienId) {

        return hoaDonRepository
                .findByNhanVien_Id(nhanVienId);
    }

    public List<HoaDon> getByTrangThai(
            String trangThai) {

        return hoaDonRepository
                .findByTrangThai(trangThai);
    }



    public List<HoaDon> getByLoaiHoaDon(
            String loaiHoaDon) {

        return hoaDonRepository
                .findByLoaiHoaDon(loaiHoaDon);
    }


    public HoaDon capNhatTrangThai(
            Long hoaDonId,
            String trangThai,
            String ghiChu) {


        HoaDon hoaDon =
                hoaDonRepository
                        .findById(hoaDonId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy hóa đơn"
                                )
                        );


        hoaDon.setTrangThai(trangThai);

        hoaDon.setNgayCapNhat(
                LocalDateTime.now()
        );

        HoaDon hoaDonDaCapNhat =
                hoaDonRepository.save(hoaDon);



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
