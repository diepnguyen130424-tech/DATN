package com.example.bangiay.service;

import com.example.bangiay.dto.RegisterRequest;
import com.example.bangiay.entity.TaiKhoan;
import com.example.bangiay.repository.TaiKhoanRepository;
import com.example.bangiay.entity.KhachHang;
import com.example.bangiay.repository.KhachHangRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.example.bangiay.dto.LoginResponse;

import java.time.LocalDate;
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

        TaiKhoan taiKhoan = taiKhoanRepository
                .findByTenDangNhap(tenDangNhap)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Sai tên đăng nhập hoặc mật khẩu"
                        )
                );

        if (!taiKhoan.getMatKhau().equals(matKhau)) {
            throw new RuntimeException(
                    "Sai tên đăng nhập hoặc mật khẩu"
            );
        }

        if (!"HOAT_DONG".equalsIgnoreCase(
                taiKhoan.getTrangThai()
        )) {
            throw new RuntimeException(
                    "Tài khoản không hoạt động"
            );
        }

        Long khachHangId = null;

        if ("KHACH_HANG".equalsIgnoreCase(
                taiKhoan.getVaiTro()
        )) {

            KhachHang khachHang = khachHangRepository
                    .findByTaiKhoan_Id(taiKhoan.getId())
                    .orElse(null);

            if (khachHang == null) {

                khachHang = new KhachHang();

                khachHang.setTaiKhoan(taiKhoan);
                khachHang.setHoTen("Khách hàng mới");

                khachHang = khachHangRepository.save(khachHang);
            }

            khachHangId = khachHang.getId();
        }

        return new LoginResponse(
                taiKhoan.getId(),
                taiKhoan.getTenDangNhap(),
                taiKhoan.getVaiTro(),
                taiKhoan.getTrangThai(),
                khachHangId
        );
    }

    @Transactional
    public TaiKhoan register(RegisterRequest request) {

        if (taiKhoanRepository.existsByTenDangNhap(
                request.getTenDangNhap()
        )) {
            throw new RuntimeException(
                    "Tên đăng nhập đã tồn tại"
            );
        }

        TaiKhoan taiKhoan = new TaiKhoan();

        taiKhoan.setTenDangNhap(
                request.getTenDangNhap().trim()
        );

        taiKhoan.setMatKhau(
                request.getMatKhau()
        );

        taiKhoan.setVaiTro("KHACH_HANG");
        taiKhoan.setTrangThai("HOAT_DONG");
        taiKhoan.setNgayTao(LocalDateTime.now());
        TaiKhoan savedTaiKhoan =
                taiKhoanRepository.save(taiKhoan);

        KhachHang khachHang = new KhachHang();

        khachHang.setTaiKhoan(savedTaiKhoan);

        khachHang.setHoTen(
                request.getHoTen()
        );

        khachHang.setSoDienThoai(
                request.getSoDienThoai()
        );

        if (request.getNgaySinh() != null
                && !request.getNgaySinh().isBlank()) {

            khachHang.setNgaySinh(
                    LocalDate.parse(request.getNgaySinh())
            );
        }

        khachHang.setGioiTinh(
                request.getGioiTinh()
        );

        khachHangRepository.save(khachHang);

        return savedTaiKhoan;
    }
}
