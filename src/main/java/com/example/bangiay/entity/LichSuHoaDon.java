package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lich_su_hoa_don")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LichSuHoaDon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "hoa_don_id", nullable = false)
    private HoaDon hoaDon;

    @ManyToOne
    @JoinColumn(name = "nhan_vien_id")
    private NhanVien nhanVien;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;

    @Column(name = "thoi_gian")
    private LocalDateTime thoiGian;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;
}