package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "nhan_vien")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NhanVien {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "tai_khoan_id", nullable = false, unique = true)
    private TaiKhoan taiKhoan;

    @Column(name = "ho_ten", nullable = false)
    private String hoTen;

    @Column(name = "so_dien_thoai")
    private String soDienThoai;

    @Column(name = "chuc_vu", nullable = false)
    private String chucVu;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;

    @Column(name = "ngay_vao_lam")
    private LocalDate ngayVaoLam;
}