package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lich_su_hoa_don")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LichSuHoaDon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "hoa_don_id", nullable = false)
    private HoaDon hoaDon;

    @ManyToOne
    @JoinColumn(name = "nhan_vien_id")
    private NhanVien nhanVien;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;

    @Column(name = "thoi_gian")
    private LocalDateTime thoiGian;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    /** Tên người đã thao tác (nhân viên / admin / khách hàng / hệ thống) */
    @Column(name = "nguoi_thuc_hien", length = 150)
    private String nguoiThucHien;

    /** Vai trò người thao tác: ADMIN, NHAN_VIEN, KHACH_HANG, HE_THONG */
    @Column(name = "vai_tro", length = 30)
    private String vaiTro;

    /** ID tài khoản (tai_khoan.id) đã thao tác — dùng để truy vết chính xác */
    @Column(name = "tai_khoan_id")
    private Long taiKhoanId;

    /** Tên đăng nhập của tài khoản thao tác (lưu snapshot, không đổi khi đổi tên sau này) */
    @Column(name = "ten_dang_nhap", length = 100)
    private String tenDangNhap;
}