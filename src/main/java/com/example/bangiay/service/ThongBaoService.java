package com.example.bangiay.service;

import com.example.bangiay.entity.MaGiamGia;
import com.example.bangiay.entity.ThongBao;
import com.example.bangiay.repository.MaGiamGiaRepository;
import com.example.bangiay.repository.ThongBaoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ThongBaoService {

    private final ThongBaoRepository thongBaoRepo;
    private final MaGiamGiaRepository maGiamGiaRepo;

    @Value("${app.voucher.sap-het-han-ngay:3}")
    private int sapHetHanNgay;

    // =========================================================
    // ADMIN TẮT VOUCHER → thông báo ngưng sử dụng
    // =========================================================
    @Transactional
    public void thongBaoNgungSuDung(MaGiamGia v) {

        if (v == null || v.getId() == null) return;

        thongBaoRepo.save(ThongBao.builder()
                .voucherId(v.getId())
                .loai("NGUNG_SU_DUNG")
                .tieuDe("Voucher " + v.getMaVoucher() + " đã bị ngưng")
                .noiDung("Voucher \"" + v.getTenVoucher()
                        + "\" (" + v.getMaVoucher()
                        + ") đã bị quản trị viên tạm ngưng. "
                        + "Bạn không thể sử dụng mã này cho tới khi được mở lại.")
                .build());

        log.info("[ThongBao] Ngưng sử dụng voucher {}", v.getMaVoucher());
    }

    // =========================================================
    // ADMIN BẬT LẠI VOUCHER → thông báo kích hoạt
    // =========================================================
    @Transactional
    public void thongBaoKichHoatLai(MaGiamGia v) {

        if (v == null || v.getId() == null) return;

        thongBaoRepo.save(ThongBao.builder()
                .voucherId(v.getId())
                .loai("KICH_HOAT")
                .tieuDe("Voucher " + v.getMaVoucher() + " đã hoạt động trở lại")
                .noiDung("Voucher \"" + v.getTenVoucher()
                        + "\" (" + v.getMaVoucher()
                        + ") đã được kích hoạt trở lại. Nhanh tay sử dụng!")
                .build());

        log.info("[ThongBao] Kích hoạt lại voucher {}", v.getMaVoucher());
    }

    // =========================================================
    // SCHEDULER — mỗi ngày 8:00 sáng quét voucher sắp hết hạn
    // =========================================================
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void quetVoucherSapHetHan() {
        quetVoucherSapHetHanThuCong();
    }

    /**
     * Cho phép gọi thủ công (test, admin trigger, …)
     */
    @Transactional
    public int quetVoucherSapHetHanThuCong() {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nguong = now.plusDays(sapHetHanNgay);

        List<MaGiamGia> ds = maGiamGiaRepo.findAll();
        int dem = 0;

        for (MaGiamGia v : ds) {

            if (!"HOAT_DONG".equalsIgnoreCase(v.getTrangThai())) continue;
            if (v.getNgayKetThuc() == null) continue;

            // Chỉ quét voucher còn <= N ngày và chưa hết hạn
            boolean trongKhoangCanhBao =
                    v.getNgayKetThuc().isAfter(now)
                            && !v.getNgayKetThuc().isAfter(nguong);

            if (!trongKhoangCanhBao) continue;

            // Chống spam: 24h qua đã gửi cho voucher này rồi thì skip
            boolean daGui = thongBaoRepo
                    .existsByVoucherIdAndLoaiAndNgayTaoAfter(
                            v.getId(),
                            "SAP_HET_HAN",
                            now.minusHours(24)
                    );

            if (daGui) continue;

            long conLaiGio = Duration.between(now, v.getNgayKetThuc()).toHours();
            long conLaiNgay = (long) Math.max(1, Math.ceil(conLaiGio / 24.0));

            thongBaoRepo.save(ThongBao.builder()
                    .voucherId(v.getId())
                    .loai("SAP_HET_HAN")
                    .tieuDe("Voucher " + v.getMaVoucher() + " sắp hết hạn")
                    .noiDung("Voucher \"" + v.getTenVoucher()
                            + "\" (" + v.getMaVoucher()
                            + ") chỉ còn khoảng " + conLaiNgay
                            + " ngày. Sử dụng ngay kẻo lỡ!")
                    .build());

            dem++;
            log.info("[Scheduler] Đã gửi thông báo sắp hết hạn cho {}",
                    v.getMaVoucher());
        }

        return dem;
    }
}