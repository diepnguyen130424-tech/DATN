package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "ton_kho",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"kho_id", "san_pham_chi_tiet_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TonKho {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kho_id", nullable = false)
    private Kho kho;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "san_pham_chi_tiet_id", nullable = false)
    private SanPhamChiTiet sanPhamChiTiet;

    @Column(name = "so_luong_ton", nullable = false)
    private Integer soLuongTon;

    @Column(name = "so_luong_dat", nullable = false)
    private Integer soLuongDat;

    @Column(name = "so_luong_kha_dung", nullable = false)
    private Integer soLuongKhaDung;

    @Column(name = "muc_ton_toi_thieu", nullable = false)
    private Integer mucTonToiThieu;

    @Column(name = "muc_ton_toi_da", nullable = false)
    private Integer mucTonToiDa;

    @Column(name = "ngay_cap_nhat", nullable = false)
    private LocalDateTime ngayCapNhat;
}
