package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bien_dong_kho")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BienDongKho {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kho_id", nullable = false)
    private Kho kho;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "san_pham_chi_tiet_id", nullable = false)
    private SanPhamChiTiet sanPhamChiTiet;

    @Column(name = "loai_bien_dong", nullable = false)
    private String loaiBienDong;

    @Column(name = "so_luong_thay_doi", nullable = false)
    private Integer soLuongThayDoi;

    @Column(name = "ton_truoc", nullable = false)
    private Integer tonTruoc;

    @Column(name = "ton_sau", nullable = false)
    private Integer tonSau;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phieu_kho_id")
    private PhieuKho phieuKho;

    @Column(name = "ly_do")
    private String lyDo;

    @Column(name = "ngay_tao", nullable = false)
    private LocalDateTime ngayTao;
}
