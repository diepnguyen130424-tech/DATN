package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "thuong_hieu")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThuongHieu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_thuong_hieu", nullable = false, unique = true)
    private String tenThuongHieu;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "quoc_gia_thuong_hieu")
    private String quocGiaThuongHieu;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao;
}