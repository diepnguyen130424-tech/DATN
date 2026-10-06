package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_tin_nhan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatTinNhan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hoi_thoai_id", nullable = false)
    private Long hoiThoaiId;

    /** KHACH | BOT | NHAN_VIEN */
    @Column(name = "nguoi_gui", nullable = false)
    private String nguoiGui;

    @Column(name = "noi_dung", nullable = false, columnDefinition = "TEXT")
    private String noiDung;

    @Column(name = "da_doc_boi_nv", nullable = false)
    private boolean daDocBoiNv;

    @Column(name = "da_doc_boi_kh", nullable = false)
    private boolean daDocBoiKh;

    @Column(name = "ngay_gui", nullable = false)
    private LocalDateTime ngayGui;
}
