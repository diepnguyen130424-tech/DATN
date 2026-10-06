package com.example.bangiay.controller;

import com.example.bangiay.dto.ChatDtos.*;
import com.example.bangiay.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class ChatController {

    private final ChatService chatService;

    /* ---------- Khách hàng ---------- */

    /** Lấy hội thoại của khách (tự tạo nếu chưa có). docRoi=true khi khung chat đang mở. */
    @GetMapping("/khach-hang/{khachHangId}")
    public HoiThoaiKhachDto layHoiThoai(@PathVariable Long khachHangId,
                                        @RequestParam(defaultValue = "false") boolean daXem) {
        return chatService.layHoiThoaiKhach(khachHangId, daXem);
    }

    @PostMapping("/khach-hang/{khachHangId}/gui")
    public HoiThoaiKhachDto khachGui(@PathVariable Long khachHangId, @RequestBody GuiTinRequest req) {
        return chatService.khachGui(khachHangId, req.noiDung());
    }

    @PutMapping("/khach-hang/{khachHangId}/che-do")
    public HoiThoaiKhachDto khachDoiCheDo(@PathVariable Long khachHangId, @RequestParam String cheDo) {
        return chatService.khachDoiCheDo(khachHangId, cheDo);
    }

    /** Khách chưa đăng nhập: chỉ hỏi bot, không lưu DB. */
    @PostMapping("/bot")
    public BotHoiResponse botHoi(@RequestBody BotHoiRequest req) {
        return chatService.botHoi(req.noiDung());
    }

    /* ---------- Nhân viên ---------- */

    @GetMapping("/hoi-thoai")
    public List<HoiThoaiNhanVienDto> danhSach() {
        return chatService.danhSach();
    }

    @GetMapping("/hoi-thoai/chua-doc")
    public Map<String, Long> chuaDoc() {
        return Map.of("tong", chatService.tongChuaDocChoNhanVien());
    }

    @GetMapping("/hoi-thoai/{id}")
    public ChiTietHoiThoaiDto chiTiet(@PathVariable Long id,
                                      @RequestParam(defaultValue = "false") boolean daXem) {
        return chatService.chiTiet(id, daXem);
    }

    @PostMapping("/hoi-thoai/{id}/tra-loi")
    public ChiTietHoiThoaiDto nhanVienTraLoi(@PathVariable Long id, @RequestBody GuiTinRequest req) {
        return chatService.nhanVienGui(id, req.noiDung(), req.nhanVienId());
    }

    @PutMapping("/hoi-thoai/{id}/che-do")
    public ChiTietHoiThoaiDto nhanVienDoiCheDo(@PathVariable Long id, @RequestParam String cheDo) {
        return chatService.nhanVienDoiCheDo(id, cheDo);
    }
}
