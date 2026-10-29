package com.example.bangiay.service;

import com.example.bangiay.dto.ShipQuote;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tính phí ship theo khoảng cách từ cửa hàng đến địa chỉ nhận hàng.
 *  1. Geocode địa chỉ  -> OpenStreetMap Nominatim (miễn phí, không cần API key)
 *  2. Khoảng cách đường bộ -> OSRM (miễn phí); lỗi thì dùng đường chim bay x hệ số
 *  3. Phí = phí cơ bản (trong N km đầu) + số km vượt x đơn giá/km, làm tròn 1.000đ, có trần
 */
@Service
public class ShippingService {

    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_OF_MAP =
            new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<Map<String, Object>> MAP =
            new ParameterizedTypeReference<>() {};

    @Value("${shop.lat}") private double shopLat;
    @Value("${shop.lng}") private double shopLng;
    @Value("${ship.phi-co-ban:15000}") private int phiCoBan;
    @Value("${ship.km-co-ban:3}") private double kmCoBan;
    @Value("${ship.phi-moi-km:5000}") private int phiMoiKm;
    @Value("${ship.phi-toi-da:150000}") private int phiToiDa;
    @Value("${ship.phi-mac-dinh:30000}") private int phiMacDinh;
    @Value("${ship.he-so-duong-chim-bay:1.3}") private double heSoDuongChimBay;

    private final RestClient http;
    private final GhnClient ghn;
    private final Map<String, ShipQuote> cache = new ConcurrentHashMap<>();

    public ShippingService(GhnClient ghn) {
        this.ghn = ghn;
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(4000);
        f.setReadTimeout(6000);
        this.http = RestClient.builder()
                .requestFactory(f)
                // Nominatim bắt buộc phải có User-Agent định danh ứng dụng
                .defaultHeader("User-Agent", "fshop-bangiay/1.0 (graduation project)")
                .build();
    }

    public ShipQuote tinhPhi(String diaChi) {
        return tinhPhi(diaChi, 1);
    }

    /**
     * Ưu tiên báo phí của Giao Hàng Nhanh (khi ghn.enabled=true và địa chỉ khớp danh mục GHN);
     * nếu không được thì dùng cách cũ (OSM + OSRM theo km) để đặt hàng không bị chặn.
     */
    public ShipQuote tinhPhi(String diaChi, int soLuong) {
        return tinhPhi(diaChi, soLuong, null, null);
    }

    /** tinh/xa (nếu có) được ưu tiên hơn việc tách từ chuỗi địa chỉ. */
    public ShipQuote tinhPhi(String diaChi, int soLuong, String tinhIn, String xaIn) {
        if (diaChi == null || diaChi.isBlank()) {
            return macDinh("Chưa nhập địa chỉ nhận hàng.");
        }
        if (ghn.isReady()) {
            // Địa chỉ FE ghép theo dạng: "số nhà..., Phường/Xã, Tỉnh/Thành phố"
            String[] p = diaChi.split(",");
            boolean coTinhXa = tinhIn != null && !tinhIn.isBlank() && xaIn != null && !xaIn.isBlank();
            if (coTinhXa || p.length >= 2) {
                String tinh = coTinhXa ? tinhIn.trim() : p[p.length - 1].trim();
                String xa = coTinhXa ? xaIn.trim() : p[p.length - 2].trim();
                var q = ghn.baoPhi(tinh, xa, diaChi.trim(), soLuong);
                if (q.isPresent()) {
                    return new ShipQuote(true, null, q.get().phi(), "GHN", q.get().diaChiChuan(),
                            "Phí theo bảng giá Giao Hàng Nhanh");
                }
            }
        }
        String key = diaChi.trim().toLowerCase().replaceAll("\\s+", " ");
        ShipQuote cached = cache.get(key);
        if (cached != null) return cached;

        ShipQuote quote;
        try {
            double[] toaDo = new double[2];
            String tenTimThay = geocode(diaChi.trim(), toaDo);
            if (tenTimThay == null) {
                return macDinh("Không định vị được địa chỉ, tạm tính phí mặc định.");
            }
            double km;
            String nguon = "OSRM";
            Double road = duongBo(toaDo[0], toaDo[1]);
            if (road != null) {
                km = road;
            } else {
                km = haversine(shopLat, shopLng, toaDo[0], toaDo[1]) * heSoDuongChimBay;
                nguon = "UOC_TINH";
            }
            km = Math.round(km * 10) / 10.0;
            quote = new ShipQuote(true, km, phiTheoKm(km), nguon, tenTimThay, null);
        } catch (Exception e) {
            System.err.println("⚠️ Tính phí ship lỗi: " + e.getMessage());
            return macDinh("Không tính được khoảng cách, tạm tính phí mặc định.");
        }
        cache.put(key, quote); // chỉ cache kết quả thành công
        return quote;
    }

    /** Phí theo bậc thang km — chỉnh trong application.properties (ship.*) */
    public int phiTheoKm(double km) {
        double vuot = Math.max(0, km - kmCoBan);
        long phi = phiCoBan + (long) Math.ceil(vuot) * phiMoiKm;
        phi = Math.round(phi / 1000.0) * 1000;
        return (int) Math.min(phi, phiToiDa);
    }

    // ---------------------------------------------------------

    private ShipQuote macDinh(String msg) {
        return new ShipQuote(false, null, phiMacDinh, "MAC_DINH", null, msg);
    }

    /**
     * Nominatim khó khớp số nhà chi tiết, nên thử lần lượt: đầy đủ -> bỏ dần phần đầu
     * (số nhà, ngõ...) tối đa 3 lần. Trả về tên địa điểm tìm thấy và điền toạ độ vào out.
     */
    private String geocode(String diaChi, double[] out) throws InterruptedException {
        // Bỏ tiền tố "Xã/Phường/Tỉnh/Thành phố..." (OSM thường ghi tên trần), giữ nguyên "Phường 12"
        String[] parts = diaChi.split(",");
        for (int i = 0; i < parts.length; i++) {
            parts[i] = parts[i].trim()
                    .replaceFirst("(?iu)^(thành phố|tỉnh|phường|xã|thị trấn|đặc khu)\\s+(?!\\d+$)", "");
        }
        for (int skip = 0; skip < Math.min(parts.length, 4); skip++) {
            StringBuilder sb = new StringBuilder();
            for (int i = skip; i < parts.length; i++) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(parts[i].trim());
            }
            String q = sb.toString();
            if (q.isBlank()) continue;
            if (skip > 0) Thread.sleep(1100); // Nominatim: tối đa 1 request/giây
            String url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&q="
                    + URLEncoder.encode(q, StandardCharsets.UTF_8);
            List<Map<String, Object>> res = http.get().uri(url).retrieve().body(LIST_OF_MAP);
            if (res != null && !res.isEmpty()) {
                Map<String, Object> r = res.get(0);
                out[0] = Double.parseDouble(String.valueOf(r.get("lat")));
                out[1] = Double.parseDouble(String.valueOf(r.get("lon")));
                return String.valueOf(r.get("display_name"));
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Double duongBo(double lat, double lng) {
        try {
            String url = String.format(java.util.Locale.US,
                    "https://router.project-osrm.org/route/v1/driving/%f,%f;%f,%f?overview=false",
                    shopLng, shopLat, lng, lat);
            Map<String, Object> res = http.get().uri(url).retrieve().body(MAP);
            if (res == null || !"Ok".equals(res.get("code"))) return null;
            List<Map<String, Object>> routes = (List<Map<String, Object>>) res.get("routes");
            if (routes == null || routes.isEmpty()) return null;
            return ((Number) routes.get(0).get("distance")).doubleValue() / 1000.0;
        } catch (Exception e) {
            return null;
        }
    }

    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1), dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
