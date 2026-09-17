package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tai_khoan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaiKhoan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_dang_nhap", nullable = false, unique = true)
    private String tenDangNhap;

    @Column(name = "mat_khau", nullable = false)
    private String matKhau;

    @Column(name = "vai_tro", nullable = false)
    private String vaiTro;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao;
}