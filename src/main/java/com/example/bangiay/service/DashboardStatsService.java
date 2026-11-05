package com.example.bangiay.service;

import com.example.bangiay.entity.ChiTietHoaDon;
import com.example.bangiay.entity.HoaDon;
import com.example.bangiay.entity.SanPhamChiTiet;
import com.example.bangiay.entity.ThanhToan;
import com.example.bangiay.repository.ChiTietHoaDonRepository;
import com.example.bangiay.repository.HoaDonRepository;
import com.example.bangiay.repository.KhachHangRepository;
import com.example.bangiay.repository.SanPhamChiTietRepository;
import com.example.bangiay.repository.SanPhamRepository;
import com.example.bangiay.repository.ThanhToanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardStatsService {

    private final HoaDonRepository hoaDonRepository;
    private final ChiTietHoaDonRepository chiTietHoaDonRepository;
    private final ThanhToanRepository thanhToanRepository;
    private final SanPhamRepository sanPhamRepository;
    private final SanPhamChiTietRepository sanPhamChiTietRepository;
    private final KhachHangRepository khachHangRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getOverview(
            LocalDate from,
            LocalDate to,
            String status,
            String orderType,
            String paymentMethod
    ) {
        LocalDateTime start = from == null ? null : from.atStartOfDay();
        LocalDateTime end = to == null ? null : to.plusDays(1).atStartOfDay();

        List<HoaDon> allInvoices = hoaDonRepository.findAll();
        List<ThanhToan> allPayments = thanhToanRepository.findAll();

        Map<Long, ThanhToan> paymentByInvoiceId = allPayments.stream()
                .filter(p -> p.getHoaDon() != null && p.getHoaDon().getId() != null)
                .collect(Collectors.toMap(
                        p -> p.getHoaDon().getId(),
                        p -> p,
                        (first, ignored) -> first
                ));

        String normalizedStatus = normalize(status);
        String normalizedType = normalize(orderType);
        String normalizedPayment = normalize(paymentMethod);

        List<HoaDon> filteredInvoices = allInvoices.stream()
                .filter(invoice -> {
                    LocalDateTime date = invoice.getNgayLap();
                    if (date == null) date = invoice.getNgayCapNhat();
                    if (start != null && (date == null || date.isBefore(start))) return false;
                    if (end != null && (date == null || !date.isBefore(end))) return false;

                    if (!normalizedStatus.isEmpty()
                            && !normalizedStatus.equals(normalize(invoice.getTrangThai()))) return false;

                    if (!normalizedType.isEmpty()
                            && !normalizedType.equals(normalize(invoice.getLoaiHoaDon()))) return false;

                    if (!normalizedPayment.isEmpty()) {
                        ThanhToan payment = paymentByInvoiceId.get(invoice.getId());
                        if (payment == null
                                || !normalizedPayment.equals(normalize(payment.getPhuongThuc()))) return false;
                    }
                    return true;
                })
                .sorted(Comparator.comparing(
                        (HoaDon invoice) -> invoice.getNgayLap() != null
                                ? invoice.getNgayLap()
                                : Optional.ofNullable(invoice.getNgayCapNhat()).orElse(LocalDateTime.MIN)
                ).reversed())
                .toList();

        List<HoaDon> revenueInvoices = filteredInvoices.stream()
                .filter(this::isRevenueInvoice)
                .toList();
        Set<Long> revenueIds = revenueInvoices.stream()
                .map(HoaDon::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        BigDecimal totalRevenue = revenueInvoices.stream()
                .map(invoice -> invoice.getTongThanhToan() == null
                        ? BigDecimal.ZERO : invoice.getTongThanhToan())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> statusCounts = new LinkedHashMap<>();
        for (String key : List.of(
                "CHO_XAC_NHAN", "DA_XAC_NHAN", "DANG_CHUAN_BI",
                "DANG_GIAO", "DA_GIAO", "DA_THANH_TOAN", "DA_HUY"
        )) {
            statusCounts.put(key, filteredInvoices.stream()
                    .filter(invoice -> key.equals(normalize(invoice.getTrangThai())))
                    .count());
        }

        Map<LocalDate, BigDecimal> revenueByDate = new TreeMap<>();
        for (HoaDon invoice : revenueInvoices) {
            LocalDateTime dateTime = invoice.getNgayLap() != null
                    ? invoice.getNgayLap() : invoice.getNgayCapNhat();
            if (dateTime == null) continue;
            LocalDate date = dateTime.toLocalDate();
            revenueByDate.merge(
                    date,
                    invoice.getTongThanhToan() == null ? BigDecimal.ZERO : invoice.getTongThanhToan(),
                    BigDecimal::add
            );
        }

        Map<Long, Map<String, Object>> productSales = new HashMap<>();
        List<ChiTietHoaDon> allInvoiceDetails = chiTietHoaDonRepository.findAll();
        for (ChiTietHoaDon detail : allInvoiceDetails) {
            if (detail.getHoaDon() == null || !revenueIds.contains(detail.getHoaDon().getId())) continue;
            if (detail.getSanPhamChiTiet() == null
                    || detail.getSanPhamChiTiet().getSanPham() == null) continue;

            Long productId = detail.getSanPhamChiTiet().getSanPham().getId();
            if (productId == null) continue;

            Map<String, Object> aggregate = productSales.computeIfAbsent(productId, ignored -> {
                Map<String, Object> value = new HashMap<>();
                value.put("sold", 0L);
                value.put("revenue", BigDecimal.ZERO);
                return value;
            });

            long quantity = detail.getSoLuong() == null ? 0L : Math.max(0, detail.getSoLuong());
            BigDecimal amount = detail.getThanhTien() == null ? BigDecimal.ZERO : detail.getThanhTien();
            aggregate.put("sold", ((Number) aggregate.get("sold")).longValue() + quantity);
            aggregate.put("revenue", ((BigDecimal) aggregate.get("revenue")).add(amount));
        }

        Map<Long, Long> inventory = new HashMap<>();
        for (SanPhamChiTiet variant : sanPhamChiTietRepository.findAll()) {
            if (variant.getSanPham() == null || variant.getSanPham().getId() == null) continue;
            long quantity = variant.getSoLuongTon() == null ? 0L : Math.max(0, variant.getSoLuongTon());
            inventory.merge(variant.getSanPham().getId(), quantity, Long::sum);
        }

        List<Map<String, Object>> products = sanPhamRepository.findAll().stream()
                .map(product -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    Long id = product.getId();
                    Map<String, Object> sales = productSales.getOrDefault(id, Map.of());
                    row.put("id", id);
                    row.put("code", product.getMaSanPham());
                    row.put("name", product.getTenSanPham());
                    row.put("stock", inventory.getOrDefault(id, 0L));
                    row.put("sold", sales.getOrDefault("sold", 0L));
                    row.put("revenue", sales.getOrDefault("revenue", BigDecimal.ZERO));
                    return row;
                })
                .toList();

        List<Map<String, Object>> recentOrders = filteredInvoices.stream()
                .limit(8)
                .map(invoice -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", invoice.getId());
                    row.put("maHoaDon", invoice.getMaHoaDon());
                    row.put("tenKhachHang", invoice.getKhachHang() != null
                            ? invoice.getKhachHang().getHoTen()
                            : invoice.getTenKhach());
                    row.put("tenNguoiNhan", invoice.getDiaChi() != null
                            ? invoice.getDiaChi().getTenNguoiNhan() : null);
                    row.put("tongThanhToan", invoice.getTongThanhToan());
                    row.put("trangThai", invoice.getTrangThai());
                    row.put("loaiHoaDon", invoice.getLoaiHoaDon());
                    row.put("ngayLap", invoice.getNgayLap());
                    ThanhToan payment = paymentByInvoiceId.get(invoice.getId());
                    row.put("phuongThucThanhToan", payment == null ? null : payment.getPhuongThuc());
                    return row;
                })
                .toList();

        Map<String, Map<String, Object>> customerAggregates = new HashMap<>();
        for (HoaDon invoice : revenueInvoices) {
            String customerKey;
            String customerName;

            if (invoice.getKhachHang() != null && invoice.getKhachHang().getId() != null) {
                customerKey = "ONLINE-" + invoice.getKhachHang().getId();
                customerName = invoice.getKhachHang().getHoTen();
            } else if (invoice.getKhachHangQuay() != null
                    && invoice.getKhachHangQuay().getId() != null) {
                customerKey = "COUNTER-" + invoice.getKhachHangQuay().getId();
                customerName = invoice.getKhachHangQuay().getHoTen();
            } else {
                String phone = invoice.getSoDienThoaiKhach();
                customerKey = phone == null || phone.isBlank()
                        ? "GUEST-" + Objects.toString(invoice.getTenKhach(), "Khách lẻ")
                        : "GUEST-" + phone.trim();
                customerName = invoice.getTenKhach() == null || invoice.getTenKhach().isBlank()
                        ? "Khách lẻ" : invoice.getTenKhach();
            }

            Map<String, Object> aggregate = customerAggregates.computeIfAbsent(customerKey, ignored -> {
                Map<String, Object> value = new HashMap<>();
                value.put("orderCount", 0L);
                value.put("revenue", BigDecimal.ZERO);
                value.put("name", customerName);
                return value;
            });
            aggregate.put("orderCount", ((Number) aggregate.get("orderCount")).longValue() + 1);
            aggregate.put("revenue", ((BigDecimal) aggregate.get("revenue")).add(
                    invoice.getTongThanhToan() == null ? BigDecimal.ZERO : invoice.getTongThanhToan()
            ));
        }

        List<Map<String, Object>> topCustomers = customerAggregates.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", entry.getKey());
                    row.put("name", entry.getValue().get("name"));
                    row.put("orderCount", entry.getValue().get("orderCount"));
                    row.put("revenue", entry.getValue().get("revenue"));
                    return row;
                })
                .sorted((a, b) -> ((BigDecimal) b.get("revenue")).compareTo((BigDecimal) a.get("revenue")))
                .limit(5)
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("productCount", sanPhamRepository.count());
        result.put("customerCount", khachHangRepository.count());
        result.put("orderCount", filteredInvoices.size());
        result.put("totalRevenue", totalRevenue);
        result.put("statusCounts", statusCounts);
        result.put("revenueByDate", revenueByDate.entrySet().stream().map(entry -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", entry.getKey().toString());
            row.put("revenue", entry.getValue());
            return row;
        }).toList());
        result.put("products", products);
        result.put("recentOrders", recentOrders);
        result.put("topCustomers", topCustomers);
        result.put("revenueOrderCount", revenueInvoices.size());
        return result;
    }

    private boolean isRevenueInvoice(HoaDon invoice) {
        String status = normalize(invoice.getTrangThai());
        return "DA_GIAO".equals(status) || "DA_THANH_TOAN".equals(status);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }
}
