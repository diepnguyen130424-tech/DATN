package com.example.bangiay.service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Đẩy sự kiện "voucher đã thay đổi" tới mọi trình duyệt khách hàng đang mở (SSE).
 * Khách chỉ cần mở 1 kết nối GET /api/ma-giam-gia/stream, admin đổi voucher là được báo ngay.
 */
@Service
public class VoucherEventService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    private final ScheduledExecutorService heartbeat =
            Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "voucher-sse-heartbeat");
                t.setDaemon(true);
                return t;
            });

    @PostConstruct
    void batDauHeartbeat() {
        // Gửi "ping" định kỳ để giữ kết nối sống và dọn các kết nối đã chết
        heartbeat.scheduleAtFixedRate(
                () -> gui(SseEmitter.event().comment("ping")),
                20, 20, TimeUnit.SECONDS);
    }

    @PreDestroy
    void dung() {
        heartbeat.shutdownNow();
        for (SseEmitter e : emitters) {
            try {
                e.complete();
            } catch (Exception ignored) {
                // bỏ qua
            }
        }
        emitters.clear();
    }

    /** Khách hàng đăng ký nhận sự kiện. */
    public SseEmitter dangKy() {
        SseEmitter emitter = new SseEmitter(0L); // 0 = không tự hết hạn

        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    /**
     * Phát sự kiện voucher thay đổi.
     * Nếu đang trong transaction thì chờ COMMIT xong mới phát, để khách tải lại là thấy dữ liệu mới.
     */
    public void phat(Long voucherId, String trangThai) {
        final String json = "{\"id\":" + (voucherId == null ? 0 : voucherId)
                + ",\"trangThai\":\"" + (trangThai == null ? "" : trangThai) + "\"}";

        Runnable gui = () -> gui(SseEmitter.event().name("voucher-changed").data(json));

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            gui.run();
                        }
                    });
        } else {
            gui.run();
        }
    }

    private void gui(SseEmitter.SseEventBuilder event) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(event);
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }
}