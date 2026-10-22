
package com.example.bangiay.service;

import com.example.bangiay.dto.DoiTraResponse;
import com.example.bangiay.dto.TaoDoiTraRequest;
import com.example.bangiay.entity.ChiTietHoaDon;
import com.example.bangiay.entity.DoiTraChiTiet;
import com.example.bangiay.entity.DoiTraYeuCau;
import com.example.bangiay.entity.HoaDon;
import com.example.bangiay.repository.DoiTraChiTietRepository;
import com.example.bangiay.repository.DoiTraYeuCauRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DoiTraService {

    private final DoiTraYeuCauRepository yeuCauRepository;
    private final DoiTraChiTietRepository chiTietRepository;
    private final HoaDonService hoaDonService;

    /*
     * Tạo JsonMapper trực tiếp để không yêu cầu Spring inject
     * bean ObjectMapper qua constructor.
     */
    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    @Transactional(readOnly = true)
    public List<DoiTraResponse> getAll() {
        return yeuCauRepository.findAllByOrderByNgayTaoDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public DoiTraResponse tao(TaoDoiTraRequest req) {
        if (req == null || req.getHoaDonId() == null) {
            throw bad("Thiếu mã hóa đơn.");
        }

        if (req.getSanPhamTra() == null || req.getSanPhamTra().isEmpty()) {
            throw bad("Vui lòng chọn sản phẩm cần trả.");
        }

        if (blank(req.getLyDo())
                || blank(req.getMoTa())
                || blank(req.getPhuongThucHoanTien())) {
            throw bad("Vui lòng nhập đầy đủ lý do, mô tả và phương thức hoàn tiền.");
        }

        HoaDon hoaDon = hoaDonService.getById(req.getHoaDonId());

        if (hoaDon == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy hóa đơn."
            );
        }

        if (!"DA_GIAO".equalsIgnoreCase(
                String.valueOf(hoaDon.getTrangThai()))) {
            throw bad("Chỉ được yêu cầu trả hàng khi hóa đơn đã giao.");
        }

        List<ChiTietHoaDon> chiTietHoaDon =
                hoaDonService.getChiTietByHoaDonId(hoaDon.getId());

        Set<Long> daChon = new HashSet<>();

        // Kiểm tra từng sản phẩm trước khi tạo yêu cầu.
        for (TaoDoiTraRequest.SanPhamTraRequest line : req.getSanPhamTra()) {
            if (line.getChiTietHoaDonId() == null
                    || line.getSoLuong() == null
                    || line.getSoLuong() < 1) {
                throw bad("Sản phẩm trả hoặc số lượng không hợp lệ.");
            }

            if (!daChon.add(line.getChiTietHoaDonId())) {
                throw bad("Sản phẩm bị chọn trùng.");
            }

            ChiTietHoaDon original = chiTietHoaDon.stream()
                    .filter(x -> Objects.equals(
                            x.getId(), line.getChiTietHoaDonId()))
                    .findFirst()
                    .orElseThrow(() ->
                            bad("Sản phẩm không thuộc hóa đơn đã chọn."));

            if (line.getSoLuong() > original.getSoLuong()) {
                throw bad("Số lượng trả vượt quá số lượng đã mua.");
            }

            if (line.getSanPhamChiTietId() != null
                    && original.getSanPhamChiTiet() != null
                    && !Objects.equals(
                    line.getSanPhamChiTietId(),
                    original.getSanPhamChiTiet().getId())) {
                throw bad("Thông tin sản phẩm không khớp hóa đơn.");
            }

            int alreadyRequested =
                    chiTietRepository.findByChiTietHoaDon_Id(original.getId())
                            .stream()
                            .filter(d -> d.getYeuCau() != null
                                    && !"TU_CHOI".equalsIgnoreCase(
                                    d.getYeuCau().getTrangThai()))
                            .mapToInt(DoiTraChiTiet::getSoLuong)
                            .sum();

            if (alreadyRequested + line.getSoLuong()
                    > original.getSoLuong()) {
                throw bad(
                        "Đơn hàng này đã có yêu cầu trả hàng cho sản phẩm bạn chọn. "
                                + "Vui lòng theo dõi trạng thái xử lý của yêu cầu hiện tại, "
                                + "bạn không cần gửi lại."
                );
            }
        }

        // Chuyển danh sách ảnh minh chứng thành JSON.
        String images = jsonMapper.writeValueAsString(
                req.getAnhMinhChung() == null
                        ? List.of()
                        : req.getAnhMinhChung()
        );

        LocalDateTime now = LocalDateTime.now();

        DoiTraYeuCau request = DoiTraYeuCau.builder()
                .maYeuCau("DT" + System.currentTimeMillis())
                .hoaDon(hoaDon)
                .loaiYeuCau(
                        "TAI_QUAY".equalsIgnoreCase(req.getLoaiYeuCau())
                                ? "TAI_QUAY"
                                : "ONLINE"
                )
                .lyDo(req.getLyDo().trim())
                .moTa(req.getMoTa().trim())
                .phuongThucHoanTien(req.getPhuongThucHoanTien().trim())
                .thongTinHoanTien(req.getThongTinHoanTien())
                .anhMinhChung(images)
                .trangThai("CHO_DUYET")
                .ngayTao(now)
                .ngayCapNhat(now)
                .build();

        for (TaoDoiTraRequest.SanPhamTraRequest line : req.getSanPhamTra()) {
            ChiTietHoaDon original = chiTietHoaDon.stream()
                    .filter(x -> Objects.equals(
                            x.getId(), line.getChiTietHoaDonId()))
                    .findFirst()
                    .orElseThrow(() ->
                            bad("Không tìm thấy sản phẩm trong hóa đơn."));

            DoiTraChiTiet detail = DoiTraChiTiet.builder()
                    .yeuCau(request)
                    .chiTietHoaDon(original)
                    .soLuong(line.getSoLuong())
                    .build();

            request.getSanPhamTra().add(detail);
        }

        return toResponse(yeuCauRepository.save(request));
    }

    @Transactional
    public DoiTraResponse capNhatTrangThai(Long id, String trangThai) {
        Set<String> allowed = Set.of(
                "CHO_DUYET",
                "DA_DUYET",
                "CHO_GUI_HANG",
                "DA_NHAN_HANG",
                "DANG_KIEM_TRA",
                "CHO_HOAN_TIEN",
                "HOAN_TAT",
                "TU_CHOI"
        );

        if (trangThai == null
                || !allowed.contains(trangThai.toUpperCase(Locale.ROOT))) {
            throw bad("Trạng thái đổi trả không hợp lệ.");
        }

        DoiTraYeuCau item = yeuCauRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy yêu cầu đổi trả."
                ));

        item.setTrangThai(trangThai.toUpperCase(Locale.ROOT));
        item.setNgayCapNhat(LocalDateTime.now());

        return toResponse(yeuCauRepository.save(item));
    }

    private DoiTraResponse toResponse(DoiTraYeuCau x) {
        HoaDon h = x.getHoaDon();

        String tenKhach = h.getKhachHang() != null
                ? h.getKhachHang().getHoTen()
                : h.getTenKhach();

        List<DoiTraResponse.SanPhamTraResponse> lines =
                x.getSanPhamTra().stream()
                        .map(d -> DoiTraResponse.SanPhamTraResponse.builder()
                                .chiTietHoaDonId(
                                        d.getChiTietHoaDon().getId())
                                .sanPhamChiTietId(
                                        d.getChiTietHoaDon()
                                                .getSanPhamChiTiet() == null
                                                ? null
                                                : d.getChiTietHoaDon()
                                                .getSanPhamChiTiet().getId())
                                .soLuong(d.getSoLuong())
                                .build())
                        .toList();

        return DoiTraResponse.builder()
                .id(x.getId())
                .maYeuCau(x.getMaYeuCau())
                .hoaDonId(h.getId())
                .maHoaDon(h.getMaHoaDon())
                .tenKhach(tenKhach)
                .loaiYeuCau(x.getLoaiYeuCau())
                .lyDo(x.getLyDo())
                .moTa(x.getMoTa())
                .phuongThucHoanTien(x.getPhuongThucHoanTien())
                .thongTinHoanTien(x.getThongTinHoanTien())
                .anhMinhChung(x.getAnhMinhChung())
                .trangThai(x.getTrangThai())
                .ngayTao(x.getNgayTao())
                .sanPhamTra(lines)
                .build();
    }

    private boolean blank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private ResponseStatusException bad(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}
