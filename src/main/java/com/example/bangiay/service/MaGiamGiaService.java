package com.example.bangiay.service;

import com.example.bangiay.entity.MaGiamGia;
import com.example.bangiay.repository.MaGiamGiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class MaGiamGiaService {

    private final MaGiamGiaRepository maGiamGiaRepository;
    private final ThongBaoService thongBaoService;
    private final VoucherEventService voucherEventService;
    private final HangKhachHangService hangKhachHangService;


    // =========================================================
    // LẤY TẤT CẢ VOUCHER
    // =========================================================
    public List<MaGiamGia> getAll() {
        return maGiamGiaRepository.findAll();
    }


    // =========================================================
    // LẤY VOUCHER THEO ID
    // =========================================================
    public MaGiamGia getById(Long id) {
        return maGiamGiaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy mã giảm giá"));
    }


    // =========================================================
    // LẤY VOUCHER THEO MÃ
    // =========================================================
    public MaGiamGia getByMaVoucher(String maVoucher) {

        if (maVoucher == null || maVoucher.trim().isEmpty()) {
            throw new RuntimeException("Mã voucher không được để trống");
        }

        String maChuan = maVoucher.trim().toUpperCase();

        return maGiamGiaRepository.findByMaVoucher(maChuan)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy mã voucher"));
    }


    // =========================================================
    // THÊM / SỬA VOUCHER
    // =========================================================
    @Transactional
    public MaGiamGia save(MaGiamGia maGiamGia) {

        if (maGiamGia == null) {
            throw new RuntimeException("Dữ liệu voucher không được để trống");
        }

        // MÃ VOUCHER
        if (maGiamGia.getMaVoucher() == null
                || maGiamGia.getMaVoucher().trim().isEmpty()) {
            throw new RuntimeException("Mã voucher không được để trống");
        }

        String maVoucher = maGiamGia.getMaVoucher().trim().toUpperCase();
        maGiamGia.setMaVoucher(maVoucher);

        // TÊN VOUCHER
        if (maGiamGia.getTenVoucher() == null
                || maGiamGia.getTenVoucher().trim().isEmpty()) {
            throw new RuntimeException("Tên voucher không được để trống");
        }

        maGiamGia.setTenVoucher(maGiamGia.getTenVoucher().trim());

        // KIỂM TRA MÃ TRÙNG
        maGiamGiaRepository.findByMaVoucher(maVoucher)
                .ifPresent(voucherTonTai -> {

                    boolean dangThemMoi = maGiamGia.getId() == null;

                    boolean laVoucherKhac = maGiamGia.getId() != null
                            && !Objects.equals(
                            voucherTonTai.getId(),
                            maGiamGia.getId());

                    if (dangThemMoi || laVoucherKhac) {
                        throw new RuntimeException(
                                "Mã voucher " + maVoucher + " đã tồn tại");
                    }
                });

        // LOẠI GIẢM
        if (maGiamGia.getLoaiGiam() == null
                || maGiamGia.getLoaiGiam().trim().isEmpty()) {
            throw new RuntimeException("Loại giảm không được để trống");
        }

        maGiamGia.setLoaiGiam(maGiamGia.getLoaiGiam().trim().toUpperCase());

        // GIÁ TRỊ GIẢM
        if (maGiamGia.getGiaTriGiam() == null) {
            throw new RuntimeException("Giá trị giảm không được để trống");
        }

        if (maGiamGia.getGiaTriGiam().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Giá trị giảm không được nhỏ hơn 0");
        }

        // PHẦN TRĂM
        if ("PHAN_TRAM".equalsIgnoreCase(maGiamGia.getLoaiGiam())) {
            if (maGiamGia.getGiaTriGiam()
                    .compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new RuntimeException(
                        "Giá trị giảm phần trăm không được vượt quá 100%");
            }
        }

        // GIẢM TỐI ĐA
        if (maGiamGia.getGiamToiDa() != null
                && maGiamGia.getGiamToiDa()
                .compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Giảm tối đa không được nhỏ hơn 0");
        }

        // ĐƠN TỐI THIỂU
        if (maGiamGia.getDonToiThieu() != null
                && maGiamGia.getDonToiThieu()
                .compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Đơn tối thiểu không được nhỏ hơn 0");
        }

        // SỐ LƯỢNG
        if (maGiamGia.getSoLuong() == null || maGiamGia.getSoLuong() <= 0) {
            throw new RuntimeException("Số lượng voucher phải lớn hơn 0");
        }

        // SỐ LƯỢNG ĐÃ DÙNG
        if (maGiamGia.getSoLuongDaDung() == null) {
            maGiamGia.setSoLuongDaDung(0);
        }

        if (maGiamGia.getSoLuongDaDung() < 0) {
            maGiamGia.setSoLuongDaDung(0);
        }

        if (maGiamGia.getSoLuongDaDung() > maGiamGia.getSoLuong()) {
            throw new RuntimeException(
                    "Số lượng đã dùng không được lớn hơn số lượng voucher");
        }

        // NGÀY
        if (maGiamGia.getNgayBatDau() != null
                && maGiamGia.getNgayKetThuc() != null
                && maGiamGia.getNgayKetThuc()
                .isBefore(maGiamGia.getNgayBatDau())) {
            throw new RuntimeException(
                    "Ngày kết thúc phải sau ngày bắt đầu");
        }

        // HẠNG KHÁCH HÀNG TỐI THIỂU (rỗng / Thành viên = mọi khách hàng)
        String hangNhap = maGiamGia.getHangToiThieu();
        HangKhachHang hangToiThieu = HangKhachHang.tuMa(hangNhap);

        if (hangNhap != null && !hangNhap.trim().isEmpty() && hangToiThieu == null) {
            throw new RuntimeException("Hạng khách hàng không hợp lệ");
        }

        maGiamGia.setHangToiThieu(
                hangToiThieu == null || hangToiThieu == HangKhachHang.THANH_VIEN
                        ? null
                        : hangToiThieu.name());

        // TRẠNG THÁI
        if (maGiamGia.getTrangThai() == null
                || maGiamGia.getTrangThai().trim().isEmpty()) {
            maGiamGia.setTrangThai("HOAT_DONG");
        } else {
            maGiamGia.setTrangThai(
                    maGiamGia.getTrangThai().trim().toUpperCase());
        }

        // LƯU TRẠNG THÁI CŨ (để phát hiện chuyển trạng thái)
        String trangThaiCu = null;
        if (maGiamGia.getId() != null) {
            trangThaiCu = maGiamGiaRepository.findById(maGiamGia.getId())
                    .map(MaGiamGia::getTrangThai)
                    .orElse(null);
        }

        // LƯU DATABASE
        MaGiamGia saved = maGiamGiaRepository.saveAndFlush(maGiamGia);

        // PHÁT THÔNG BÁO NẾU TRẠNG THÁI ĐỔI
        String trangThaiMoi = saved.getTrangThai();

        if (trangThaiCu != null
                && !trangThaiCu.equalsIgnoreCase(trangThaiMoi)) {

            if ("NGUNG_HOAT_DONG".equalsIgnoreCase(trangThaiMoi)) {
                thongBaoService.thongBaoNgungSuDung(saved);
            } else if ("HOAT_DONG".equalsIgnoreCase(trangThaiMoi)
                    && "NGUNG_HOAT_DONG".equalsIgnoreCase(trangThaiCu)) {
                thongBaoService.thongBaoKichHoatLai(saved);
            }
        }

        // Báo ngay cho các trình duyệt khách đang mở (SSE)
        voucherEventService.phat(saved.getId(), saved.getTrangThai());

        return saved;
    }


    // =========================================================
    // BẬT / TẮT KÍCH HOẠT (nút Active trên FE)
    // Chỉ đổi trangThai, không validate các field khác
    // =========================================================
    @Transactional
    public MaGiamGia setKichHoat(Long id, boolean kichHoat) {

        if (id == null) {
            throw new RuntimeException("ID voucher không hợp lệ");
        }

        MaGiamGia voucher = maGiamGiaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy voucher"));

        String trangThaiMoi = kichHoat
                ? "HOAT_DONG"
                : "NGUNG_HOAT_DONG";

        String trangThaiCu = voucher.getTrangThai();

        // Không đổi gì → trả luôn
        if (trangThaiMoi.equalsIgnoreCase(trangThaiCu)) {
            return voucher;
        }

        voucher.setTrangThai(trangThaiMoi);
        MaGiamGia saved = maGiamGiaRepository.saveAndFlush(voucher);

        // Phát thông báo cho khách
        if ("NGUNG_HOAT_DONG".equalsIgnoreCase(trangThaiMoi)) {
            thongBaoService.thongBaoNgungSuDung(saved);
        } else if ("HOAT_DONG".equalsIgnoreCase(trangThaiMoi)) {
            thongBaoService.thongBaoKichHoatLai(saved);
        }

        // Báo ngay cho các trình duyệt khách đang mở (SSE)
        voucherEventService.phat(saved.getId(), saved.getTrangThai());

        return saved;
    }


    // =========================================================
    // XÓA
    // =========================================================
    @Transactional
    public void delete(Long id) {

        if (id == null) {
            throw new RuntimeException("ID voucher không hợp lệ");
        }

        if (!maGiamGiaRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy voucher cần xóa");
        }

        maGiamGiaRepository.deleteById(id);
        voucherEventService.phat(id, "DA_XOA");
    }


    // =========================================================
    // KIỂM TRA MÃ ĐÃ TỒN TẠI
    // =========================================================
    public boolean existsByMaVoucher(String maVoucher) {

        if (maVoucher == null || maVoucher.trim().isEmpty()) {
            return false;
        }

        return maGiamGiaRepository.existsByMaVoucher(
                maVoucher.trim().toUpperCase());
    }


    // =========================================================
    // DANH SÁCH VOUCHER ĐANG HOẠT ĐỘNG (cho khách)
    // =========================================================
    public List<MaGiamGia> getDangHoatDong() {

        LocalDateTime now = LocalDateTime.now();

        return maGiamGiaRepository.findAll()
                .stream()
                .filter(v -> "HOAT_DONG".equalsIgnoreCase(v.getTrangThai()))
                .filter(v -> v.getNgayBatDau() == null
                        || !now.isBefore(v.getNgayBatDau()))
                .filter(v -> v.getNgayKetThuc() == null
                        || !now.isAfter(v.getNgayKetThuc()))
                .filter(v -> {
                    if (v.getSoLuong() == null) return true;
                    int daDung = v.getSoLuongDaDung() != null
                            ? v.getSoLuongDaDung() : 0;
                    return daDung < v.getSoLuong();
                })
                .toList();
    }


    // =========================================================
    // DANH SÁCH VOUCHER SẮP HẾT HẠN
    // =========================================================
    public List<MaGiamGia> getSapHetHan(int soNgay) {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nguong = now.plusDays(soNgay);

        return maGiamGiaRepository.findAll()
                .stream()
                .filter(v -> "HOAT_DONG".equalsIgnoreCase(v.getTrangThai()))
                .filter(v -> v.getNgayKetThuc() != null)
                .filter(v -> v.getNgayKetThuc().isAfter(now))
                .filter(v -> !v.getNgayKetThuc().isAfter(nguong))
                .toList();
    }


    // =========================================================
    // KIỂM TRA VOUCHER (khi khách áp mã)
    // =========================================================
    public Map<String, Object> kiemTraVoucher(
            String ma,
            BigDecimal tongTien,
            Long khachHangId
    ) {

        if (ma == null || ma.trim().isEmpty()) {
            throw new RuntimeException("Vui lòng nhập mã giảm giá");
        }

        if (tongTien == null || tongTien.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Tổng tiền không hợp lệ");
        }

        String maChuan = ma.trim().toUpperCase();

        MaGiamGia voucher = maGiamGiaRepository.findByMaVoucher(maChuan)
                .orElseThrow(() -> new RuntimeException(
                        "Mã giảm giá không tồn tại"));

        // ADMIN ĐÃ TẮT → KHÁCH KHÔNG DÙNG ĐƯỢC
        if (!"HOAT_DONG".equalsIgnoreCase(voucher.getTrangThai())) {
            throw new RuntimeException(
                    "Mã giảm giá đã bị ngưng sử dụng. Vui lòng chọn mã khác.");
        }

        LocalDateTime now = LocalDateTime.now();

        if (voucher.getNgayBatDau() != null
                && now.isBefore(voucher.getNgayBatDau())) {
            throw new RuntimeException(
                    "Mã giảm giá chưa đến thời gian sử dụng");
        }

        if (voucher.getNgayKetThuc() != null
                && now.isAfter(voucher.getNgayKetThuc())) {
            throw new RuntimeException("Mã giảm giá đã hết hạn");
        }

        if (voucher.getSoLuong() != null) {
            int daDung = voucher.getSoLuongDaDung() != null
                    ? voucher.getSoLuongDaDung() : 0;

            if (daDung >= voucher.getSoLuong()) {
                throw new RuntimeException(
                        "Mã giảm giá đã hết lượt sử dụng");
            }
        }

        // GIỚI HẠN THEO HẠNG KHÁCH HÀNG
        String loiHang = hangKhachHangService.kiemTraDuHang(
                voucher.getHangToiThieu(), khachHangId);

        if (loiHang != null) {
            throw new RuntimeException(loiHang);
        }

        if (voucher.getDonToiThieu() != null
                && tongTien.compareTo(voucher.getDonToiThieu()) < 0) {
            throw new RuntimeException(
                    "Đơn hàng tối thiểu "
                            + formatTien(voucher.getDonToiThieu())
                            + " để dùng mã này");
        }

        boolean laFreeship = "FREESHIP".equalsIgnoreCase(
                voucher.getLoaiGiam());

        BigDecimal tienGiam;

        if (laFreeship) {
            tienGiam = BigDecimal.ZERO;
        } else if ("PHAN_TRAM".equalsIgnoreCase(voucher.getLoaiGiam())) {

            tienGiam = tongTien
                    .multiply(voucher.getGiaTriGiam())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

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
        result.put("freeship", laFreeship);
        result.put("hangToiThieu", voucher.getHangToiThieu());

        // Cảnh báo mềm nếu sắp hết hạn (vẫn dùng được)
        if (voucher.getNgayKetThuc() != null) {
            long conLaiGiay = Duration.between(
                    now, voucher.getNgayKetThuc()).getSeconds();

            if (conLaiGiay > 0 && conLaiGiay <= 3L * 24 * 60 * 60) {
                result.put("sapHetHan", true);
                result.put("conLaiNgay",
                        (int) Math.ceil(conLaiGiay / 86400.0));
            }
        }

        result.put("message",
                laFreeship
                        ? "Áp dụng mã thành công! Đơn hàng được miễn phí vận chuyển."
                        : "Áp dụng mã giảm giá thành công");

        return result;
    }


    // =========================================================
    // FORMAT TIỀN
    // =========================================================
    private String formatTien(BigDecimal tien) {
        return String.format("%,.0fđ", tien.doubleValue())
                .replace(",", ".");
    }


    // =========================================================
    // TĂNG SỐ LƯỢNG ĐÃ DÙNG
    // =========================================================
    @Transactional
    public void tangSoLuongDaDung(String ma) {

        if (ma == null || ma.trim().isEmpty()) {
            throw new RuntimeException("Mã voucher không được để trống");
        }

        String maChuan = ma.trim().toUpperCase();

        MaGiamGia voucher = maGiamGiaRepository.findByMaVoucher(maChuan)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy mã voucher"));

        int daDung = voucher.getSoLuongDaDung() != null
                ? voucher.getSoLuongDaDung() : 0;

        if (voucher.getSoLuong() != null
                && daDung >= voucher.getSoLuong()) {
            throw new RuntimeException("Mã giảm giá đã hết lượt sử dụng");
        }

        voucher.setSoLuongDaDung(daDung + 1);
        maGiamGiaRepository.saveAndFlush(voucher);
        voucherEventService.phat(voucher.getId(), voucher.getTrangThai());
    }
}