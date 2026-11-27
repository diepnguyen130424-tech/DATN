package com.example.bangiay.service;

import com.example.bangiay.repository.HoaDonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Tính hạng khách hàng theo tổng chi tiêu và kiểm tra quyền dùng voucher theo hạng.
 * Chi tiêu được tính trực tiếp từ hóa đơn nên luôn đúng khi có đơn mới / đơn bị hủy.
 */
@Service
@RequiredArgsConstructor
public class HangKhachHangService {

    /** Chỉ đơn đã giao hoặc đã thanh toán mới được tính vào chi tiêu. */
    private static final List<String> TRANG_THAI_TINH_CHI_TIEU =
            List.of("DA_GIAO", "DA_THANH_TOAN");

    private final HoaDonRepository hoaDonRepository;

    public BigDecimal tinhChiTieu(Long khachHangId) {
        if (khachHangId == null) return BigDecimal.ZERO;
        BigDecimal tong = hoaDonRepository.tongChiTieuKhachHang(
                khachHangId, TRANG_THAI_TINH_CHI_TIEU);
        return tong != null ? tong : BigDecimal.ZERO;
    }

    public HangKhachHang layHang(Long khachHangId) {
        return HangKhachHang.tuChiTieu(tinhChiTieu(khachHangId));
    }

    /** Danh sách các hạng + mốc chi tiêu (cho form admin và giao diện khách). */
    public List<Map<String, Object>> danhSachHang() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (HangKhachHang h : HangKhachHang.values()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("ma", h.name());
            m.put("ten", h.getTen());
            m.put("nguong", h.getNguong());
            list.add(m);
        }
        return list;
    }

    /** Thông tin hạng + tiến độ lên hạng của 1 khách hàng. */
    public Map<String, Object> thongTinHang(Long khachHangId) {
        BigDecimal chiTieu = tinhChiTieu(khachHangId);
        HangKhachHang hang = HangKhachHang.tuChiTieu(chiTieu);
        HangKhachHang tiep = hang.hangTiepTheo();

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("khachHangId", khachHangId);
        m.put("chiTieu", chiTieu);
        m.put("hang", hang.name());
        m.put("tenHang", hang.getTen());
        m.put("hangTiepTheo", tiep != null ? tiep.name() : null);
        m.put("tenHangTiepTheo", tiep != null ? tiep.getTen() : null);
        m.put("canThem", tiep != null
                ? tiep.getNguong().subtract(chiTieu).max(BigDecimal.ZERO)
                : BigDecimal.ZERO);
        m.put("cacHang", danhSachHang());
        return m;
    }

    /**
     * Kiểm tra khách có đủ hạng để dùng voucher không.
     * @return null nếu dùng được; ngược lại là câu thông báo lỗi.
     */
    public String kiemTraDuHang(String hangToiThieu, Long khachHangId) {
        HangKhachHang yeuCau = HangKhachHang.tuMa(hangToiThieu);
        if (yeuCau == null || yeuCau == HangKhachHang.THANH_VIEN) return null;

        if (khachHangId == null) {
            return "Mã này dành cho khách hạng " + yeuCau.getTen()
                    + " trở lên. Vui lòng đăng nhập để sử dụng.";
        }

        BigDecimal chiTieu = tinhChiTieu(khachHangId);
        HangKhachHang hienTai = HangKhachHang.tuChiTieu(chiTieu);
        if (hienTai.datTu(yeuCau)) return null;

        BigDecimal thieu = yeuCau.getNguong().subtract(chiTieu);
        return "Mã này dành cho khách hạng " + yeuCau.getTen()
                + " trở lên. Bạn đang ở hạng " + hienTai.getTen()
                + ", cần chi tiêu thêm " + formatTien(thieu)
                + " để đủ điều kiện.";
    }

    private String formatTien(BigDecimal tien) {
        return String.format("%,.0fđ", tien.doubleValue()).replace(",", ".");
    }
}