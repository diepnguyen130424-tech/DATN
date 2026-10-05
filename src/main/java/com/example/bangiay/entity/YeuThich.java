package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "yeu_thich",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_yeu_thich_khach_hang_san_pham",
                        columnNames = {
                                "khach_hang_id",
                                "san_pham_id"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YeuThich {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "khach_hang_id",
            nullable = false
    )
    private KhachHang khachHang;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "san_pham_id",
            nullable = false
    )
    private SanPham sanPham;
    @Column(
            name = "ngay_tao",
            nullable = false
    )
    private LocalDateTime ngayTao;
}