package com.example.bangiay.config;

import com.example.bangiay.service.HoaDonService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Tự động xác nhận "đã nhận hàng" cho đơn đã giao quá 7 ngày mà khách chưa bấm (giống Shopee). */
@Component
@RequiredArgsConstructor
public class DonHangScheduler {

    public static final int SO_NGAY_TU_DONG_XAC_NHAN = 7;

    private final HoaDonService hoaDonService;

    @Scheduled(cron = "0 0 * * * *") // mỗi giờ
    public void tuDongXacNhanNhanHang() {
        hoaDonService.tuDongXacNhanNhanHang(SO_NGAY_TU_DONG_XAC_NHAN);
    }
}
