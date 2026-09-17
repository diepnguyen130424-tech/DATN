package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "chi_tiet_hoa_don",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"hoa_don_id", "san_pham_chi_tiet_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChiTietHoaDon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "hoa_don_id", nullable = false)
    private HoaDon hoaDon;

    @ManyToOne
    @JoinColumn(name = "san_pham_chi_tiet_id", nullable = false)
    private SanPhamChiTiet sanPhamChiTiet;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;

    @Column(name = "don_gia", nullable = false, precision = 15, scale = 2)
    private BigDecimal donGia;

    @Column(name = "thanh_tien", nullable = false, precision = 15, scale = 2)
    private BigDecimal thanhTien;
}