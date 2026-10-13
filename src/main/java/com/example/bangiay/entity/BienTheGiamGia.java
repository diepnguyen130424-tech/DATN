package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "bien_the_giam_gia",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_btgg_ctgg_spct",
                        columnNames = {"chuong_trinh_giam_gia_id", "san_pham_chi_tiet_id"}
                )
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BienTheGiamGia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chuong_trinh_giam_gia_id", nullable = false)
    private ChuongTrinhGiamGia chuongTrinhGiamGia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "san_pham_chi_tiet_id", nullable = false)
    private SanPhamChiTiet sanPhamChiTiet;
}