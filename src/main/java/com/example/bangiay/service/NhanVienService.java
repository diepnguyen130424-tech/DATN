package com.example.bangiay.service;

import com.example.bangiay.entity.NhanVien;
import com.example.bangiay.entity.TaiKhoan;
import com.example.bangiay.repository.NhanVienRepository;
import com.example.bangiay.repository.TaiKhoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NhanVienService {

    private final NhanVienRepository nhanVienRepository;
    private final TaiKhoanRepository taiKhoanRepository;

    public List<NhanVien> getAll() {
        return nhanVienRepository.findAll();
    }

    public NhanVien getById(Long id) {
        return nhanVienRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy nhân viên"));
    }

    public NhanVien getByTaiKhoanId(Long taiKhoanId) {
        return nhanVienRepository.findByTaiKhoan_Id(taiKhoanId)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy nhân viên"));
    }

    @Transactional
    public NhanVien create(NhanVien nhanVien) {
        if (nhanVien.getTaiKhoan() == null ||
                nhanVien.getTaiKhoan().getTenDangNhap() == null ||
                nhanVien.getTaiKhoan().getMatKhau() == null) {
            throw new RuntimeException("Thiếu thông tin tài khoản");
        }

        String tenDangNhap =
                nhanVien.getTaiKhoan().getTenDangNhap();

        if (taiKhoanRepository.existsByTenDangNhap(tenDangNhap)) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại");
        }

        TaiKhoan taiKhoan = nhanVien.getTaiKhoan();
        taiKhoan.setVaiTro("NHAN_VIEN");
        taiKhoan.setTrangThai("HOAT_DONG");
        taiKhoan.setNgayTao(LocalDateTime.now());

        TaiKhoan savedTaiKhoan =
                taiKhoanRepository.save(taiKhoan);

        nhanVien.setTaiKhoan(savedTaiKhoan);

        if (nhanVien.getTrangThai() == null ||
                nhanVien.getTrangThai().isBlank()) {
            nhanVien.setTrangThai("HOAT_DONG");
        }

        return nhanVienRepository.save(nhanVien);
    }

    public NhanVien save(NhanVien nhanVien) {
        return nhanVienRepository.save(nhanVien);
    }

    public NhanVien update(Long id, NhanVien nhanVien) {
        NhanVien existing = getById(id);

        existing.setHoTen(nhanVien.getHoTen());
        existing.setSoDienThoai(nhanVien.getSoDienThoai());
        existing.setChucVu(nhanVien.getChucVu());
        existing.setTrangThai(nhanVien.getTrangThai());
        existing.setNgayVaoLam(nhanVien.getNgayVaoLam());

        return nhanVienRepository.save(existing);
    }

    public void delete(Long id) {
        if (!nhanVienRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy nhân viên");
        }

        nhanVienRepository.deleteById(id);
    }
}
