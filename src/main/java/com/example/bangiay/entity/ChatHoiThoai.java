package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_hoi_thoai")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatHoiThoai {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "khach_hang_id", nullable = false, unique = true)
    private Long khachHangId;

    /** BOT: bot tự trả lời | NHAN_VIEN: đang chờ / do nhân viên xử lý */
    @Column(name = "che_do", nullable = false)
    private String cheDo;

    @Column(name = "nhan_vien_id")
    private Long nhanVienId;

    @Column(name = "tin_cuoi", length = 500)
    private String tinCuoi;

    @Column(name = "ngay_tao", nullable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat", nullable = false)
    private LocalDateTime ngayCapNhat;
}
