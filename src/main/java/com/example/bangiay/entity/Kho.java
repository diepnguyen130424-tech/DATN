package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "kho")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Kho {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_kho", nullable = false, unique = true)
    private String maKho;

    @Column(name = "ten_kho", nullable = false)
    private String tenKho;

    @Column(name = "dia_chi")
    private String diaChi;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;

    @Column(name = "ngay_tao", nullable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat", nullable = false)
    private LocalDateTime ngayCapNhat;
}
