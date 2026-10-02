package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "danh_muc")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DanhMuc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã tự sinh dạng DM001, DM002... */
    @Column(name = "ma_danh_muc", nullable = false, unique = true, length = 20)
    private String maDanhMuc;

    @Column(name = "ten_danh_muc", nullable = false, unique = true)
    private String tenDanhMuc;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    /** Đường dẫn/URL ảnh (logo thương hiệu, ảnh danh mục) */
    @Column(name = "hinh_anh", columnDefinition = "TEXT")
    private String hinhAnh;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao;
}