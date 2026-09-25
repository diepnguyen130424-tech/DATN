package com.example.bangiay.service;

import com.example.bangiay.dto.*;
import com.example.bangiay.entity.*;
import com.example.bangiay.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KhoService {

    private final KhoRepository khoRepository;
    private final NhaCungCapRepository nhaCungCapRepository;
    private final TonKhoRepository tonKhoRepository;
    private final PhieuKhoRepository phieuKhoRepository;
    private final ChiTietPhieuKhoRepository chiTietPhieuKhoRepository;
    private final BienDongKhoRepository bienDongKhoRepository;
    private final SanPhamChiTietRepository sanPhamChiTietRepository;
    private final NhanVienRepository nhanVienRepository;

    public List<Kho> getAllKho() {
        return khoRepository.findAll();
    }

    public List<NhaCungCap> getAllNhaCungCap() {
        return nhaCungCapRepository.findAll();
    }

    @Transactional
    public List<TonKhoResponse> getTonKho(String keyword, String trangThai) {
        List<TonKho> list = tonKhoRepository.findAll();
        String key = keyword == null ? "" : keyword.trim().toLowerCase();

        return list.stream()
                .filter(t -> key.isEmpty() || matches(t, key))
                .map(this::toTonKhoResponse)
                .filter(t -> trangThai == null || trangThai.isBlank()
                        || t.trangThai().equalsIgnoreCase(trangThai))
                .sorted(Comparator.comparing(TonKhoResponse::tenSanPham,
                        String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional
    public KhoOverviewResponse getOverview() {
        List<TonKhoResponse> ton = getTonKho("", "");
        int tongTon = ton.stream().mapToInt(t -> safe(t.soLuongTon())).sum();
        int sapHet = (int) ton.stream().filter(t -> "SAP_HET".equals(t.trangThai())).count();
        int het = (int) ton.stream().filter(t -> "HET_HANG".equals(t.trangThai())).count();
        int dangCo = (int) ton.stream().filter(t -> safe(t.soLuongTon()) > 0).count();

        List<TonKhoResponse> canNhapThem = ton.stream()
                .filter(t -> safe(t.soLuongTon()) <= safe(t.mucTonToiThieu()))
                .limit(8)
                .toList();

        return new KhoOverviewResponse(tongTon, sapHet, het, dangCo, canNhapThem);
    }

    private boolean matches(TonKho t, String key) {
        SanPhamChiTiet spct = t.getSanPhamChiTiet();
        return contains(spct.getMaSku(), key)
                || contains(spct.getSanPham().getMaSanPham(), key)
                || contains(spct.getSanPham().getTenSanPham(), key)
                || contains(spct.getKichCo().getTenKichCo(), key)
                || contains(spct.getMauSac().getTenMau(), key);
    }

    private boolean contains(String value, String key) {
        return value != null && value.toLowerCase().contains(key);
    }

    @Transactional
    public PhieuKhoResponse taoPhieu(KhoPhieuRequest request) {
        validateRequest(request);

        Kho kho = khoRepository.findById(request.khoId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kho"));

        NhaCungCap nhaCungCap = request.nhaCungCapId() == null
                ? null
                : nhaCungCapRepository.findById(request.nhaCungCapId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhà cung cấp"));

        NhanVien nhanVien = request.nhanVienId() == null
                ? null
                : nhanVienRepository.findById(request.nhanVienId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên"));

        String maPhieu = (request.maPhieu() == null || request.maPhieu().isBlank())
                ? taoMaPhieu(request.loaiPhieu())
                : request.maPhieu().trim();

        if (phieuKhoRepository.findAll().stream()
                .anyMatch(p -> maPhieu.equalsIgnoreCase(p.getMaPhieu()))) {
            throw new RuntimeException("Mã phiếu đã tồn tại: " + maPhieu);
        }

        LocalDateTime now = LocalDateTime.now();

        String loaiPhieu = request.loaiPhieu().toUpperCase();

        PhieuKho phieu = PhieuKho.builder()
                .maPhieu(maPhieu)
                .loaiPhieu(loaiPhieu)
                .loai(loaiPhieu)
                .kho(kho)
                .nhaCungCap(nhaCungCap)
                .nhanVien(nhanVien)
                .lyDo(request.lyDo())
                .ghiChu(request.ghiChu())
                .trangThai("HOAN_THANH")
                .ngayTao(now)
                .ngayCapNhat(now)
                .build();

        phieu = phieuKhoRepository.save(phieu);

        List<ChiTietPhieuKho> chiTietList = new ArrayList<>();

        for (KhoPhieuRequest.ChiTietRequest item : request.chiTiet()) {
            if (item.sanPhamChiTietId() == null || item.soLuong() == null || item.soLuong() == 0) {
                throw new RuntimeException("Chi tiết phiếu không hợp lệ");
            }

            SanPhamChiTiet spct = sanPhamChiTietRepository.findById(item.sanPhamChiTietId())
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy sản phẩm chi tiết ID " + item.sanPhamChiTietId()));

            int delta = calculateDelta(request.loaiPhieu(), item.soLuong());

            TonKho tonKho = tonKhoRepository
                    .findByKho_IdAndSanPhamChiTiet_Id(kho.getId(), spct.getId())
                    .orElseGet(() -> TonKho.builder()
                            .kho(kho)
                            .sanPhamChiTiet(spct)
                            .soLuongTon(Math.max(0, safe(spct.getSoLuongTon())))
                            .soLuongDat(0)
                            .soLuongKhaDung(Math.max(0, safe(spct.getSoLuongTon())))
                            .mucTonToiThieu(5)
                            .mucTonToiDa(100)
                            .ngayCapNhat(now)
                            .build());

            int tonTruoc = safe(tonKho.getSoLuongTon());
            int tonSau = tonTruoc + delta;

            if (tonSau < 0) {
                throw new RuntimeException("Không đủ tồn kho cho SKU " + spct.getMaSku()
                        + ". Tồn hiện tại: " + tonTruoc);
            }

            tonKho.setSoLuongTon(tonSau);
            tonKho.setSoLuongKhaDung(Math.max(0, tonSau - safe(tonKho.getSoLuongDat())));
            tonKho.setNgayCapNhat(now);
            tonKhoRepository.save(tonKho);

            int spctTonMoi = safe(spct.getSoLuongTon()) + delta;
            if (spctTonMoi < 0) {
                throw new RuntimeException("Tồn sản phẩm không thể nhỏ hơn 0: " + spct.getMaSku());
            }
            spct.setSoLuongTon(spctTonMoi);
            spct.setNgayCapNhat(now);
            sanPhamChiTietRepository.save(spct);

            BigDecimal donGia = item.donGia() == null ? spct.getGiaBan() : item.donGia();
            BigDecimal thanhTien = donGia == null
                    ? null
                    : donGia.multiply(BigDecimal.valueOf(Math.abs((long) item.soLuong())));

            ChiTietPhieuKho chiTiet = ChiTietPhieuKho.builder()
                    .phieuKho(phieu)
                    .sanPhamChiTiet(spct)
                    .soLuong(item.soLuong())
                    .tonTruoc(tonTruoc)
                    .tonSau(tonSau)
                    .donGia(donGia)
                    .thanhTien(thanhTien)
                    .build();
            chiTietList.add(chiTiet);

            BienDongKho bienDong = BienDongKho.builder()
                    .kho(kho)
                    .sanPhamChiTiet(spct)
                    .loaiBienDong(request.loaiPhieu().toUpperCase())
                    .soLuongThayDoi(delta)
                    .tonTruoc(tonTruoc)
                    .tonSau(tonSau)
                    .phieuKho(phieu)
                    .lyDo(request.lyDo())
                    .ngayTao(now)
                    .build();
            bienDongKhoRepository.save(bienDong);
        }

        chiTietPhieuKhoRepository.saveAll(chiTietList);

        return toPhieuResponse(phieu, chiTietList);
    }

    @Transactional
    public List<PhieuKhoResponse> getPhieuKho() {
        return phieuKhoRepository.findAllByOrderByNgayTaoDesc()
                .stream()
                .map(this::toPhieuResponse)
                .toList();
    }

    @Transactional
    public PhieuKhoResponse getPhieuById(Long id) {
        PhieuKho phieu = phieuKhoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu kho"));
        return toPhieuResponse(phieu);
    }

    @Transactional
    public List<BienDongKhoResponse> getBienDong() {
        return bienDongKhoRepository.findTop200ByOrderByNgayTaoDesc()
                .stream()
                .map(b -> new BienDongKhoResponse(
                        b.getId(),
                        b.getLoaiBienDong(),
                        b.getPhieuKho() == null ? null : b.getPhieuKho().getMaPhieu(),
                        b.getSanPhamChiTiet().getMaSku(),
                        b.getSanPhamChiTiet().getSanPham().getTenSanPham(),
                        b.getSanPhamChiTiet().getKichCo().getTenKichCo(),
                        b.getSanPhamChiTiet().getMauSac().getTenMau(),
                        b.getSoLuongThayDoi(),
                        b.getTonTruoc(),
                        b.getTonSau(),
                        b.getLyDo(),
                        b.getNgayTao()
                ))
                .toList();
    }

    @Transactional
    public NhaCungCap taoNhaCungCap(NhaCungCap ncc) {
        if (ncc.getMaNcc() == null || ncc.getMaNcc().isBlank()) {
            ncc.setMaNcc("NCC" + System.currentTimeMillis());
        }
        if (ncc.getTrangThai() == null) ncc.setTrangThai("HOAT_DONG");
        if (ncc.getNgayTao() == null) ncc.setNgayTao(LocalDateTime.now());
        return nhaCungCapRepository.save(ncc);
    }

    @Transactional
    public void xuatKhoTuHoaDon(String maHoaDon, List<ChiTietHoaDon> chiTietHoaDon) {
        Kho kho = khoRepository.findByMaKho("KHO01")
                .orElseGet(() -> khoRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new RuntimeException("Chưa có kho mặc định")));

        List<KhoPhieuRequest.ChiTietRequest> items = chiTietHoaDon.stream()
                .map(ct -> new KhoPhieuRequest.ChiTietRequest(
                        ct.getSanPhamChiTiet().getId(),
                        ct.getSoLuong(),
                        ct.getDonGia()
                ))
                .toList();

        taoPhieu(new KhoPhieuRequest(
                "XK-" + maHoaDon,
                "XUAT",
                kho.getId(),
                null,
                null,
                "Xuất kho bán hàng",
                "Tự động theo hóa đơn " + maHoaDon,
                items
        ));
    }

    private int calculateDelta(String loai, int soLuong) {
        String type = loai.toUpperCase();
        if ("NHAP".equals(type)) {
            if (soLuong <= 0) throw new RuntimeException("Phiếu nhập phải có số lượng > 0");
            return soLuong;
        }
        if ("XUAT".equals(type)) {
            if (soLuong <= 0) throw new RuntimeException("Phiếu xuất phải có số lượng > 0");
            return -soLuong;
        }
        if ("DIEU_CHINH".equals(type)) {
            return soLuong;
        }
        throw new RuntimeException("Loại phiếu không hợp lệ");
    }

    private void validateRequest(KhoPhieuRequest request) {
        if (request == null || request.khoId() == null) {
            throw new RuntimeException("Vui lòng chọn kho");
        }
        if (request.loaiPhieu() == null
                || !(request.loaiPhieu().equalsIgnoreCase("NHAP")
                || request.loaiPhieu().equalsIgnoreCase("XUAT")
                || request.loaiPhieu().equalsIgnoreCase("DIEU_CHINH"))) {
            throw new RuntimeException("Loại phiếu phải là NHAP, XUAT hoặc DIEU_CHINH");
        }
        if (request.chiTiet() == null || request.chiTiet().isEmpty()) {
            throw new RuntimeException("Phiếu phải có ít nhất một sản phẩm");
        }
    }

    private String taoMaPhieu(String loai) {
        String prefix = "NHAP".equalsIgnoreCase(loai) ? "NK"
                : "XUAT".equalsIgnoreCase(loai) ? "XK" : "DC";
        return prefix + System.currentTimeMillis();
    }

    private PhieuKhoResponse toPhieuResponse(PhieuKho p) {
        return toPhieuResponse(p, chiTietPhieuKhoRepository.findByPhieuKho_Id(p.getId()));
    }

    private PhieuKhoResponse toPhieuResponse(PhieuKho p, List<ChiTietPhieuKho> details) {
        return new PhieuKhoResponse(
                p.getId(),
                p.getMaPhieu(),
                p.getLoaiPhieu(),
                p.getKho().getTenKho(),
                p.getNhaCungCap() == null ? null : p.getNhaCungCap().getTenNcc(),
                p.getNhanVien() == null ? null : p.getNhanVien().getHoTen(),
                p.getLyDo(),
                p.getGhiChu(),
                p.getTrangThai(),
                p.getNgayTao(),
                details.stream().map(d -> new PhieuKhoResponse.ChiTietResponse(
                        d.getId(),
                        d.getSanPhamChiTiet().getId(),
                        d.getSanPhamChiTiet().getMaSku(),
                        d.getSanPhamChiTiet().getSanPham().getTenSanPham(),
                        d.getSanPhamChiTiet().getKichCo().getTenKichCo(),
                        d.getSanPhamChiTiet().getMauSac().getTenMau(),
                        d.getSoLuong()
                )).toList()
        );
    }

    private TonKhoResponse toTonKhoResponse(TonKho t) {
        SanPhamChiTiet spct = t.getSanPhamChiTiet();
        int ton = safe(t.getSoLuongTon());
        int min = safe(t.getMucTonToiThieu());

        String status = ton == 0 ? "HET_HANG" : ton <= min ? "SAP_HET" : "CON_HANG";

        return new TonKhoResponse(
                t.getId(),
                t.getKho().getId(),
                t.getKho().getMaKho(),
                spct.getId(),
                spct.getMaSku(),
                spct.getSanPham().getId(),
                spct.getSanPham().getTenSanPham(),
                spct.getKichCo().getTenKichCo(),
                spct.getMauSac().getTenMau(),
                spct.getSanPham().getHinhAnh(),
                ton,
                safe(t.getSoLuongDat()),
                safe(t.getSoLuongKhaDung()),
                min,
                safe(t.getMucTonToiDa()),
                status
        );
    }

    private int safe(Integer n) {
        return n == null ? 0 : n;
    }
}
