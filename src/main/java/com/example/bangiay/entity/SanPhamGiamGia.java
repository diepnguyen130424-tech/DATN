package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "san_pham_giam_gia",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"san_pham_id", "chuong_trinh_giam_gia_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SanPhamGiamGia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "san_pham_id", nullable = false)
    private SanPham sanPham;

    @ManyToOne
    @JoinColumn(name = "chuong_trinh_giam_gia_id", nullable = false)
    private ChuongTrinhGiamGia chuongTrinhGiamGia;
}