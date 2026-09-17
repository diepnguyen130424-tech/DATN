package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dia_chi")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiaChi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "khach_hang_id", nullable = false)
    private KhachHang khachHang;

    @Column(name = "ten_nguoi_nhan", nullable = false)
    private String tenNguoiNhan;

    @Column(name = "so_dien_thoai", nullable = false)
    private String soDienThoai;

    @Column(name = "dia_chi", nullable = false, columnDefinition = "TEXT")
    private String diaChi;

    @Column(name = "mac_dinh", nullable = false)
    private Boolean macDinh;
}