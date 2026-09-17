package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "kich_co")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KichCo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_kich_co", nullable = false, unique = true)
    private String tenKichCo;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;
}