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
                        new RuntimeException("Sai tên đăng nhập hoặc mật khẩu"));

        if (!taiKhoan.getMatKhau().equals(matKhau)) {
            throw new RuntimeException("Sai tên đăng nhập hoặc mật khẩu");
        }

        if (!"HOAT_DONG".equalsIgnoreCase(taiKhoan.getTrangThai())) {
            throw new RuntimeException("Tài khoản không hoạt động");
        }

        return taiKhoan;
    }


    public TaiKhoan register(TaiKhoan taiKhoan) {

        if (taiKhoanRepository.existsByTenDangNhap(
                taiKhoan.getTenDangNhap())) {

            throw new RuntimeException("Tên đăng nhập đã tồn tại");
        }

        // Thiết lập thông tin tài khoản
        taiKhoan.setVaiTro("KHACH_HANG");
        taiKhoan.setTrangThai("HOAT_DONG");
        taiKhoan.setNgayTao(LocalDateTime.now());

        TaiKhoan savedTaiKhoan = taiKhoanRepository.save(taiKhoan);

        // Tạo khách hàng tương ứng
        KhachHang khachHang = new KhachHang();
        khachHang.setTaiKhoan(savedTaiKhoan);
        khachHang.setHoTen("Khách hàng mới");

        khachHangRepository.save(khachHang);

        return savedTaiKhoan;
    }
}
