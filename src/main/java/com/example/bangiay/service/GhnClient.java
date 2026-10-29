package com.example.bangiay.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Gọi API Giao Hàng Nhanh (GHN) theo mô hình địa chỉ MỚI 2 cấp (Tỉnh → Phường/Xã):
 *  - Danh mục:  GET  /v3/master-data/province/all
 *               GET  /v3/master-data/ward/all-by-province-id
 *  - Báo phí:   POST /v2/shipping-order/preview  (gửi theo TÊN + is_new_to_address=true)
 * Danh mục được cache 24h để không gọi lại mỗi lần khách đổi địa chỉ.
 */
@Component
public class GhnClient {

    private static final ParameterizedTypeReference<Map<String, Object>> MAP = new ParameterizedTypeReference<>() {};
    private static final Duration TTL = Duration.ofHours(24);

    @Value("${ghn.enabled:false}") private boolean enabled;
    @Value("${ghn.base-url:https://dev-online-gateway.ghn.vn/shiip/public-api}") private String baseUrl;
    @Value("${ghn.token:}") private String token;
    @Value("${ghn.shop-id:0}") private long shopId;

    // Kích thước / khối lượng ước tính cho 1 đôi giày (hộp)
    @Value("${ghn.weight-per-item:1000}") private int weightPerItem;   // gram
    @Value("${ghn.length:35}") private int length;                     // cm
    @Value("${ghn.width:25}") private int width;
    @Value("${ghn.height:15}") private int height;
    // Preview bắt buộc có tên/SĐT người nhận; lúc chỉ báo phí dùng giá trị giữ chỗ
    @Value("${ghn.preview-name:Khach hang}") private String previewName;
    @Value("${ghn.preview-phone:0900000000}") private String previewPhone;

    private final RestClient http;

    private volatile List<Map<String, Object>> provinces;
    private volatile Instant provincesAt = Instant.EPOCH;
    private final Map<Long, CachedWards> wards = new ConcurrentHashMap<>();
    private final Map<String, CachedQuote> quotes = new ConcurrentHashMap<>();
    private static final Duration QUOTE_TTL = Duration.ofMinutes(10);
    private record CachedQuote(Quote quote, Instant at) {}

    private record CachedWards(List<Map<String, Object>> list, Instant at) {}

    /** Kết quả báo phí. */
    public record Quote(int phi, String diaChiChuan, String duKienGiao) {}

    public GhnClient() {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(4000);
        f.setReadTimeout(8000);
        this.http = RestClient.builder().requestFactory(f).build();
    }

    public boolean isReady() {
        return enabled && token != null && !token.isBlank() && shopId > 0;
    }

    /**
     * Báo phí ship tới (tinh, xa). Trả empty nếu không khớp danh mục GHN hoặc GHN lỗi
     * — để nơi gọi tự fallback sang cách tính cũ.
     */
    @SuppressWarnings("unchecked")
    public Optional<Quote> baoPhi(String tinh, String xa, String diaChiDayDu, int soLuong) {
        if (!isReady()) return Optional.empty();
        try {
            Map<String, Object> p = GhnNames.timKhop(danhSachTinh(), tinh);
            if (p == null) {
                System.err.println("⚠️ GHN: không khớp tỉnh '" + tinh + "' với danh mục GHN");
                return Optional.empty();
            }
            long provinceId = ((Number) p.get("_id")).longValue();

            Map<String, Object> w = GhnNames.timKhop(danhSachXa(provinceId), xa);
            if (w == null) {
                System.err.println("⚠️ GHN: không khớp phường/xã '" + xa + "' trong " + p.get("name"));
                return Optional.empty();
            }

            String tenTinh = String.valueOf(p.get("name"));
            String tenXa = String.valueOf(w.get("name"));
            int sl = Math.max(1, soLuong);

            // Phí chỉ phụ thuộc tỉnh + xã + khối lượng, KHÔNG phụ thuộc số nhà/đường
            // → cache theo 3 yếu tố này để khách gõ địa chỉ cụ thể không gọi lại GHN.
            String qKey = provinceId + "|" + w.get("_id") + "|" + sl;
            CachedQuote cq = quotes.get(qKey);
            if (cq != null && Instant.now().isBefore(cq.at().plus(QUOTE_TTL))) {
                return Optional.of(cq.quote());
            }
            int tongGram = weightPerItem * sl;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name", "Giay the thao");
            item.put("quantity", sl);
            item.put("weight", weightPerItem);
            item.put("length", length);
            item.put("width", width);
            item.put("height", height);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("payment_type_id", 2);                 // người nhận trả phí (chỉ để báo giá)
            body.put("required_note", "KHONGCHOXEMHANG");
            body.put("to_name", previewName);
            body.put("to_phone", previewPhone);
            body.put("to_address", tenXa + ", " + tenTinh);   // không gửi số nhà khi chỉ báo phí
            body.put("to_ward_name", tenXa);
            body.put("to_district_name", "");               // mô hình mới không có cấp quận/huyện
            body.put("to_province_name", tenTinh);
            body.put("is_new_to_address", true);
            body.put("weight", tongGram);
            body.put("length", length);
            body.put("width", width);
            // xếp chồng các hộp theo chiều cao để ước tính thể tích
            body.put("height", height * sl);
            body.put("insurance_value", 0);
            body.put("service_type_id", tongGram >= 20000 ? 5 : 2);
            body.put("items", List.of(item));

            Map<String, Object> res = http.post()
                    .uri(baseUrl + "/v2/shipping-order/preview")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Token", token)
                    .header("ShopId", String.valueOf(shopId))
                    .body(body)
                    .retrieve()
                    .body(MAP);

            if (res == null || !(res.get("data") instanceof Map<?, ?> data)) {
                System.err.println("⚠️ GHN preview trả về không có data: " + res);
                return Optional.empty();
            }
            Object tf = data.get("total_fee");
            if (tf == null) {
                System.err.println("⚠️ GHN preview thiếu total_fee: " + res);
                return Optional.empty();
            }
            int phi = (int) Math.round(Double.parseDouble(String.valueOf(tf)));
            Object eta = data.get("expected_delivery_time");

            Quote quote = new Quote(phi, tenXa + ", " + tenTinh, eta == null ? null : String.valueOf(eta));
            quotes.put(qKey, new CachedQuote(quote, Instant.now()));
            return Optional.of(quote);
        } catch (org.springframework.web.client.RestClientResponseException e) {
            System.err.println("⚠️ GHN báo phí lỗi HTTP " + e.getStatusCode() + ": " + e.getResponseBodyAsString());
            return Optional.empty();
        } catch (Exception e) {
            System.err.println("⚠️ GHN báo phí lỗi: " + e);
            return Optional.empty();
        }
    }

    /** Kiểm tra cấu hình + kết nối GHN (không lộ token). */
    public Map<String, Object> chanDoan(String tinh, String xa) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("enabled", enabled);
        r.put("tokenSet", token != null && !token.isBlank());
        r.put("shopId", shopId);
        r.put("baseUrl", baseUrl);
        r.put("ready", isReady());
        if (!isReady()) {
            r.put("ketLuan", "GHN chưa bật: cần GHN_ENABLED=true, GHN_TOKEN, GHN_SHOP_ID (>0) và khởi động lại backend");
            return r;
        }
        try {
            List<Map<String, Object>> ps = danhSachTinh();
            r.put("soTinh", ps.size());
            Map<String, Object> p = GhnNames.timKhop(ps, tinh);
            r.put("tinhKhop", p == null ? null : p.get("name"));
            if (p != null) {
                List<Map<String, Object>> ws = danhSachXa(((Number) p.get("_id")).longValue());
                r.put("soXa", ws.size());
                Map<String, Object> w = GhnNames.timKhop(ws, xa);
                r.put("xaKhop", w == null ? null : w.get("name"));
            }
        } catch (org.springframework.web.client.RestClientResponseException e) {
            r.put("loiHttp", e.getStatusCode().value());
            r.put("loiNoiDung", e.getResponseBodyAsString());
        } catch (Exception e) {
            r.put("loi", e.toString());
        }
        return r;
    }

    // ---------------------------------------------------------
    // Danh mục tỉnh / xã (cache 24h)
    // ---------------------------------------------------------

    private List<Map<String, Object>> danhSachTinh() {
        List<Map<String, Object>> c = provinces;
        if (c != null && Instant.now().isBefore(provincesAt.plus(TTL))) return c;
        List<Map<String, Object>> fresh = layDanhMuc(baseUrl + "/v3/master-data/province/all?offset=0&limit=200");
        if (!fresh.isEmpty()) {
            provinces = fresh;
            provincesAt = Instant.now();
        }
        return fresh.isEmpty() && c != null ? c : fresh;
    }

    private List<Map<String, Object>> danhSachXa(long provinceId) {
        CachedWards c = wards.get(provinceId);
        if (c != null && Instant.now().isBefore(c.at().plus(TTL))) return c.list();
        List<Map<String, Object>> fresh = layDanhMuc(baseUrl
                + "/v3/master-data/ward/all-by-province-id?province_id=" + provinceId + "&offset=0&limit=200");
        if (!fresh.isEmpty()) wards.put(provinceId, new CachedWards(fresh, Instant.now()));
        return fresh.isEmpty() && c != null ? c.list() : fresh;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> layDanhMuc(String url) {
        Map<String, Object> res = http.get().uri(url)
                .header("Token", token)
                .header("ShopId", String.valueOf(shopId))
                .retrieve()
                .body(MAP);
        // GHN trả HTTP 200 với data=null khi id sai → coi như rỗng
        if (res == null || !(res.get("data") instanceof List<?> l)) return List.of();
        return (List<Map<String, Object>>) l;
    }
}
