package com.example.bangiay.service;

import com.example.bangiay.entity.SanPham;
import com.example.bangiay.entity.SanPhamChiTiet;
import com.example.bangiay.repository.SanPhamChiTietRepository;
import com.example.bangiay.repository.SanPhamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Bot trả lời tự động (theo luật + tra cứu sản phẩm trong DB).
 * Không cần API key bên ngoài.
 */
@Service
@RequiredArgsConstructor
public class ChatBotService {

    /** Câu bot dùng khi chuyển cuộc trò chuyện sang nhân viên. */
    public static final String TIN_CHUYEN_NHAN_VIEN =
            "Mình đã chuyển cuộc trò chuyện cho nhân viên FShop. "
                    + "Bạn vui lòng chờ trong giây lát, nhân viên sẽ phản hồi sớm nhất có thể nhé! 🙌";

    public static final String LOI_CHAO =
            "Xin chào! Mình là trợ lý ảo của FShop 👟\n"
                    + "Mình có thể giúp bạn: tra giá sản phẩm, phí vận chuyển, đổi trả, thanh toán, chọn size...\n"
                    + "Cần gặp nhân viên, hãy gõ \"gặp nhân viên\" nhé!";

    private final SanPhamRepository sanPhamRepository;
    private final SanPhamChiTietRepository sanPhamChiTietRepository;

    /** Có phải yêu cầu gặp nhân viên không? */
    public boolean canNhanVien(String noiDung) {
        String s = chuanHoa(noiDung);
        return coMot(s, "nhan vien", "tu van vien", "gap nguoi", "nguoi that", "tong dai",
                "khieu nai", "hotline", "gap admin", "ho tro truc tiep");
    }

    public String traLoi(String noiDung) {
        String s = chuanHoa(noiDung);
        if (s.isBlank()) {
            return "Bạn muốn hỏi gì về FShop nhỉ? 😊";
        }

        if (canNhanVien(noiDung)) {
            return TIN_CHUYEN_NHAN_VIEN;
        }

        if (coMot(s, "cam on", "thanks", "thank you")) {
            return "Rất vui được hỗ trợ bạn! Cần gì cứ nhắn mình nhé 😊";
        }

        if (coMot(s, "ship", "van chuyen", "giao hang", "phi giao", "freeship", "mien phi")) {
            return "🚚 Vận chuyển FShop:\n"
                    + "• Miễn phí vận chuyển cho đơn từ 500.000đ.\n"
                    + "• Đơn dưới 500.000đ: phí ship mặc định 30.000đ.\n"
                    + "Bạn có thể xem phí chính xác ở bước thanh toán.";
        }

        if (coMot(s, "doi tra", "doi hang", "tra hang", "hoan tien", "bao hanh", "loi")) {
            return "🔁 Chính sách đổi trả: FShop hỗ trợ đổi trả trong 7 ngày nếu sản phẩm có lỗi. "
                    + "Bạn giữ lại hóa đơn và nhắn \"gặp nhân viên\" để được hỗ trợ nhanh nhé.";
        }

        if (coMot(s, "thanh toan", "chuyen khoan", "cod", "tra tien", "momo", "visa")) {
            return "💳 FShop có thanh toán an toàn, bảo mật thông tin khách hàng. "
                    + "Bạn chọn phương thức thanh toán ở bước Thanh toán khi đặt hàng. "
                    + "Cần hỗ trợ thêm, gõ \"gặp nhân viên\" nhé.";
        }

        if (coMot(s, "chinh hang", "hang that", "fake", "auth", "real")) {
            return "✅ FShop cam kết bán giày chính hãng, chất lượng đảm bảo.";
        }

        if (coMot(s, "size", "co giay", "size nao", "chon size", "do chan")) {
            return "📏 Để chọn size, bạn có thể dùng tính năng \"AI đo size\" ở trang chi tiết sản phẩm, "
                    + "hoặc cho mình biết chiều dài bàn chân (cm) để mình gợi ý. "
                    + "Mẹo: nếu chân bè, nên chọn lớn hơn 0,5 size.";
        }

        if (coMot(s, "khuyen mai", "giam gia", "voucher", "ma giam", "sale", "uu dai")) {
            return "🎁 Bạn xem mục \"Khuyến mãi\" trên thanh menu để cập nhật các chương trình và mã giảm giá đang chạy. "
                    + "Mã giảm giá nhập ở bước thanh toán nhé!";
        }

        if (coMot(s, "dia chi", "cua hang o dau", "gio mo cua", "gio lam viec", "mo cua")) {
            return "🏬 Bạn xem thông tin địa chỉ và giờ làm việc ở mục \"Liên hệ\". "
                    + "Nếu cần hỗ trợ ngay, gõ \"gặp nhân viên\" nhé.";
        }

        if (coMot(s, "don hang", "van don", "kiem tra don", "tra cuu don", "dat hang")) {
            return "📦 Bạn vào mục \"Đơn hàng\" (khi đã đăng nhập) để xem trạng thái đơn. "
                    + "Muốn nhân viên kiểm tra giúp, gõ \"gặp nhân viên\" kèm mã đơn nhé.";
        }

        // Tra cứu sản phẩm theo tên / thương hiệu / mã
        String sanPham = timSanPham(s);
        if (sanPham != null) {
            return sanPham;
        }

        if (coMot(s, "xin chao", "chao", "hello", "hi", "alo", "shop oi")) {
            return LOI_CHAO;
        }

        if (coMot(s, "gia", "bao nhieu", "san pham", "giay", "mua", "con hang", "het hang", "tim")) {
            return "Bạn cho mình biết tên hoặc thương hiệu giày (ví dụ: Nike, Adidas, Puma, Converse) "
                    + "để mình tra giá và tình trạng hàng nhé 👟";
        }

        return "Xin lỗi, mình chưa hiểu rõ câu hỏi này 😅\n"
                + "Bạn có thể hỏi về: giá sản phẩm, vận chuyển, đổi trả, thanh toán, size, khuyến mãi.\n"
                + "Hoặc gõ \"gặp nhân viên\" để được hỗ trợ trực tiếp.";
    }

    /* ------------------------------------------------------------------ */

    private String timSanPham(String s) {
        List<SanPham> tatCa = sanPhamRepository.findAll();
        List<SanPham> khop = new ArrayList<>();

        for (SanPham sp : tatCa) {
            if (sp.getTrangThai() != null && chuanHoa(sp.getTrangThai()).contains("ngung")) {
                continue;
            }
            String ten = chuanHoa(sp.getTenSanPham());
            String ma = chuanHoa(sp.getMaSanPham());
            String hang = sp.getThuongHieu() != null ? chuanHoa(sp.getThuongHieu().getTenThuongHieu()) : "";
            String hangDau = hang.isBlank() ? "" : hang.split(" ")[0];
            String danhMuc = sp.getDanhMuc() != null ? chuanHoa(sp.getDanhMuc().getTenDanhMuc()) : "";

            boolean ok = (!ten.isBlank() && s.contains(ten))
                    || (!ma.isBlank() && s.contains(ma))
                    || (!hangDau.isBlank() && s.contains(hangDau))
                    || (!danhMuc.isBlank() && s.contains(danhMuc));
            if (ok) khop.add(sp);
        }

        if (khop.isEmpty()) return null;

        StringBuilder sb = new StringBuilder("Mình tìm được các sản phẩm phù hợp 👟\n");
        int dem = 0;
        for (SanPham sp : khop) {
            if (dem++ >= 4) break;

            List<SanPhamChiTiet> bienThe = sanPhamChiTietRepository.findBySanPham_Id(sp.getId());
            BigDecimal min = null, max = null;
            int ton = 0;
            for (SanPhamChiTiet ct : bienThe) {
                if (ct.getGiaBan() != null) {
                    if (min == null || ct.getGiaBan().compareTo(min) < 0) min = ct.getGiaBan();
                    if (max == null || ct.getGiaBan().compareTo(max) > 0) max = ct.getGiaBan();
                }
                ton += ct.getSoLuongTon() == null ? 0 : ct.getSoLuongTon();
            }

            sb.append("\n• ").append(sp.getTenSanPham())
                    .append(" (ID ").append(sp.getId()).append(")")
                    .append("\n  Giá: ").append(khoangGia(min, max))
                    .append(" — ").append(ton > 0 ? "Còn hàng" : "Tạm hết hàng");
        }

        if (khop.size() > 4) {
            sb.append("\n\n...và ").append(khop.size() - 4).append(" sản phẩm khác. Bạn xem thêm ở trang Sản phẩm nhé!");
        } else {
            sb.append("\n\nBạn xem chi tiết ở trang Sản phẩm để chọn size/màu nhé!");
        }
        return sb.toString();
    }

    private String khoangGia(BigDecimal min, BigDecimal max) {
        if (min == null) return "đang cập nhật";
        if (max == null || min.compareTo(max) == 0) return tien(min);
        return tien(min) + " - " + tien(max);
    }

    private String tien(BigDecimal v) {
        return String.format(Locale.GERMANY, "%,.0f", v) + "đ"; // 1.500.000đ
    }

    private boolean coMot(String s, String... tuKhoa) {
        for (String k : tuKhoa) {
            // khớp theo từ để tránh "hi" nằm trong "nhieu"
            if (k.contains(" ") ? s.contains(k) : (" " + s + " ").contains(" " + k + " ")) {
                return true;
            }
        }
        return false;
    }

    static String chuanHoa(String input) {
        if (input == null) return "";
        String n = Normalizer.normalize(input.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
        return n.replaceAll("[^a-z0-9 ]", " ").replaceAll("\\s+", " ").trim();
    }
}
