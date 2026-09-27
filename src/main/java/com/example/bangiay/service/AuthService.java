package com.example.bangiay.service;

import com.example.bangiay.entity.TaiKhoan;
import com.example.bangiay.repository.TaiKhoanRepository;
import com.example.bangiay.entity.KhachHang;
import com.example.bangiay.repository.KhachHangRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.example.bangiay.dto.LoginResponse;
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
                        new RuntimeException("Không tìm thấy tài khoản")
                );
    }

    public TaiKhoan getByTenDangNhap(String tenDangNhap) {
        return taiKhoanRepository
                .findByTenDangNhap(tenDangNhap)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy tài khoản")
                );
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

    public LoginResponse login(
            String tenDangNhap,
            String matKhau
    ) {

        // =========================
        // 1. Tìm tài khoản
        // =========================
        TaiKhoan taiKhoan = taiKhoanRepository
                .findByTenDangNhap(tenDangNhap)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Sai tên đăng nhập hoặc mật khẩu"
                        )
                );

        // =========================
        // 2. Kiểm tra mật khẩu
        // =========================
        if (!taiKhoan.getMatKhau().equals(matKhau)) {
            throw new RuntimeException(
                    "Sai tên đăng nhập hoặc mật khẩu"
            );
        }

        // =========================
        // 3. Kiểm tra trạng thái
        // =========================
        if (!"HOAT_DONG".equalsIgnoreCase(
                taiKhoan.getTrangThai()
        )) {
            throw new RuntimeException(
                    "Tài khoản không hoạt động"
            );
        }

        // =========================
        // 4. Lấy KhachHang
        // =========================
        Long khachHangId = null;

        if ("KHACH_HANG".equalsIgnoreCase(
                taiKhoan.getVaiTro()
        )) {

            KhachHang khachHang = khachHangRepository
                    .findByTaiKhoan_Id(taiKhoan.getId())
                    .orElse(null);

            // Nếu tài khoản chưa có KhachHang
            // thì tự động tạo
            if (khachHang == null) {

                khachHang = new KhachHang();

                khachHang.setTaiKhoan(taiKhoan);
                khachHang.setHoTen("Khách hàng mới");

                khachHang = khachHangRepository.save(khachHang);
            }

            // Lấy ID khách hàng
            khachHangId = khachHang.getId();
        }

        // =========================
        // 5. Trả thông tin đăng nhập
        // =========================
        return new LoginResponse(
                taiKhoan.getId(),
                taiKhoan.getTenDangNhap(),
                taiKhoan.getVaiTro(),
                taiKhoan.getTrangThai(),
                khachHangId
        );
    }

    public TaiKhoan register(TaiKhoan taiKhoan) {

        // =========================
        // 1. Kiểm tra username
        // =========================
        if (taiKhoanRepository.existsByTenDangNhap(
                taiKhoan.getTenDangNhap()
        )) {
            throw new RuntimeException(
                    "Tên đăng nhập đã tồn tại"
            );
        }

        // =========================
        // 2. Thiết lập tài khoản
        // =========================
        taiKhoan.setVaiTro("KHACH_HANG");
        taiKhoan.setTrangThai("HOAT_DONG");
        taiKhoan.setNgayTao(LocalDateTime.now());

        // =========================
        // 3. Lưu tài khoản
        // =========================
        TaiKhoan savedTaiKhoan =
                taiKhoanRepository.save(taiKhoan);

        // =========================
        // 4. Tạo khách hàng
        // =========================
        KhachHang khachHang = new KhachHang();

        khachHang.setTaiKhoan(savedTaiKhoan);
        khachHang.setHoTen("Khách hàng mới");

        khachHangRepository.save(khachHang);

        return savedTaiKhoan;
    }
}
