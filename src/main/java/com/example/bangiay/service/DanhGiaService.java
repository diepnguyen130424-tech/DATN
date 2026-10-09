package com.example.bangiay.service;

import com.example.bangiay.dto.DanhGiaRequest;
import com.example.bangiay.dto.DanhGiaResponse;
import com.example.bangiay.dto.DanhGiaThongKeResponse;
import com.example.bangiay.dto.DanhGiaTongQuanResponse;
import com.example.bangiay.entity.ChiTietHoaDon;
import com.example.bangiay.entity.DanhGia;
import com.example.bangiay.entity.HoaDon;
import com.example.bangiay.entity.SanPhamChiTiet;
import com.example.bangiay.repository.ChiTietHoaDonRepository;
import com.example.bangiay.repository.DanhGiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DanhGiaService {

    private static final int TOI_DA_ANH = 5;
    private static final int TOI_DA_KY_TU = 1000;

    private final DanhGiaRepository danhGiaRepository;
    private final ChiTietHoaDonRepository chiTietHoaDonRepository;

    // ---------------------------------------------------------
    // Tạo đánh giá - chỉ khi đã mua và đã nhận hàng
    // ---------------------------------------------------------
    @Transactional
    public DanhGiaResponse taoDanhGia(DanhGiaRequest req) {
        if (req.getChiTietHoaDonId() == null || req.getKhachHangId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin đánh giá");
        }
        if (req.getSoSao() == null || req.getSoSao() < 1 || req.getSoSao() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn từ 1 đến 5 sao");
        }

        String noiDung = req.getNoiDung() == null ? "" : req.getNoiDung().trim();
        if (noiDung.length() > TOI_DA_KY_TU) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Nội dung đánh giá tối đa " + TOI_DA_KY_TU + " ký tự");
        }

        List<String> anh = req.getHinhAnh() == null ? List.of() : req.getHinhAnh().stream()
                .filter(s -> s != null && !s.isBlank())
                .map(String::trim)
                .collect(Collectors.toList());
        if (anh.size() > TOI_DA_ANH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tối đa " + TOI_DA_ANH + " ảnh");
        }

        ChiTietHoaDon ct = chiTietHoaDonRepository.findById(req.getChiTietHoaDonId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm trong đơn hàng"));

        HoaDon hd = ct.getHoaDon();
        if (hd.getKhachHang() == null || !hd.getKhachHang().getId().equals(req.getKhachHangId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn chỉ có thể đánh giá sản phẩm trong đơn hàng của mình");
        }
        if (!"DA_GIAO".equalsIgnoreCase(hd.getTrangThai()) || hd.getNgayNhanHang() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể đánh giá sau khi bạn đã nhận được hàng");
        }
        if (danhGiaRepository.existsByChiTietHoaDon_Id(ct.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã đánh giá sản phẩm này rồi");
        }

        DanhGia dg = DanhGia.builder()
                .chiTietHoaDon(ct)
                .sanPham(ct.getSanPhamChiTiet().getSanPham())
                .khachHang(hd.getKhachHang())
                .soSao(req.getSoSao())
                .noiDung(noiDung.isEmpty() ? null : noiDung)
                .hinhAnh(anh.isEmpty() ? null : String.join(",", anh))
                .trangThai("HIEN")
                .ngayTao(LocalDateTime.now())
                .build();

        try {
            return toResponse(danhGiaRepository.saveAndFlush(dg));
        } catch (DataIntegrityViolationException e) {
            // Bấm gửi 2 lần cùng lúc: ràng buộc UNIQUE chặn bản thứ hai
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã đánh giá sản phẩm này rồi");
        }
    }

    // ---------------------------------------------------------
    // Thống kê sao của tất cả sản phẩm (hiện ở thẻ sản phẩm, chỉ 1 request)
    // ---------------------------------------------------------
    @Transactional(readOnly = true)
    public List<DanhGiaThongKeResponse> thongKeTatCa() {
        List<DanhGiaThongKeResponse> kq = new ArrayList<>();
        for (Object[] row : danhGiaRepository.thongKeTheoSanPham()) {
            double tb = Math.round(((Number) row[1]).doubleValue() * 10.0) / 10.0;
            kq.add(new DanhGiaThongKeResponse(
                    ((Number) row[0]).longValue(), tb, ((Number) row[2]).longValue()));
        }
        return kq;
    }

    // ---------------------------------------------------------
    // Đánh giá theo sản phẩm (hiển thị ở trang chi tiết)
    // ---------------------------------------------------------
    @Transactional(readOnly = true)
    public DanhGiaTongQuanResponse tongQuanTheoSanPham(Long sanPhamId) {
        List<DanhGia> list = danhGiaRepository
                .findBySanPham_IdAndTrangThaiOrderByNgayTaoDesc(sanPhamId, "HIEN");

        Map<Integer, Integer> phanBo = new LinkedHashMap<>();
        for (int i = 5; i >= 1; i--) phanBo.put(i, 0);
        double tong = 0;
        for (DanhGia d : list) {
            phanBo.merge(d.getSoSao(), 1, Integer::sum);
            tong += d.getSoSao();
        }
        double tb = list.isEmpty() ? 0 : Math.round(tong / list.size() * 10.0) / 10.0;

        return new DanhGiaTongQuanResponse(
                tb,
                list.size(),
                phanBo,
                list.stream().map(this::toResponse).collect(Collectors.toList())
        );
    }

    // ---------------------------------------------------------
    // Đánh giá của một đơn hàng (để biết dòng nào đã đánh giá)
    // ---------------------------------------------------------
    @Transactional(readOnly = true)
    public List<DanhGiaResponse> theoHoaDon(Long hoaDonId) {
        return danhGiaRepository.findByChiTietHoaDon_HoaDon_Id(hoaDonId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ---------------------------------------------------------
    // Shop phản hồi đánh giá
    // ---------------------------------------------------------
    @Transactional
    public DanhGiaResponse phanHoi(Long id, String noiDung) {
        DanhGia dg = danhGiaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đánh giá"));
        String text = noiDung == null ? "" : noiDung.trim();
        if (text.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung phản hồi không được để trống");
        }
        dg.setPhanHoi(text);
        dg.setNgayPhanHoi(LocalDateTime.now());
        return toResponse(danhGiaRepository.save(dg));
    }

    // ---------------------------------------------------------
    // Ẩn / hiện đánh giá (kiểm duyệt)
    // ---------------------------------------------------------
    @Transactional
    public DanhGiaResponse doiTrangThai(Long id, boolean hien) {
        DanhGia dg = danhGiaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đánh giá"));
        dg.setTrangThai(hien ? "HIEN" : "AN");
        return toResponse(danhGiaRepository.save(dg));
    }

    // ---------------------------------------------------------
    private DanhGiaResponse toResponse(DanhGia d) {
        List<String> anh = d.getHinhAnh() == null || d.getHinhAnh().isBlank()
                ? new ArrayList<>()
                : Arrays.stream(d.getHinhAnh().split(",")).map(String::trim)
                .filter(s -> !s.isEmpty()).collect(Collectors.toList());

        return new DanhGiaResponse(
                d.getId(),
                d.getSanPham().getId(),
                d.getChiTietHoaDon().getId(),
                anTen(d.getKhachHang() == null ? null : d.getKhachHang().getHoTen()),
                d.getSoSao(),
                d.getNoiDung(),
                anh,
                phanLoai(d.getChiTietHoaDon().getSanPhamChiTiet()),
                d.getPhanHoi(),
                d.getNgayPhanHoi(),
                d.getNgayTao()
        );
    }

    private String phanLoai(SanPhamChiTiet spct) {
        if (spct == null) return null;
        List<String> parts = new ArrayList<>();
        if (spct.getKichCo() != null && spct.getKichCo().getTenKichCo() != null) {
            parts.add("Size " + spct.getKichCo().getTenKichCo());
        }
        if (spct.getMauSac() != null && spct.getMauSac().getTenMau() != null) {
            parts.add("Màu " + spct.getMauSac().getTenMau());
        }
        return parts.isEmpty() ? null : String.join(" · ", parts);
    }

    /** "Nguyễn Văn An" -> "N***n" (che tên để bảo vệ riêng tư như Shopee) */
    private String anTen(String hoTen) {
        if (hoTen == null || hoTen.isBlank()) return "Khách hàng";
        String t = hoTen.trim();
        if (t.length() <= 2) return t.charAt(0) + "*";
        return t.charAt(0) + "*****" + t.charAt(t.length() - 1);
    }
}
