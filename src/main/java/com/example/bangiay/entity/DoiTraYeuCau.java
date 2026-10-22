package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "doi_tra_yeu_cau")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DoiTraYeuCau {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_yeu_cau", nullable = false, unique = true, length = 40)
    private String maYeuCau;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hoa_don_id", nullable = false)
    private HoaDon hoaDon;

    @Column(name = "loai_yeu_cau", nullable = false, length = 20)
    private String loaiYeuCau;

    @Column(name = "ly_do", nullable = false, length = 60)
    private String lyDo;

    @Column(name = "mo_ta", nullable = false, columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "phuong_thuc_hoan_tien", nullable = false, length = 40)
    private String phuongThucHoanTien;

    @Column(name = "thong_tin_hoan_tien", columnDefinition = "TEXT")
    private String thongTinHoanTien;

    @Column(name = "anh_minh_chung", columnDefinition = "TEXT")
    private String anhMinhChung;

    @Column(name = "trang_thai", nullable = false, length = 40)
    private String trangThai;

    @Column(name = "ngay_tao", nullable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    @OneToMany(mappedBy = "yeuCau", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DoiTraChiTiet> sanPhamTra = new ArrayList<>();
}
