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

    @Column(name = "ten_danh_muc", nullable = false, unique = true)
    private String tenDanhMuc;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao;
}