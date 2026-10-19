package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Khách mua tại quầy (không có tài khoản đăng nhập).
 * Định danh theo số điện thoại. ID dùng CHUNG dãy số với khach_hang.id
 * (cùng sequence) nên "#12" chỉ thuộc về đúng một người.
 */
@Entity
@Table(name = "khach_hang_tai_quay")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KhachHangTaiQuay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ho_ten", length = 100)
    private String hoTen;

    @Column(name = "so_dien_thoai", nullable = false, unique = true, length = 15)
    private String soDienThoai;

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao;
}