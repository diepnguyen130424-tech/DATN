package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "thong_bao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThongBao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // null = broadcast cho tất cả khách
    @Column(name = "khach_hang_id")
    private Long khachHangId;

    // Liên kết voucher (nếu có)
    @Column(name = "voucher_id")
    private Long voucherId;

    @Column(name = "tieu_de", nullable = false, length = 200)
    private String tieuDe;

    @Column(name = "noi_dung", columnDefinition = "TEXT")
    private String noiDung;

    // SAP_HET_HAN | NGUNG_SU_DUNG | KICH_HOAT
    @Column(name = "loai", nullable = false, length = 30)
    private String loai;

    @Column(name = "da_doc", nullable = false)
    @Builder.Default
    private Boolean daDoc = false;

    @Column(name = "ngay_tao", nullable = false)
    @Builder.Default
    private LocalDateTime ngayTao = LocalDateTime.now();
}