package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "gio_hang")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GioHang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "khach_hang_id", nullable = false, unique = true)
    private KhachHang khachHang;

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;
}