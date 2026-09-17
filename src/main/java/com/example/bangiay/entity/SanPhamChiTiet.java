package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "san_pham_chi_tiet",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"san_pham_id", "kich_co_id", "mau_sac_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SanPhamChiTiet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "san_pham_id", nullable = false)
    private SanPham sanPham;

    @ManyToOne
    @JoinColumn(name = "kich_co_id", nullable = false)
    private KichCo kichCo;

    @ManyToOne
    @JoinColumn(name = "mau_sac_id", nullable = false)
    private MauSac mauSac;

    @Column(name = "ma_sku", nullable = false, unique = true)
    private String maSku;

    @Column(name = "gia_ban", nullable = false, precision = 15, scale = 2)
    private BigDecimal giaBan;

    @Column(name = "so_luong_ton", nullable = false)
    private Integer soLuongTon;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;
}