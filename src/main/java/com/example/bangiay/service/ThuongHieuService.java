package com.example.bangiay.service;

import com.example.bangiay.entity.ThuongHieu;
import com.example.bangiay.repository.SanPhamRepository;
import com.example.bangiay.repository.ThuongHieuRepository;
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
public class ThuongHieuService {

    private static final String HOAT_DONG = "HOAT_DONG";
    private static final String NGUNG_HOAT_DONG = "NGUNG_HOAT_DONG";

    private final ThuongHieuRepository thuongHieuRepository;
    private final SanPhamRepository sanPhamRepository;

    public List<ThuongHieu> getAll() {
        return thuongHieuRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    public ThuongHieu getById(Long id) {
        return thuongHieuRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy thương hiệu"));
    }

    /** Số sản phẩm theo từng thương hiệu: {thuongHieuId: soLuong} */
    public Map<Long, Long> thongKeSoSanPham() {
        Map<Long, Long> result = new HashMap<>();
        for (Object[] row : sanPhamRepository.demSanPhamTheoThuongHieu()) {
            result.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        return result;
    }

    @Transactional
    public ThuongHieu create(ThuongHieu input) {
        String ten = chuanHoaTen(input.getTenThuongHieu());
        kiemTraTrungTen(ten, null);

        ThuongHieu thuongHieu = ThuongHieu.builder()
                .tenThuongHieu(ten)
                .quocGiaThuongHieu(chuanHoaChuoi(input.getQuocGiaThuongHieu(), 100, "Quốc gia"))
                .moTa(chuanHoaChuoi(input.getMoTa(), Integer.MAX_VALUE, "Mô tả"))
                .trangThai(chuanHoaTrangThai(input.getTrangThai()))
                .ngayTao(LocalDateTime.now())
                .build();

        return thuongHieuRepository.save(thuongHieu);
    }

    /** Cập nhật: giữ nguyên id và ngày tạo. */
    @Transactional
    public ThuongHieu update(Long id, ThuongHieu input) {
        ThuongHieu thuongHieu = getById(id);

        String ten = chuanHoaTen(input.getTenThuongHieu());
        kiemTraTrungTen(ten, id);

        thuongHieu.setTenThuongHieu(ten);
        thuongHieu.setQuocGiaThuongHieu(
                chuanHoaChuoi(input.getQuocGiaThuongHieu(), 100, "Quốc gia"));
        thuongHieu.setMoTa(chuanHoaChuoi(input.getMoTa(), Integer.MAX_VALUE, "Mô tả"));

        if (input.getTrangThai() != null) {
            thuongHieu.setTrangThai(chuanHoaTrangThai(input.getTrangThai()));
        }

        return thuongHieuRepository.save(thuongHieu);
    }

    /** Xóa mềm: chuyển sang NGUNG_HOAT_DONG. */
    @Transactional
    public void delete(Long id) {
        ThuongHieu thuongHieu = getById(id);
        thuongHieu.setTrangThai(NGUNG_HOAT_DONG);
        thuongHieuRepository.save(thuongHieu);
    }

    /** Xóa hẳn khỏi database, chỉ khi chưa có sản phẩm nào dùng thương hiệu này. */
    @Transactional
    public void xoaVinhVien(Long id) {
        ThuongHieu thuongHieu = getById(id);

        long soSanPham = sanPhamRepository.countByThuongHieu_Id(id);
        if (soSanPham > 0) {
            throw new IllegalStateException(
                    "Không thể xóa vĩnh viễn: đang có " + soSanPham
                            + " sản phẩm thuộc thương hiệu này. Hãy chọn \"Ngừng hoạt động\" thay thế.");
        }

        thuongHieuRepository.delete(thuongHieu);
    }

    // ---------- helpers ----------

    private String chuanHoaTen(String ten) {
        if (ten == null || ten.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập tên thương hiệu");
        }
        String result = ten.trim().replaceAll("\\s+", " ");
        if (result.length() < 2) {
            throw new IllegalArgumentException("Tên thương hiệu quá ngắn");
        }
        if (result.length() > 150) {
            throw new IllegalArgumentException("Tên thương hiệu tối đa 150 ký tự");
        }
        return result;
    }

    private String chuanHoaChuoi(String value, int maxLength, String tenTruong) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        String result = value.trim();
        if (result.length() > maxLength) {
            throw new IllegalArgumentException(tenTruong + " tối đa " + maxLength + " ký tự");
        }
        return result;
    }

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
        thuongHieuRepository.findByTenThuongHieuIgnoreCase(ten).ifPresent(daCo -> {
            if (idHienTai == null || !daCo.getId().equals(idHienTai)) {
                throw new IllegalStateException("Tên thương hiệu \"" + ten + "\" đã tồn tại");
            }
        });
    }
}
