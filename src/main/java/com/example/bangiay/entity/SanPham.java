package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "san_pham")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SanPham {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "danh_muc_id", nullable = false)
    private DanhMuc danhMuc;

    @ManyToOne
    @JoinColumn(name = "thuong_hieu_id", nullable = false)
    private ThuongHieu thuongHieu;

    @Column(name = "ma_san_pham", nullable = false, unique = true)
    private String maSanPham;

    @Column(name = "ten_san_pham", nullable = false)
    private String tenSanPham;

    @Column(name = "chat_lieu")
    private String chatLieu;

    @Column(name = "kieu_dang")
    private String kieuDang;

    @Column(name = "xuat_xu")
    private String xuatXu;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "hinh_anh")
    private String hinhAnh;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao;
}