package com.example.bangiay.service;

import com.example.bangiay.entity.DanhMuc;
import com.example.bangiay.repository.DanhMucRepository;
import com.example.bangiay.repository.SanPhamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class DanhMucService {

    private static final String HOAT_DONG = "HOAT_DONG";
    private static final String NGUNG_HOAT_DONG = "NGUNG_HOAT_DONG";

    private final DanhMucRepository danhMucRepository;
    private final SanPhamRepository sanPhamRepository;

    public List<DanhMuc> getAll() {
        return danhMucRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    public DanhMuc getById(Long id) {
        return danhMucRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy danh mục"));
    }

    /** Số sản phẩm theo từng danh mục: {danhMucId: soLuong} */
    public Map<Long, Long> thongKeSoSanPham() {
        Map<Long, Long> result = new HashMap<>();
        for (Object[] row : sanPhamRepository.demSanPhamTheoDanhMuc()) {
            result.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        return result;
    }

    @Transactional
    public DanhMuc create(DanhMuc input) {
        String ten = chuanHoaTen(input.getTenDanhMuc());
        kiemTraTrungTen(ten, null);

        DanhMuc danhMuc = DanhMuc.builder()
                .tenDanhMuc(ten)
                .moTa(chuanHoaMoTa(input.getMoTa()))
                .trangThai(chuanHoaTrangThai(input.getTrangThai()))
                .ngayTao(LocalDateTime.now())
                .build();

        return danhMucRepository.save(danhMuc);
    }

    /** Cập nhật: giữ nguyên id và ngày tạo, chỉ đổi các trường cho phép. */
    @Transactional
    public DanhMuc update(Long id, DanhMuc input) {
        DanhMuc danhMuc = getById(id);

        String ten = chuanHoaTen(input.getTenDanhMuc());
        kiemTraTrungTen(ten, id);

        danhMuc.setTenDanhMuc(ten);
        danhMuc.setMoTa(chuanHoaMoTa(input.getMoTa()));

        if (input.getTrangThai() != null) {
            danhMuc.setTrangThai(chuanHoaTrangThai(input.getTrangThai()));
        }

        return danhMucRepository.save(danhMuc);
    }

    /** Xóa mềm: chuyển sang NGUNG_HOAT_DONG. */
    @Transactional
    public void delete(Long id) {
        DanhMuc danhMuc = getById(id);
        danhMuc.setTrangThai(NGUNG_HOAT_DONG);
        danhMucRepository.save(danhMuc);
    }

    /** Xóa hẳn khỏi database, chỉ khi chưa có sản phẩm nào dùng danh mục này. */
    @Transactional
    public void xoaVinhVien(Long id) {
        DanhMuc danhMuc = getById(id);

        long soSanPham = sanPhamRepository.countByDanhMuc_Id(id);
        if (soSanPham > 0) {
            throw new IllegalStateException(
                    "Không thể xóa vĩnh viễn: đang có " + soSanPham
                            + " sản phẩm thuộc danh mục này. Hãy chọn \"Ngừng hoạt động\" thay thế.");
        }

        danhMucRepository.delete(danhMuc);
    }

    // ---------- helpers ----------

    private String chuanHoaTen(String ten) {
        if (ten == null || ten.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập tên danh mục");
        }
        String result = ten.trim().replaceAll("\\s+", " ");
        if (result.length() < 2) {
            throw new IllegalArgumentException("Tên danh mục quá ngắn");
        }
        if (result.length() > 150) {
            throw new IllegalArgumentException("Tên danh mục tối đa 150 ký tự");
        }
        return result;
    }

    private String chuanHoaMoTa(String moTa) {
        if (moTa == null || moTa.trim().isEmpty()) {
            return null;
        }
        return moTa.trim();
    }

    /** Dữ liệu cũ có thể là ACTIVE/INACTIVE -> đưa về chuẩn của hệ thống. */
    private String chuanHoaTrangThai(String trangThai) {
        if (trangThai == null || trangThai.isBlank()) {
            return HOAT_DONG;
        }
        String value = trangThai.trim().toUpperCase();
        if (value.equals("ACTIVE") || value.equals(HOAT_DONG)) {
            return HOAT_DONG;
        }
        if (value.equals("INACTIVE") || value.equals(NGUNG_HOAT_DONG)) {
            return NGUNG_HOAT_DONG;
        }
        throw new IllegalArgumentException("Trạng thái không hợp lệ");
    }

    private void kiemTraTrungTen(String ten, Long idHienTai) {
        danhMucRepository.findByTenDanhMucIgnoreCase(ten).ifPresent(daCo -> {
            if (idHienTai == null || !daCo.getId().equals(idHienTai)) {
                throw new IllegalStateException("Tên danh mục \"" + ten + "\" đã tồn tại");
            }
        });
    }
}
