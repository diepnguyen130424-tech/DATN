package com.example.bangiay.service;

import com.example.bangiay.dto.ChuongTrinhGiamGiaRequest;
import com.example.bangiay.dto.ChuongTrinhGiamGiaResponse;
import com.example.bangiay.entity.*;
import com.example.bangiay.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChuongTrinhGiamGiaService {

    private final ChuongTrinhGiamGiaRepository ctggRepo;
    private final SanPhamGiamGiaRepository spggRepo;
    private final BienTheGiamGiaRepository btggRepo;
    private final ThuongHieuRepository thuongHieuRepo;
    private final SanPhamRepository sanPhamRepo;
    private final SanPhamChiTietRepository sanPhamChiTietRepo;

    /* ================= GET ================= */

    @Transactional(readOnly = true)
    public List<ChuongTrinhGiamGiaResponse> getAll() {
        return ctggRepo.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ChuongTrinhGiamGiaResponse getById(Long id) {
        ChuongTrinhGiamGia e = ctggRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chương trình"));
        return toResponse(e);
    }

    /* ⭐ MỚI: cho khách hàng */
    @Transactional(readOnly = true)
    public List<ChuongTrinhGiamGiaResponse> getDangHoatDong() {
        LocalDateTime now = LocalDateTime.now();
        return ctggRepo.findAll().stream()
                .filter(e -> "HOAT_DONG".equals(e.getTrangThai()))
                .filter(e -> e.getNgayBatDau() == null || !now.isBefore(e.getNgayBatDau()))
                .filter(e -> e.getNgayKetThuc() == null || !now.isAfter(e.getNgayKetThuc()))
                .map(this::toResponse)
                .toList();
    }

    /* ================= CREATE ================= */

    @Transactional
    public ChuongTrinhGiamGiaResponse save(ChuongTrinhGiamGiaRequest req) {
        validate(req);

        ChuongTrinhGiamGia e = ChuongTrinhGiamGia.builder()
                .tenChuongTrinh(req.getTenChuongTrinh().trim())
                .loaiGiam(req.getLoaiGiam())
                .giaTriGiam(req.getGiaTriGiam())
                .ngayBatDau(req.getNgayBatDau())
                .ngayKetThuc(req.getNgayKetThuc())
                .trangThai(req.getTrangThai() == null ? "HOAT_DONG" : req.getTrangThai())
                .phamViApDung(req.getPhamViApDung())
                .thuongHieu(null)
                .build();

        if ("THUONG_HIEU".equals(req.getPhamViApDung())) {
            ThuongHieu th = thuongHieuRepo.findById(req.getThuongHieuId())
                    .orElseThrow(() -> new RuntimeException("Thương hiệu không tồn tại"));
            e.setThuongHieu(th);
        }

        ChuongTrinhGiamGia saved = ctggRepo.save(e);
        saveChildren(saved, req);
        return toResponse(saved);
    }

    /* ================= UPDATE ================= */

    @Transactional
    public ChuongTrinhGiamGiaResponse update(Long id, ChuongTrinhGiamGiaRequest req) {
        validate(req);

        ChuongTrinhGiamGia e = ctggRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chương trình"));

        e.setTenChuongTrinh(req.getTenChuongTrinh().trim());
        e.setLoaiGiam(req.getLoaiGiam());
        e.setGiaTriGiam(req.getGiaTriGiam());
        e.setNgayBatDau(req.getNgayBatDau());
        e.setNgayKetThuc(req.getNgayKetThuc());
        e.setTrangThai(req.getTrangThai());
        e.setPhamViApDung(req.getPhamViApDung());
        e.setThuongHieu(null);

        if ("THUONG_HIEU".equals(req.getPhamViApDung())) {
            ThuongHieu th = thuongHieuRepo.findById(req.getThuongHieuId())
                    .orElseThrow(() -> new RuntimeException("Thương hiệu không tồn tại"));
            e.setThuongHieu(th);
        }

        ctggRepo.save(e);
        spggRepo.deleteByChuongTrinhGiamGiaId(id);
        btggRepo.deleteByChuongTrinhGiamGiaId(id);
        saveChildren(e, req);

        return toResponse(e);
    }

    /* ================= DELETE ================= */

    @Transactional
    public void delete(Long id) {
        spggRepo.deleteByChuongTrinhGiamGiaId(id);
        btggRepo.deleteByChuongTrinhGiamGiaId(id);
        ctggRepo.deleteById(id);
    }

    /* ================= PRIVATE ================= */

    private void validate(ChuongTrinhGiamGiaRequest req) {
        if (req.getNgayBatDau() == null || req.getNgayKetThuc() == null)
            throw new RuntimeException("Ngày bắt đầu / kết thúc không được trống");
        if (!req.getNgayKetThuc().isAfter(req.getNgayBatDau()))
            throw new RuntimeException("Ngày kết thúc phải sau ngày bắt đầu");

        String pv = req.getPhamViApDung();
        if (pv == null) throw new RuntimeException("Thiếu phạm vi áp dụng");

        switch (pv) {
            case "THUONG_HIEU":
                if (req.getThuongHieuId() == null)
                    throw new RuntimeException("Vui lòng chọn thương hiệu");
                break;
            case "SAN_PHAM":
                if (req.getSanPhamIds() == null || req.getSanPhamIds().isEmpty())
                    throw new RuntimeException("Vui lòng chọn ít nhất 1 sản phẩm");
                break;
            case "BIEN_THE":
                if (req.getBienTheIds() == null || req.getBienTheIds().isEmpty())
                    throw new RuntimeException("Vui lòng chọn ít nhất 1 biến thể");
                break;
            case "TAT_CA":
                break;
            default:
                throw new RuntimeException("Phạm vi áp dụng không hợp lệ");
        }
    }

    private void saveChildren(ChuongTrinhGiamGia parent, ChuongTrinhGiamGiaRequest req) {
        String pv = req.getPhamViApDung();

        if ("SAN_PHAM".equals(pv)) {
            for (Long spId : req.getSanPhamIds()) {
                SanPham sp = sanPhamRepo.findById(spId)
                        .orElseThrow(() -> new RuntimeException("Sản phẩm " + spId + " không tồn tại"));
                spggRepo.save(SanPhamGiamGia.builder()
                        .chuongTrinhGiamGia(parent)
                        .sanPham(sp)
                        .build());
            }
        } else if ("BIEN_THE".equals(pv)) {
            for (Long ctspId : req.getBienTheIds()) {
                SanPhamChiTiet ct = sanPhamChiTietRepo.findById(ctspId)
                        .orElseThrow(() -> new RuntimeException("Biến thể " + ctspId + " không tồn tại"));
                btggRepo.save(BienTheGiamGia.builder()
                        .chuongTrinhGiamGia(parent)
                        .sanPhamChiTiet(ct)
                        .build());
            }
        }
    }

    private ChuongTrinhGiamGiaResponse toResponse(ChuongTrinhGiamGia e) {
        ChuongTrinhGiamGiaResponse r = new ChuongTrinhGiamGiaResponse();
        r.setId(e.getId());
        r.setTenChuongTrinh(e.getTenChuongTrinh());
        r.setLoaiGiam(e.getLoaiGiam());
        r.setGiaTriGiam(e.getGiaTriGiam());
        r.setNgayBatDau(e.getNgayBatDau());
        r.setNgayKetThuc(e.getNgayKetThuc());
        r.setTrangThai(e.getTrangThai());
        r.setPhamViApDung(e.getPhamViApDung());

        if (e.getThuongHieu() != null) {
            r.setThuongHieuId(e.getThuongHieu().getId());
            r.setTenThuongHieu(e.getThuongHieu().getTenThuongHieu());
        }

        List<ChuongTrinhGiamGiaResponse.ItemApDung> spList = new ArrayList<>();
        for (SanPhamGiamGia s : spggRepo.findByChuongTrinhGiamGia_Id(e.getId())) {
            ChuongTrinhGiamGiaResponse.ItemApDung it = new ChuongTrinhGiamGiaResponse.ItemApDung();
            it.setId(s.getId());
            it.setSanPhamId(s.getSanPham().getId());
            it.setTenSanPham(s.getSanPham().getTenSanPham());
            spList.add(it);
        }

        List<ChuongTrinhGiamGiaResponse.ItemApDung> btList = new ArrayList<>();
        for (BienTheGiamGia b : btggRepo.findByChuongTrinhGiamGia_Id(e.getId())) {
            SanPhamChiTiet ct = b.getSanPhamChiTiet();
            ChuongTrinhGiamGiaResponse.ItemApDung it = new ChuongTrinhGiamGiaResponse.ItemApDung();
            it.setId(b.getId());
            it.setSanPhamId(ct.getSanPham().getId());
            it.setTenSanPham(ct.getSanPham().getTenSanPham());
            it.setSanPhamChiTietId(ct.getId());
            it.setMaSku(ct.getMaSku());
            if (ct.getKichCo() != null) it.setTenKichCo(ct.getKichCo().getTenKichCo());
            if (ct.getMauSac() != null) it.setTenMau(ct.getMauSac().getTenMau());
            btList.add(it);
        }

        r.setSanPhams(spList);
        r.setBienThes(btList);
        return r;
    }
}