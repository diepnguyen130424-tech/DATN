package com.example.bangiay.repository;

import com.example.bangiay.entity.HoaDon;
import com.example.bangiay.entity.ThanhToan;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;


import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

public interface HoaDonRepository extends JpaRepository<HoaDon, Long>, JpaSpecificationExecutor<HoaDon> {

    Optional<HoaDon> findByMaHoaDon(String maHoaDon);

    boolean existsByMaHoaDon(String maHoaDon);

    List<HoaDon> findByKhachHang_Id(Long khachHangId);

    List<HoaDon> findByNhanVien_Id(Long nhanVienId);

    List<HoaDon> findByTrangThai(String trangThai);

    List<HoaDon> findByLoaiHoaDon(String loaiHoaDon);

    // Hóa đơn gần nhất có cùng SĐT người mua và đã có tên (để tự điền tên)
    Optional<HoaDon> findFirstBySoDienThoaiKhachAndTenKhachIsNotNullOrderByNgayLapDesc(
            String soDienThoaiKhach);

    // Đơn đã giao nhưng khách chưa xác nhận nhận hàng, cập nhật trước mốc thời gian
    List<HoaDon> findByTrangThaiAndNgayNhanHangIsNullAndNgayCapNhatBefore(
            String trangThai, LocalDateTime mocThoiGian);

    // Kiểm tra khách đã dùng voucher này chưa
    boolean existsByKhachHang_IdAndVoucher_Id(Long khachHangId, Long voucherId);

    /**
     * EntityGraph giúp tải sẵn thông tin khách hàng cần cho báo cáo,
     * tránh truy vấn lặp khi tạo Excel.
     */
    @Override
    @EntityGraph(attributePaths = {"khachHang", "khachHangQuay"})
    List<HoaDon> findAll(Specification<HoaDon> specification, Sort sort);

    /**
     * Truy vấn động cho Excel: chỉ thêm điều kiện khi bộ lọc có giá trị.
     * Không dùng mẫu ":param IS NULL" vì PostgreSQL có thể không suy luận
     * được kiểu dữ liệu của tham số null (SQLSTATE 42P18).
     */
    default List<HoaDon> findForDashboardExport(
            LocalDateTime start,
            LocalDateTime end,
            String status,
            String orderType,
            String paymentMethod
    ) {
        final String normalizedStatus = normalizeFilter(status);
        final String normalizedOrderType = normalizeFilter(orderType);
        final String normalizedPaymentMethod = normalizeFilter(paymentMethod);

        Specification<HoaDon> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            Expression<LocalDateTime> orderDate = cb.coalesce(
                    root.<LocalDateTime>get("ngayLap"),
                    root.<LocalDateTime>get("ngayCapNhat")
            );

            if (start != null) {
                predicates.add(cb.greaterThanOrEqualTo(orderDate, start));
            }
            if (end != null) {
                predicates.add(cb.lessThan(orderDate, end));
            }
            if (normalizedStatus != null) {
                predicates.add(cb.equal(
                        cb.upper(cb.trim(root.<String>get("trangThai"))),
                        normalizedStatus
                ));
            }
            if (normalizedOrderType != null) {
                predicates.add(cb.equal(
                        cb.upper(cb.trim(root.<String>get("loaiHoaDon"))),
                        normalizedOrderType
                ));
            }
            if (normalizedPaymentMethod != null) {
                Subquery<Long> paymentQuery = query.subquery(Long.class);
                Root<ThanhToan> payment = paymentQuery.from(ThanhToan.class);
                paymentQuery.select(payment.<Long>get("id"));
                paymentQuery.where(
                        cb.equal(payment.get("hoaDon"), root),
                        cb.equal(
                                cb.upper(cb.trim(payment.<String>get("phuongThuc"))),
                                normalizedPaymentMethod
                        )
                );
                predicates.add(cb.exists(paymentQuery));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return findAll(specification, Sort.unsorted());
    }

    private static String normalizeFilter(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }
}
