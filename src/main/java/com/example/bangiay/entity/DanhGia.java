package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Đánh giá sản phẩm của khách hàng (kiểu Shopee).
 * Mỗi dòng chi tiết hóa đơn chỉ được đánh giá 1 lần, và chỉ khi khách đã nhận hàng.
 */
@Entity
@Table(name = "danh_gia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DanhGia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "chi_tiet_hoa_don_id", nullable = false, unique = true)
    private ChiTietHoaDon chiTietHoaDon;

    @ManyToOne
    @JoinColumn(name = "san_pham_id", nullable = false)
    private SanPham sanPham;

    @ManyToOne
    @JoinColumn(name = "khach_hang_id", nullable = false)
    private KhachHang khachHang;

    @Column(name = "so_sao", nullable = false)
    private Integer soSao;

    @Column(name = "noi_dung", columnDefinition = "TEXT")
    private String noiDung;

    /** Danh sách URL ảnh, ngăn cách bằng dấu phẩy */
    @Column(name = "hinh_anh", columnDefinition = "TEXT")
    private String hinhAnh;

    @Column(name = "phan_hoi", columnDefinition = "TEXT")
    private String phanHoi;

    @Column(name = "ngay_phan_hoi")
    private LocalDateTime ngayPhanHoi;

    /** HIEN | AN */
    @Column(name = "trang_thai", nullable = false)
    private String trangThai;

    @Column(name = "ngay_tao", nullable = false)
    private LocalDateTime ngayTao;
}
