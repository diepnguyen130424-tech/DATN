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
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
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

        BigDecimal cashRevenue = BigDecimal.ZERO;
        BigDecimal transferRevenue = BigDecimal.ZERO;
        BigDecimal counterCashRevenue = BigDecimal.ZERO;
        BigDecimal counterTransferRevenue = BigDecimal.ZERO;
        BigDecimal onlineCashRevenue = BigDecimal.ZERO;
        BigDecimal onlineTransferRevenue = BigDecimal.ZERO;
        for (HoaDon invoice : revenueInvoices) {
            ThanhToan payment = paymentByInvoiceId.get(invoice.getId());
            if (payment == null || payment.getSoTien() == null) continue;
            String method = normalize(payment.getPhuongThuc());
            String channel = normalize(invoice.getLoaiHoaDon());
            BigDecimal amount = payment.getSoTien();
            boolean cash = "TIEN_MAT".equals(method) || "COD".equals(method);
            boolean electronic = "CHUYEN_KHOAN".equals(method) || "SEPAY".equals(method)
                    || "BANK_TRANSFER".equals(method) || "VNPAY".equals(method)
                    || "MOMO".equals(method);
            if (cash) {
                cashRevenue = cashRevenue.add(amount);
                if ("TAI_QUAY".equals(channel)) counterCashRevenue = counterCashRevenue.add(amount);
                else if ("ONLINE".equals(channel)) onlineCashRevenue = onlineCashRevenue.add(amount);
            } else if (electronic) {
                transferRevenue = transferRevenue.add(amount);
                if ("TAI_QUAY".equals(channel)) counterTransferRevenue = counterTransferRevenue.add(amount);
                else if ("ONLINE".equals(channel)) onlineTransferRevenue = onlineTransferRevenue.add(amount);
            }
        }
        long onlineOrderCount = filteredInvoices.stream()
                .filter(invoice -> "ONLINE".equals(normalize(invoice.getLoaiHoaDon())))
                .count();
        long counterOrderCount = filteredInvoices.stream()
                .filter(invoice -> "TAI_QUAY".equals(normalize(invoice.getLoaiHoaDon())))
                .count();

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

        Map<Long, Map<String, Object>> brandSales = new HashMap<>();
        for (ChiTietHoaDon detail : allInvoiceDetails) {
            if (detail.getHoaDon() == null || !revenueIds.contains(detail.getHoaDon().getId())) continue;
            SanPhamChiTiet variant = detail.getSanPhamChiTiet();
            if (variant == null || variant.getSanPham() == null
                    || variant.getSanPham().getThuongHieu() == null) continue;
            var brand = variant.getSanPham().getThuongHieu();
            if (brand.getId() == null) continue;
            Map<String, Object> aggregate = brandSales.computeIfAbsent(brand.getId(), ignored -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", brand.getId());
                row.put("name", brand.getTenThuongHieu());
                row.put("sold", 0L);
                row.put("revenue", BigDecimal.ZERO);
                return row;
            });
            long quantity = detail.getSoLuong() == null ? 0L : Math.max(0, detail.getSoLuong());
            BigDecimal amount = detail.getThanhTien() == null ? BigDecimal.ZERO : detail.getThanhTien();
            aggregate.put("sold", ((Number) aggregate.get("sold")).longValue() + quantity);
            aggregate.put("revenue", ((BigDecimal) aggregate.get("revenue")).add(amount));
        }
        List<Map<String, Object>> topBrands = brandSales.values().stream()
                .sorted((a, b) -> Long.compare(
                        ((Number) b.get("sold")).longValue(),
                        ((Number) a.get("sold")).longValue()))
                .toList();

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
                .sorted((a, b) -> {
                    int byOrders = Long.compare(
                            ((Number) b.get("orderCount")).longValue(),
                            ((Number) a.get("orderCount")).longValue());
                    return byOrders != 0 ? byOrders
                            : ((BigDecimal) b.get("revenue")).compareTo((BigDecimal) a.get("revenue"));
                })
                .limit(5)
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("productCount", sanPhamRepository.count());
        result.put("customerCount", khachHangRepository.count());
        result.put("orderCount", filteredInvoices.size());
        result.put("totalRevenue", totalRevenue);
        result.put("cashRevenue", cashRevenue);
        result.put("transferRevenue", transferRevenue);
        result.put("counterCashRevenue", counterCashRevenue);
        result.put("counterTransferRevenue", counterTransferRevenue);
        result.put("onlineCashRevenue", onlineCashRevenue);
        result.put("onlineTransferRevenue", onlineTransferRevenue);
        result.put("onlineOrderCount", onlineOrderCount);
        result.put("counterOrderCount", counterOrderCount);
        result.put("topBrands", topBrands);
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


    /**
     * Dữ liệu dành riêng cho Excel: chỉ truy vấn hóa đơn trong khoảng lọc,
     * thanh toán và chi tiết thuộc các hóa đơn đó. Không tải toàn bộ dashboard,
     * sản phẩm, tồn kho hoặc khách hàng.
     */
    private Map<String, Object> getOverviewExportData(
            LocalDate from,
            LocalDate to,
            String status,
            String orderType,
            String paymentMethod
    ) {
        LocalDateTime start = from == null ? null : from.atStartOfDay();
        LocalDateTime end = to == null ? null : to.plusDays(1).atStartOfDay();

        List<HoaDon> invoices = hoaDonRepository.findForDashboardExport(
                start, end, normalize(status), normalize(orderType), normalize(paymentMethod)
        );

        List<Long> invoiceIds = invoices.stream()
                .map(HoaDon::getId)
                .filter(Objects::nonNull)
                .toList();

        Map<Long, ThanhToan> paymentByInvoiceId = invoiceIds.isEmpty()
                ? Collections.emptyMap()
                : thanhToanRepository.findByHoaDon_IdIn(invoiceIds).stream()
                .filter(p -> p.getHoaDon() != null && p.getHoaDon().getId() != null)
                .collect(Collectors.toMap(
                        p -> p.getHoaDon().getId(), p -> p, (first, ignored) -> first
                ));

        List<HoaDon> revenueInvoices = invoices.stream()
                .filter(this::isRevenueInvoice)
                .toList();

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal cashRevenue = BigDecimal.ZERO;
        BigDecimal transferRevenue = BigDecimal.ZERO;
        BigDecimal counterCashRevenue = BigDecimal.ZERO;
        BigDecimal counterTransferRevenue = BigDecimal.ZERO;
        BigDecimal onlineCashRevenue = BigDecimal.ZERO;
        BigDecimal onlineTransferRevenue = BigDecimal.ZERO;

        for (HoaDon invoice : revenueInvoices) {
            totalRevenue = totalRevenue.add(
                    invoice.getTongThanhToan() == null ? BigDecimal.ZERO : invoice.getTongThanhToan()
            );
            ThanhToan payment = paymentByInvoiceId.get(invoice.getId());
            if (payment == null || payment.getSoTien() == null) continue;

            String method = normalize(payment.getPhuongThuc());
            String channel = normalize(invoice.getLoaiHoaDon());
            BigDecimal amount = payment.getSoTien();
            boolean cash = "TIEN_MAT".equals(method) || "COD".equals(method);
            boolean electronic = "CHUYEN_KHOAN".equals(method) || "SEPAY".equals(method)
                    || "BANK_TRANSFER".equals(method) || "VNPAY".equals(method)
                    || "MOMO".equals(method);

            if (cash) {
                cashRevenue = cashRevenue.add(amount);
                if ("TAI_QUAY".equals(channel)) counterCashRevenue = counterCashRevenue.add(amount);
                else if ("ONLINE".equals(channel)) onlineCashRevenue = onlineCashRevenue.add(amount);
            } else if (electronic) {
                transferRevenue = transferRevenue.add(amount);
                if ("TAI_QUAY".equals(channel)) counterTransferRevenue = counterTransferRevenue.add(amount);
                else if ("ONLINE".equals(channel)) onlineTransferRevenue = onlineTransferRevenue.add(amount);
            }
        }

        Map<Long, Map<String, Object>> brandSales = new HashMap<>();
        if (!revenueInvoices.isEmpty()) {
            Set<Long> revenueIds = revenueInvoices.stream().map(HoaDon::getId)
                    .filter(Objects::nonNull).collect(Collectors.toSet());
            List<ChiTietHoaDon> details = chiTietHoaDonRepository.findByHoaDon_IdIn(
                    revenueIds.stream().toList()
            );
            for (ChiTietHoaDon detail : details) {
                if (detail.getHoaDon() == null || !revenueIds.contains(detail.getHoaDon().getId())) continue;
                SanPhamChiTiet variant = detail.getSanPhamChiTiet();
                if (variant == null || variant.getSanPham() == null
                        || variant.getSanPham().getThuongHieu() == null) continue;
                var brand = variant.getSanPham().getThuongHieu();
                if (brand.getId() == null) continue;

                Map<String, Object> aggregate = brandSales.computeIfAbsent(brand.getId(), ignored -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", brand.getId());
                    row.put("name", brand.getTenThuongHieu());
                    row.put("sold", 0L);
                    row.put("revenue", BigDecimal.ZERO);
                    return row;
                });
                long quantity = detail.getSoLuong() == null ? 0L : Math.max(0, detail.getSoLuong());
                BigDecimal amount = detail.getThanhTien() == null ? BigDecimal.ZERO : detail.getThanhTien();
                aggregate.put("sold", ((Number) aggregate.get("sold")).longValue() + quantity);
                aggregate.put("revenue", ((BigDecimal) aggregate.get("revenue")).add(amount));
            }
        }

        List<Map<String, Object>> topBrands = brandSales.values().stream()
                .sorted((a, b) -> Long.compare(
                        ((Number) b.get("sold")).longValue(), ((Number) a.get("sold")).longValue()))
                .toList();

        Map<String, Map<String, Object>> customerAggregates = new HashMap<>();
        for (HoaDon invoice : revenueInvoices) {
            String customerKey;
            String customerName;
            if (invoice.getKhachHang() != null && invoice.getKhachHang().getId() != null) {
                customerKey = "ONLINE-" + invoice.getKhachHang().getId();
                customerName = invoice.getKhachHang().getHoTen();
            } else if (invoice.getKhachHangQuay() != null && invoice.getKhachHangQuay().getId() != null) {
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
                Map<String, Object> row = new HashMap<>();
                row.put("name", customerName);
                row.put("orderCount", 0L);
                row.put("revenue", BigDecimal.ZERO);
                return row;
            });
            aggregate.put("orderCount", ((Number) aggregate.get("orderCount")).longValue() + 1);
            aggregate.put("revenue", ((BigDecimal) aggregate.get("revenue")).add(
                    invoice.getTongThanhToan() == null ? BigDecimal.ZERO : invoice.getTongThanhToan()
            ));
        }

        List<Map<String, Object>> topCustomers = customerAggregates.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("name", entry.getValue().get("name"));
                    row.put("orderCount", entry.getValue().get("orderCount"));
                    row.put("revenue", entry.getValue().get("revenue"));
                    return row;
                })
                .sorted((a, b) -> {
                    int byOrders = Long.compare(
                            ((Number) b.get("orderCount")).longValue(),
                            ((Number) a.get("orderCount")).longValue());
                    return byOrders != 0 ? byOrders
                            : ((BigDecimal) b.get("revenue")).compareTo((BigDecimal) a.get("revenue"));
                })
                .limit(5)
                .toList();

        long onlineOrderCount = invoices.stream()
                .filter(h -> "ONLINE".equals(normalize(h.getLoaiHoaDon()))).count();
        long counterOrderCount = invoices.stream()
                .filter(h -> "TAI_QUAY".equals(normalize(h.getLoaiHoaDon()))).count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRevenue", totalRevenue);
        result.put("cashRevenue", cashRevenue);
        result.put("transferRevenue", transferRevenue);
        result.put("counterCashRevenue", counterCashRevenue);
        result.put("counterTransferRevenue", counterTransferRevenue);
        result.put("onlineCashRevenue", onlineCashRevenue);
        result.put("onlineTransferRevenue", onlineTransferRevenue);
        result.put("onlineOrderCount", onlineOrderCount);
        result.put("counterOrderCount", counterOrderCount);
        result.put("orderCount", invoices.size());
        result.put("topBrands", topBrands);
        result.put("topCustomers", topCustomers);
        return result;
    }

    @Transactional(readOnly = true)
    public byte[] exportOverviewExcel(
            LocalDate from,
            LocalDate to,
            String status,
            String orderType,
            String paymentMethod
    ) {
        Map<String, Object> data = getOverviewExportData(from, to, status, orderType, paymentMethod);
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Tong quan");
            sheet.setColumnWidth(0, 9000);
            sheet.setColumnWidth(1, 6500);
            sheet.setColumnWidth(2, 5000);

            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleStyle.setFont(titleFont);

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            int rowIndex = 0;
            Row title = sheet.createRow(rowIndex++);
            title.createCell(0).setCellValue("BAO CAO TONG QUAN FSHOP");
            title.getCell(0).setCellStyle(titleStyle);

            Row period = sheet.createRow(rowIndex++);
            period.createCell(0).setCellValue("Tu ngay");
            period.createCell(1).setCellValue(from == null ? "Tat ca" : from.toString());
            Row period2 = sheet.createRow(rowIndex++);
            period2.createCell(0).setCellValue("Den ngay");
            period2.createCell(1).setCellValue(to == null ? "Tat ca" : to.toString());
            Row filterStatusRow = sheet.createRow(rowIndex++);
            filterStatusRow.createCell(0).setCellValue("Trang thai");
            filterStatusRow.createCell(1).setCellValue(status == null || status.isBlank() ? "Tat ca" : status);
            Row filterTypeRow = sheet.createRow(rowIndex++);
            filterTypeRow.createCell(0).setCellValue("Loai don");
            filterTypeRow.createCell(1).setCellValue(orderType == null || orderType.isBlank() ? "Tat ca" : orderType);
            Row filterPaymentRow = sheet.createRow(rowIndex++);
            filterPaymentRow.createCell(0).setCellValue("Phuong thuc thanh toan");
            filterPaymentRow.createCell(1).setCellValue(paymentMethod == null || paymentMethod.isBlank() ? "Tat ca" : paymentMethod);

            rowIndex++;
            Row summaryHeader = sheet.createRow(rowIndex++);
            summaryHeader.createCell(0).setCellValue("Chi tieu");
            summaryHeader.createCell(1).setCellValue("Gia tri");
            summaryHeader.getCell(0).setCellStyle(headerStyle);
            summaryHeader.getCell(1).setCellStyle(headerStyle);

            String[] labels = {"Tong doanh thu", "Doanh thu tien mat", "Doanh thu chuyen khoan",
                    "Tien mat tai quay", "Chuyen khoan tai quay", "Tien mat online", "Chuyen khoan online",
                    "Tong don online", "Tong don tai quay", "Tong so don"};
            String[] keys = {"totalRevenue", "cashRevenue", "transferRevenue",
                    "counterCashRevenue", "counterTransferRevenue", "onlineCashRevenue", "onlineTransferRevenue",
                    "onlineOrderCount", "counterOrderCount", "orderCount"};
            for (int i = 0; i < labels.length; i++) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(labels[i]);
                Object value = data.get(keys[i]);
                if (value instanceof Number number) row.createCell(1).setCellValue(number.doubleValue());
                else row.createCell(1).setCellValue(String.valueOf(value));
            }

            rowIndex++;
            Row brandHeader = sheet.createRow(rowIndex++);
            brandHeader.createCell(0).setCellValue("Thuong hieu");
            brandHeader.createCell(1).setCellValue("So doi da ban");
            brandHeader.createCell(2).setCellValue("Doanh thu");
            for (int i = 0; i < 3; i++) brandHeader.getCell(i).setCellStyle(headerStyle);
            Object brands = data.get("topBrands");
            if (brands instanceof List<?> list) {
                for (Object item : list) {
                    if (!(item instanceof Map<?, ?> brand)) continue;
                    Row row = sheet.createRow(rowIndex++);
                    row.createCell(0).setCellValue(String.valueOf(brand.get("name")));
                    Object sold = brand.get("sold");
                    row.createCell(1).setCellValue(sold instanceof Number n ? n.doubleValue() : 0d);
                    Object revenue = brand.get("revenue");
                    row.createCell(2).setCellValue(revenue instanceof Number n ? n.doubleValue() : 0d);
                }
            }

            rowIndex++;
            Row customerHeader = sheet.createRow(rowIndex++);
            customerHeader.createCell(0).setCellValue("Khach hang");
            customerHeader.createCell(1).setCellValue("So don");
            customerHeader.createCell(2).setCellValue("Doanh thu");
            for (int i = 0; i < 3; i++) customerHeader.getCell(i).setCellStyle(headerStyle);
            Object customers = data.get("topCustomers");
            if (customers instanceof List<?> list) {
                for (Object item : list) {
                    if (!(item instanceof Map<?, ?> customer)) continue;
                    Row row = sheet.createRow(rowIndex++);
                    row.createCell(0).setCellValue(String.valueOf(customer.get("name")));
                    Object orders = customer.get("orderCount");
                    row.createCell(1).setCellValue(orders instanceof Number n ? n.doubleValue() : 0d);
                    Object revenue = customer.get("revenue");
                    row.createCell(2).setCellValue(revenue instanceof Number n ? n.doubleValue() : 0d);
                }
            }

            workbook.write(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Không thể tạo file Excel thống kê", exception);
        }
    }

    private boolean isRevenueInvoice(HoaDon invoice) {
        String status = normalize(invoice.getTrangThai());
        return "DA_GIAO".equals(status) || "DA_THANH_TOAN".equals(status);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }
}
