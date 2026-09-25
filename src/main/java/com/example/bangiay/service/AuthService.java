package com.example.bangiay.service;

import com.example.bangiay.entity.TaiKhoan;
import com.example.bangiay.repository.TaiKhoanRepository;
import com.example.bangiay.entity.KhachHang;
import com.example.bangiay.repository.KhachHangRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final TaiKhoanRepository taiKhoanRepository;
    private final KhachHangRepository khachHangRepository;

    public List<TaiKhoan> getAll() {
        return taiKhoanRepository.findAll();
    }

    public TaiKhoan getById(Long id) {
        return taiKhoanRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy tài khoản"));
    }

    public TaiKhoan getByTenDangNhap(String tenDangNhap) {
        return taiKhoanRepository.findByTenDangNhap(tenDangNhap)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy tài khoản"));
    }

    public TaiKhoan save(TaiKhoan taiKhoan) {
        return taiKhoanRepository.save(taiKhoan);
    }

    public void delete(Long id) {
        taiKhoanRepository.deleteById(id);
    }

    public boolean existsByTenDangNhap(String tenDangNhap) {
        return taiKhoanRepository.existsByTenDangNhap(tenDangNhap);
    }

    public TaiKhoan login(String tenDangNhap, String matKhau) {

        TaiKhoan taiKhoan = taiKhoanRepository
                .findByTenDangNhap(tenDangNhap)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Sai tên đăng nhập hoặc mật khẩu"
                        ));

        if (!taiKhoan.getMatKhau().equals(matKhau)) {
            throw new RuntimeException(
                    "Sai tên đăng nhập hoặc mật khẩu"
            );
        }

        if (!"HOAT_DONG".equalsIgnoreCase(taiKhoan.getTrangThai())) {
            throw new RuntimeException(
                    "Tài khoản không hoạt động"
            );
        }

        String vaiTro = taiKhoan.getVaiTro();

        if (vaiTro == null ||
                (!"QUAN_TRI".equalsIgnoreCase(vaiTro)
                        && !"NHAN_VIEN".equalsIgnoreCase(vaiTro)
                        && !"KHACH_HANG".equalsIgnoreCase(vaiTro))) {

            throw new RuntimeException(
                    "Vai trò tài khoản không hợp lệ"
            );
        }

        return taiKhoan;
    }


    public TaiKhoan register(TaiKhoan taiKhoan) {

        if (taiKhoan.getTenDangNhap() == null
                || taiKhoan.getTenDangNhap().trim().isEmpty()) {

            throw new RuntimeException(
                    "Tên đăng nhập không được để trống"
            );
        }

        if (taiKhoan.getMatKhau() == null
                || taiKhoan.getMatKhau().isEmpty()) {

            throw new RuntimeException(
                    "Mật khẩu không được để trống"
            );
        }

        String tenDangNhap = taiKhoan
                .getTenDangNhap()
                .trim();

        if (taiKhoanRepository.existsByTenDangNhap(tenDangNhap)) {
            throw new RuntimeException(
                    "Tên đăng nhập đã tồn tại"
            );
        }


        taiKhoan.setTenDangNhap(tenDangNhap);
        taiKhoan.setVaiTro("KHACH_HANG");
        taiKhoan.setTrangThai("HOAT_DONG");
        taiKhoan.setNgayTao(LocalDateTime.now());

        TaiKhoan savedTaiKhoan =
                taiKhoanRepository.save(taiKhoan);

        KhachHang khachHang = new KhachHang();

        khachHang.setTaiKhoan(savedTaiKhoan);
        khachHang.setHoTen("Khách hàng mới");

        khachHangRepository.save(khachHang);

        return savedTaiKhoan;
    }
}
