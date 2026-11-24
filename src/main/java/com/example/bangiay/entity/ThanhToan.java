
package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "thanh_toan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThanhToan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hoa_don_id", nullable = false)
    private HoaDon hoaDon;

    @Column(name = "phuong_thuc", nullable = false)
    private String phuongThuc;

    @Column(name = "so_tien", nullable = false, precision = 15, scale = 2)
    private BigDecimal soTien;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;

    @Column(name = "ma_giao_dich")
    private String maGiaoDich;

    @Column(name = "ngay_thanh_toan")
    private LocalDateTime ngayThanhToan;
}
