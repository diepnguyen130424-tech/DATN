package com.example.bangiay.config;

import com.example.bangiay.service.HoaDonService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SePayPaymentExpiryScheduler {

    private final HoaDonService hoaDonService;
    @Scheduled(fixedDelay = 15000)
    public void huyDonSePayHetHan() {
        int count = hoaDonService.tuDongHuyDonChuyenKhoanHetHan();
        if (count > 0) {
            System.out.println("SePay: Đã tự động hủy " + count + " đơn chuyển khoản hết hạn.");
        }
    }
}
