package com.example.bangiay.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ChatDtos {

    public record GuiTinRequest(String noiDung, Long nhanVienId) {}

    public record TinNhanDto(Long id, String nguoiGui, String noiDung, LocalDateTime ngayGui) {}

    /** Dùng cho khách: toàn bộ hội thoại + chế độ hiện tại */
    public record HoiThoaiKhachDto(Long id, String cheDo, List<TinNhanDto> tinNhan, long chuaDoc) {}

    /** Dùng cho nhân viên: danh sách hội thoại */
    public record HoiThoaiNhanVienDto(
            Long id,
            Long khachHangId,
            String tenKhachHang,
            String soDienThoai,
            String cheDo,
            String tinCuoi,
            LocalDateTime ngayCapNhat,
            long chuaDoc
    ) {}

    public record ChiTietHoiThoaiDto(HoiThoaiNhanVienDto hoiThoai, List<TinNhanDto> tinNhan) {}

    public record BotHoiRequest(String noiDung) {}

    public record BotHoiResponse(String traLoi) {}
}
