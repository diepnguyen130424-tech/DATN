
package com.example.bangiay.service;

import com.example.bangiay.entity.HoaDon;
import com.example.bangiay.entity.ThanhToan;
import com.example.bangiay.repository.HoaDonRepository;
import com.example.bangiay.repository.ThanhToanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SePayService {

    private final HoaDonRepository hoaDonRepository;
    private final ThanhToanRepository thanhToanRepository;

    @Value("${sepay.gateway.merchant-id}")
    private String merchantId;

    @Value("${sepay.gateway.secret-key}")
    private String secretKey;

    @Value("${sepay.gateway.checkout-url}")
    private String checkoutUrl;

    // Địa chỉ frontend FShop
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    // Thứ tự trường ký theo cấu hình hiện tại
    private static final List<String> SIGNED_FIELDS = List.of(
            "order_amount",
            "merchant",
            "currency",
            "operation",
            "order_description",
            "order_invoice_number",
            "customer_id",
            "payment_method",
            "success_url",
            "error_url",
            "cancel_url"
    );

    public Map<String, String> taoCheckout(Long hoaDonId) {

        // 1. Kiểm tra ID hóa đơn
        if (hoaDonId == null) {
            throw new RuntimeException("ID hóa đơn không hợp lệ");
        }

        // 2. Kiểm tra cấu hình SePay
        if (merchantId == null || merchantId.isBlank()
                || secretKey == null || secretKey.isBlank()
                || checkoutUrl == null || checkoutUrl.isBlank()) {
            throw new RuntimeException(
                    "Chưa cấu hình đầy đủ thông tin SePay"
            );
        }

        // 3. Tìm hóa đơn
        HoaDon hoaDon = hoaDonRepository.findById(hoaDonId)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy hóa đơn"));

        // 4. Chỉ hỗ trợ hóa đơn online
        if (!"ONLINE".equalsIgnoreCase(hoaDon.getLoaiHoaDon())) {
            throw new RuntimeException(
                    "Chỉ hỗ trợ thanh toán hóa đơn online"
            );
        }

        // 5. Lấy bản ghi thanh toán chuyển khoản
        ThanhToan thanhToan = thanhToanRepository
                .findByHoaDon_Id(hoaDonId)
                .stream()
                .filter(tt -> "CHUYEN_KHOAN".equalsIgnoreCase(
                        tt.getPhuongThuc()
                ))
                .findFirst()
                .orElseThrow(() ->
                        new RuntimeException(
                                "Hóa đơn chưa có thông tin thanh toán chuyển khoản"
                        ));

        // 6. Kiểm tra trạng thái thanh toán
        if ("DA_THANH_TOAN".equalsIgnoreCase(
                thanhToan.getTrangThai())) {
            throw new RuntimeException(
                    "Hóa đơn đã được thanh toán"
            );
        }

        // 7. Kiểm tra thông tin hóa đơn
        if (hoaDon.getMaHoaDon() == null
                || hoaDon.getMaHoaDon().isBlank()) {
            throw new RuntimeException(
                    "Mã hóa đơn không hợp lệ"
            );
        }

        // 8. Lấy số tiền từ bản ghi thanh toán
        BigDecimal tongTien = thanhToan.getSoTien();

        if (tongTien == null || tongTien.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException(
                    "Số tiền thanh toán không hợp lệ"
            );
        }

        // VND không được có phần thập phân
        if (tongTien.stripTrailingZeros().scale() > 0) {
            throw new RuntimeException(
                    "Số tiền thanh toán VND không hợp lệ"
            );
        }

        String soTien = tongTien
                .setScale(0, RoundingMode.UNNECESSARY)
                .toPlainString();

        // 9. Chuẩn hóa địa chỉ frontend
        if (frontendUrl == null || frontendUrl.isBlank()) {
            throw new RuntimeException(
                    "Chưa cấu hình địa chỉ frontend"
            );
        }

        String baseUrl = frontendUrl.replaceAll("/+$", "");

        if (!baseUrl.startsWith("https://")
                && !baseUrl.startsWith("http://")) {
            throw new RuntimeException(
                    "Địa chỉ frontend không hợp lệ"
            );
        }

        // 10. Tạo các trường gửi sang SePay
        Map<String, String> fields = new LinkedHashMap<>();

        fields.put("order_amount", soTien);
        fields.put("merchant", merchantId);
        fields.put("currency", "VND");
        fields.put("operation", "PURCHASE");

        fields.put(
                "order_description",
                "Thanh toan don hang " + hoaDon.getMaHoaDon()
        );

        fields.put(
                "order_invoice_number",
                hoaDon.getMaHoaDon()
        );

        // Đường dẫn quay về FShop sau khi SePay xử lý
        fields.put(
                "success_url",
                baseUrl + "/?sepay=success&hoaDonId=" + hoaDonId
        );

        fields.put(
                "error_url",
                baseUrl + "/?sepay=error&hoaDonId=" + hoaDonId
        );

        fields.put(
                "cancel_url",
                baseUrl + "/?sepay=cancel&hoaDonId=" + hoaDonId
        );

        // 11. Tạo chữ ký
        String signature = taoChuKy(fields);

        fields.put("signature", signature);

        // 12. Trả dữ liệu checkout cho React
        Map<String, String> result = new LinkedHashMap<>();

        result.put("checkoutUrl", checkoutUrl);
        result.putAll(fields);

        return result;
    }

    private String taoChuKy(Map<String, String> fields) {

        try {
            StringBuilder chuoiKy = new StringBuilder();

            for (String field : SIGNED_FIELDS) {

                String value = fields.get(field);

                if (value == null) {
                    continue;
                }

                if (chuoiKy.length() > 0) {
                    chuoiKy.append(",");
                }

                chuoiKy.append(field)
                        .append("=")
                        .append(value);
            }

            Mac mac = Mac.getInstance("HmacSHA256");

            SecretKeySpec keySpec = new SecretKeySpec(
                    secretKey.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );

            mac.init(keySpec);

            byte[] signatureBytes = mac.doFinal(
                    chuoiKy.toString()
                            .getBytes(StandardCharsets.UTF_8)
            );

            return Base64.getEncoder()
                    .encodeToString(signatureBytes);

        } catch (Exception e) {
            throw new RuntimeException(
                    "Không thể tạo chữ ký SePay",
                    e
            );
        }
    }
}
