package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "chi_tiet_phieu_kho")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChiTietPhieuKho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phieu_kho_id", nullable = false)
    private PhieuKho phieuKho;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "san_pham_chi_tiet_id", nullable = false)
    private SanPhamChiTiet sanPhamChiTiet;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;

    @Column(name = "ton_truoc", nullable = false)
    private Integer tonTruoc;

    @Column(name = "ton_sau", nullable = false)
    private Integer tonSau;

    @Column(name = "don_gia", precision = 15, scale = 2)
    private BigDecimal donGia;

    @Column(name = "thanh_tien", precision = 15, scale = 2)
    private BigDecimal thanhTien;
}