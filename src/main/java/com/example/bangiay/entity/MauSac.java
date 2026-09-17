package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mau_sac")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MauSac {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_mau", nullable = false, unique = true)
    private String tenMau;

    @Column(name = "ma_mau")
    private String maMau;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;
}