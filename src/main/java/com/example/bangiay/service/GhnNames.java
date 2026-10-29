package com.example.bangiay.service;

import java.text.Normalizer;
import java.util.List;
import java.util.Map;

/**
 * Chuẩn hoá & khớp tên Tỉnh / Phường-Xã với danh mục địa chỉ mới 2 cấp của GHN.
 * Không phụ thuộc Spring để test độc lập.
 */
final class GhnNames {

    private GhnNames() {}

    /** "Thành phố Hà Nội" -> "thanh pho ha noi" (bỏ dấu, bỏ ký tự lạ, gộp khoảng trắng). */
    static String chuanHoa(String s) {
        if (s == null) return "";
        String t = s.trim().toLowerCase().replace('đ', 'd');
        t = Normalizer.normalize(t, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        t = t.replaceAll("[^a-z0-9]+", " ").trim();
        return t;
    }

    /** Bỏ tiền tố hành chính: "phuong vung tau" -> "vung tau"; "phuong 12" -> "12". */
    static String boTienTo(String chuanHoa) {
        return chuanHoa.replaceFirst("^(thanh pho|tinh|phuong|xa|thi tran|dac khu|tp|tt|p|x)\\s+", "");
    }

    /**
     * Tìm phần tử GHN khớp với tên người dùng/địa chỉ nhập.
     * Ưu tiên khớp đủ tiền tố (phân biệt "Phường Tân Phú" / "Xã Tân Phú"), sau đó mới bỏ tiền tố.
     */
    @SuppressWarnings("unchecked")
    static Map<String, Object> timKhop(List<Map<String, Object>> danhMuc, String ten) {
        if (danhMuc == null || ten == null || ten.isBlank()) return null;
        String n1 = chuanHoa(ten);
        for (Map<String, Object> it : danhMuc) {
            if (khop(it, n1, false)) return it;
        }
        String n2 = boTienTo(n1);
        if (n2.isBlank()) return null;
        for (Map<String, Object> it : danhMuc) {
            if (khop(it, n2, true)) return it;
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private static boolean khop(Map<String, Object> it, String can, boolean boTT) {
        // status: 1 = đang hoạt động
        Object st = it.get("status");
        if (st instanceof Number n && n.intValue() != 1) return false;

        if (so(chuanHoa(String.valueOf(it.get("name"))), can, boTT)) return true;
        Object ext = it.get("extension_names");
        if (ext instanceof List<?> l) {
            for (Object e : l) {
                if (so(chuanHoa(String.valueOf(e)), can, boTT)) return true;
            }
        }
        return false;
    }

    private static boolean so(String a, String b, boolean boTT) {
        return boTT ? boTienTo(a).equals(b) : a.equals(b);
    }
}
