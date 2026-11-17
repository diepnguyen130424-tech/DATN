package com.example.bangiay.service;

import com.example.bangiay.entity.DanhMuc;
import com.example.bangiay.entity.KichCo;
import com.example.bangiay.entity.MauSac;
import com.example.bangiay.entity.ThuongHieu;
import com.example.bangiay.entity.SanPham;
import com.example.bangiay.entity.SanPhamChiTiet;
import com.example.bangiay.repository.DanhMucRepository;
import com.example.bangiay.repository.KichCoRepository;
import com.example.bangiay.repository.MauSacRepository;
import com.example.bangiay.repository.SanPhamChiTietRepository;
import com.example.bangiay.repository.SanPhamRepository;
import com.example.bangiay.repository.ThuongHieuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SanPhamService {

    private final SanPhamRepository sanPhamRepository;
    private final SanPhamChiTietRepository sanPhamChiTietRepository;
    private final KichCoRepository kichCoRepository;
    private final MauSacRepository mauSacRepository;
    private final DanhMucRepository danhMucRepository;
    private final ThuongHieuRepository thuongHieuRepository;

    public List<SanPham> getAll() {
        return sanPhamRepository.findAll();
    }

    public SanPham getById(Long id) {
        return sanPhamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
    }

    /** Mã xem trước cho form; khi lưu Backend luôn sinh lại để tránh trùng khi nhiều người thao tác. */
    public String xemMaSanPhamTiepTheo() {
        return taoMaSanPhamMoi();
    }

    private String taoMaSanPhamMoi() {
        // Chỉ lấy giá trị số lớn nhất từ database, tránh findAll() và xử lý toàn bộ
        // danh sách sản phẩm trong bộ nhớ mỗi lần mở form/thêm sản phẩm.
        long max = sanPhamRepository.findMaxMaSanPhamNumber();
        String candidate;
        do {
            max++;
            candidate = String.format("N%02d", max);
        } while (sanPhamRepository.existsByMaSanPham(candidate));
        return candidate;
    }

    @Transactional
    public SanPham save(SanPham request) {
        if (request == null) {
            throw new IllegalArgumentException("Dữ liệu sản phẩm không hợp lệ.");
        }
        if (request.getTenSanPham() == null || request.getTenSanPham().isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập tên sản phẩm.");
        }
        if (request.getDanhMuc() == null || request.getDanhMuc().getId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn danh mục sản phẩm.");
        }
        if (request.getThuongHieu() == null || request.getThuongHieu().getId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn thương hiệu sản phẩm.");
        }

        // Lấy quan hệ từ DB, không lưu trực tiếp object chỉ có ID nhận từ JSON.
        DanhMuc danhMuc = danhMucRepository.findById(request.getDanhMuc().getId())
                .orElseThrow(() -> new IllegalArgumentException("Danh mục được chọn không tồn tại."));
        ThuongHieu thuongHieu = thuongHieuRepository.findById(request.getThuongHieu().getId())
                .orElseThrow(() -> new IllegalArgumentException("Thương hiệu được chọn không tồn tại."));

        SanPham entity;
        if (request.getId() == null) {
            entity = request;
            entity.setMaSanPham(taoMaSanPhamMoi());
            entity.setNgayTao(LocalDateTime.now());
            if (entity.getTrangThai() == null || entity.getTrangThai().isBlank()) {
                entity.setTrangThai("HOAT_DONG");
            }
        } else {
            entity = sanPhamRepository.findById(request.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm cần cập nhật."));
            entity.setTenSanPham(request.getTenSanPham().trim());
            entity.setChatLieu(request.getChatLieu());
            entity.setKieuDang(request.getKieuDang());
            entity.setXuatXu(request.getXuatXu());
            entity.setMoTa(request.getMoTa());
            entity.setHinhAnh(request.getHinhAnh());
            if (request.getTrangThai() != null && !request.getTrangThai().isBlank()) {
                entity.setTrangThai(request.getTrangThai());
            }
            // Giữ nguyên mã sản phẩm và ngày tạo khi cập nhật.
        }

        entity.setTenSanPham(entity.getTenSanPham().trim());
        entity.setDanhMuc(danhMuc);
        entity.setThuongHieu(thuongHieu);
        return sanPhamRepository.save(entity);
    }

    /**
     * Xóa mềm sản phẩm:
     * - Không xóa bản ghi sản phẩm khỏi database.
     * - Không xóa các biến thể để giữ liên kết với hóa đơn và lịch sử kho.
     * - Chuyển trạng thái sản phẩm thành DA_XOA và biến thể thành INACTIVE.
     */
    @Transactional
    public void delete(Long id) {
        SanPham sanPham = getById(id);

        // Đánh dấu sản phẩm đã xóa, không xóa vật lý khỏi database.
        sanPham.setTrangThai("DA_XOA");
        sanPhamRepository.save(sanPham);

        // Ẩn các biến thể nhưng vẫn giữ bản ghi để bảo toàn dữ liệu lịch sử.
        List<SanPhamChiTiet> variants =
                sanPhamChiTietRepository.findBySanPham_Id(id);

        LocalDateTime now = LocalDateTime.now();
        for (SanPhamChiTiet variant : variants) {
            variant.setTrangThai("INACTIVE");
            variant.setNgayCapNhat(now);
        }

        if (!variants.isEmpty()) {
            sanPhamChiTietRepository.saveAll(variants);
        }
    }

    public List<SanPhamChiTiet> getAllChiTiet() {
        return sanPhamChiTietRepository.findAll();
    }

    public List<SanPhamChiTiet> getChiTietBySanPhamId(Long sanPhamId) {
        return sanPhamChiTietRepository.findBySanPham_Id(sanPhamId);
    }

    public SanPhamChiTiet getChiTietById(Long id) {
        return sanPhamChiTietRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm chi tiết"));
    }

    /**
     * Lưu biến thể bằng các entity đang được quản lý bởi JPA.
     * Không gán trực tiếp object {id: ...} nhận từ JSON vì có thể gây lỗi
     * detached/transient entity khi persist biến thể mới.
     */
    @Transactional
    public SanPhamChiTiet saveChiTiet(SanPhamChiTiet request) {
        if (request == null) {
            throw new IllegalArgumentException("Dữ liệu biến thể không hợp lệ.");
        }
        if (request.getSanPham() == null || request.getSanPham().getId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn sản phẩm cho biến thể.");
        }
        if (request.getKichCo() == null || request.getKichCo().getId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn kích cỡ cho biến thể.");
        }
        if (request.getMauSac() == null || request.getMauSac().getId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn màu sắc cho biến thể.");
        }

        SanPham sanPham = sanPhamRepository.findById(request.getSanPham().getId())
                .orElseThrow(() -> new IllegalArgumentException("Sản phẩm được chọn không tồn tại."));
        KichCo kichCo = kichCoRepository.findById(request.getKichCo().getId())
                .orElseThrow(() -> new IllegalArgumentException("Kích cỡ được chọn không tồn tại."));
        MauSac mauSac = mauSacRepository.findById(request.getMauSac().getId())
                .orElseThrow(() -> new IllegalArgumentException("Màu sắc được chọn không tồn tại."));

        BigDecimal giaBan = request.getGiaBan();
        if (giaBan == null || giaBan.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Giá bán biến thể phải lớn hơn 0.");
        }

        SanPhamChiTiet current = null;
        if (request.getId() != null) {
            current = sanPhamChiTietRepository.findById(request.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Biến thể cần cập nhật không tồn tại."));
        }

        boolean trungToHop = current == null
                ? sanPhamChiTietRepository.existsBySanPham_IdAndKichCo_IdAndMauSac_Id(
                sanPham.getId(), kichCo.getId(), mauSac.getId())
                : sanPhamChiTietRepository.existsBySanPham_IdAndKichCo_IdAndMauSac_IdAndIdNot(
                sanPham.getId(), kichCo.getId(), mauSac.getId(), current.getId());
        if (trungToHop) {
            throw new IllegalArgumentException(
                    "Biến thể bị trùng: sản phẩm " + sanPham.getMaSanPham()
                            + " (" + sanPham.getTenSanPham() + "), size "
                            + kichCo.getTenKichCo() + ", màu " + mauSac.getTenMau()
                            + " đã tồn tại. Hãy chọn size hoặc màu khác.");
        }

        String maSku = request.getMaSku() == null ? "" : request.getMaSku().trim();
        if (maSku.isBlank()) {
            maSku = taoMaSku(sanPham, kichCo, mauSac);
        }
        boolean trungSku = current == null
                ? sanPhamChiTietRepository.existsByMaSku(maSku)
                : sanPhamChiTietRepository.existsByMaSkuAndIdNot(maSku, current.getId());
        if (trungSku) {
            throw new IllegalArgumentException("Mã SKU đã tồn tại: " + maSku
                    + ". Vui lòng kiểm tra lại mã sản phẩm, size và màu sắc.");
        }

        LocalDateTime now = LocalDateTime.now();
        SanPhamChiTiet entity = current == null ? new SanPhamChiTiet() : current;
        entity.setSanPham(sanPham);
        entity.setKichCo(kichCo);
        entity.setMauSac(mauSac);
        entity.setMaSku(maSku);
        entity.setGiaBan(giaBan);

        // Tồn kho chỉ thay đổi qua phiếu nhập/xuất trong module Kho hàng.
        if (current == null) {
            entity.setSoLuongTon(0);
            entity.setNgayTao(now);
        } else {
            entity.setSoLuongTon(current.getSoLuongTon() == null ? 0 : current.getSoLuongTon());
            entity.setNgayTao(current.getNgayTao());
        }

        entity.setTrangThai(request.getTrangThai() == null || request.getTrangThai().isBlank()
                ? (current == null ? "HOAT_DONG" : current.getTrangThai())
                : request.getTrangThai());
        entity.setNgayCapNhat(now);

        return sanPhamChiTietRepository.save(entity);
    }

    private String taoMaSku(SanPham sanPham, KichCo kichCo, MauSac mauSac) {
        return clean(sanPham.getMaSanPham()) + "-"
                + clean(kichCo.getTenKichCo()) + "-"
                + clean(mauSac.getTenMau());
    }

    private String clean(String value) {
        String normalized = Normalizer.normalize(
                        value == null ? "" : value,
                        Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D');

        String result = normalized.replaceAll("[^a-zA-Z0-9]+", "-")
                .replaceAll("^-|-$", "")
                .toUpperCase(Locale.ROOT);

        return result.isBlank() ? "NA" : result;
    }

    @Transactional
    public void deleteChiTiet(Long id) {
        SanPhamChiTiet spct = sanPhamChiTietRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm chi tiết"));

        spct.setTrangThai("INACTIVE");
        spct.setNgayCapNhat(LocalDateTime.now());
        sanPhamChiTietRepository.save(spct);
    }
}
