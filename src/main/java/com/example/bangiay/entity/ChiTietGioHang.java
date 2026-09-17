package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "chi_tiet_gio_hang",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"gio_hang_id", "san_pham_chi_tiet_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChiTietGioHang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "gio_hang_id", nullable = false)
    private GioHang gioHang;

    @ManyToOne
    @JoinColumn(name = "san_pham_chi_tiet_id", nullable = false)
    private SanPhamChiTiet sanPhamChiTiet;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;
}