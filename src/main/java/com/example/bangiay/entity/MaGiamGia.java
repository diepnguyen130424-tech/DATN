package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ma_giam_gia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaGiamGia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_voucher", nullable = false, unique = true)
    private String maVoucher;

    @Column(name = "ten_voucher", nullable = false)
    private String tenVoucher;

    @Column(name = "loai_giam", nullable = false)
    private String loaiGiam;

    @Column(name = "gia_tri_giam", nullable = false, precision = 15, scale = 2)
    private BigDecimal giaTriGiam;

    @Column(name = "giam_toi_da", precision = 15, scale = 2)
    private BigDecimal giamToiDa;

    @Column(name = "don_toi_thieu", precision = 15, scale = 2)
    private BigDecimal donToiThieu;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;

    @Column(name = "so_luong_da_dung")
    private Integer soLuongDaDung;

    @Column(name = "ngay_bat_dau")
    private LocalDateTime ngayBatDau;

    @Column(name = "ngay_ket_thuc")
    private LocalDateTime ngayKetThuc;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;
}