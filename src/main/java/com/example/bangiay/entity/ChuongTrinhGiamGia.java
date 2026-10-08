package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "chuong_trinh_giam_gia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChuongTrinhGiamGia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_chuong_trinh", nullable = false)
    private String tenChuongTrinh;

    @Column(name = "loai_giam", nullable = false)
    private String loaiGiam;

    @Column(name = "gia_tri_giam", nullable = false, precision = 15, scale = 2)
    private BigDecimal giaTriGiam;

    @Column(name = "ngay_bat_dau", nullable = false)
    private LocalDateTime ngayBatDau;

    @Column(name = "ngay_ket_thuc", nullable = false)
    private LocalDateTime ngayKetThuc;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;

    // ⭐ MỚI: Thương hiệu áp dụng (null = tất cả sản phẩm)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "thuong_hieu_id")
    private ThuongHieu thuongHieu;
}