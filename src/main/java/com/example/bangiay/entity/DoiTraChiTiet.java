package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "doi_tra_chi_tiet")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DoiTraChiTiet {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "yeu_cau_id", nullable = false)
    private DoiTraYeuCau yeuCau;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chi_tiet_hoa_don_id", nullable = false)
    private ChiTietHoaDon chiTietHoaDon;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;
}
