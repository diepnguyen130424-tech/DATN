package com.example.bangiay.service;

import com.example.bangiay.dto.ChatDtos.*;
import com.example.bangiay.entity.ChatHoiThoai;
import com.example.bangiay.entity.ChatTinNhan;
import com.example.bangiay.entity.KhachHang;
import com.example.bangiay.repository.ChatHoiThoaiRepository;
import com.example.bangiay.repository.ChatTinNhanRepository;
import com.example.bangiay.repository.KhachHangRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    public static final String BOT = "BOT";
    public static final String NHAN_VIEN = "NHAN_VIEN";
    private static final int MAX_LEN = 1000;

    private final ChatHoiThoaiRepository hoiThoaiRepo;
    private final ChatTinNhanRepository tinNhanRepo;
    private final KhachHangRepository khachHangRepo;
    private final ChatBotService chatBot;

    /* ===================== KHÁCH HÀNG ===================== */

    @Transactional
    public HoiThoaiKhachDto layHoiThoaiKhach(Long khachHangId, boolean danhDauDaDoc) {
        ChatHoiThoai ht = layHoacTao(khachHangId);
        if (danhDauDaDoc) {
            tinNhanRepo.danhDauKhachDaDoc(ht.getId());
        }
        return toKhachDto(ht, !danhDauDaDoc);
    }

    @Transactional
    public HoiThoaiKhachDto khachGui(Long khachHangId, String noiDung) {
        String nd = kiemTra(noiDung);
        ChatHoiThoai ht = layHoacTao(khachHangId);

        luuTin(ht, "KHACH", nd, true, true);

        if (BOT.equals(ht.getCheDo())) {
            if (chatBot.canNhanVien(nd)) {
                ht.setCheDo(NHAN_VIEN);
                luuTin(ht, "BOT", ChatBotService.TIN_CHUYEN_NHAN_VIEN, true, true);
            } else {
                luuTin(ht, "BOT", chatBot.traLoi(nd), true, true);
            }
        }
        // chế độ NHAN_VIEN: bot im lặng, chờ nhân viên

        hoiThoaiRepo.save(ht);
        tinNhanRepo.danhDauKhachDaDoc(ht.getId());
        return toKhachDto(ht, false);
    }

    @Transactional
    public HoiThoaiKhachDto khachDoiCheDo(Long khachHangId, String cheDo) {
        ChatHoiThoai ht = layHoacTao(khachHangId);
        String moi = chuanCheDo(cheDo);
        if (!moi.equals(ht.getCheDo())) {
            ht.setCheDo(moi);
            if (NHAN_VIEN.equals(moi)) {
                luuTin(ht, "BOT", ChatBotService.TIN_CHUYEN_NHAN_VIEN, true, true);
            } else {
                luuTin(ht, "BOT", "Mình là trợ lý ảo FShop, đã quay lại hỗ trợ bạn đây! Bạn cần hỏi gì nào? 😊", true, true);
            }
            hoiThoaiRepo.save(ht);
        }
        return toKhachDto(ht, false);
    }

    /* ===================== NHÂN VIÊN ===================== */

    @Transactional(readOnly = true)
    public List<HoiThoaiNhanVienDto> danhSach() {
        return hoiThoaiRepo.findAllByOrderByNgayCapNhatDesc().stream()
                .map(this::toNhanVienDto)
                .toList();
    }

    @Transactional
    public ChiTietHoiThoaiDto chiTiet(Long hoiThoaiId, boolean danhDauDaDoc) {
        ChatHoiThoai ht = timHoiThoai(hoiThoaiId);
        if (danhDauDaDoc) {
            tinNhanRepo.danhDauNhanVienDaDoc(ht.getId());
        }
        return new ChiTietHoiThoaiDto(toNhanVienDto(ht), tinNhanDtos(ht.getId()));
    }

    @Transactional
    public ChiTietHoiThoaiDto nhanVienGui(Long hoiThoaiId, String noiDung, Long nhanVienId) {
        String nd = kiemTra(noiDung);
        ChatHoiThoai ht = timHoiThoai(hoiThoaiId);

        ht.setCheDo(NHAN_VIEN); // nhân viên đã vào cuộc -> bot không chen ngang
        if (nhanVienId != null) ht.setNhanVienId(nhanVienId);

        luuTin(ht, "NHAN_VIEN", nd, true, false);
        hoiThoaiRepo.save(ht);
        tinNhanRepo.danhDauNhanVienDaDoc(ht.getId());
        return new ChiTietHoiThoaiDto(toNhanVienDto(ht), tinNhanDtos(ht.getId()));
    }

    @Transactional
    public ChiTietHoiThoaiDto nhanVienDoiCheDo(Long hoiThoaiId, String cheDo) {
        ChatHoiThoai ht = timHoiThoai(hoiThoaiId);
        String moi = chuanCheDo(cheDo);
        if (!moi.equals(ht.getCheDo())) {
            ht.setCheDo(moi);
            if (BOT.equals(moi)) {
                luuTin(ht, "BOT", "Nhân viên đã hoàn tất hỗ trợ. Mình là trợ lý ảo FShop, bạn cần gì cứ nhắn mình nhé! 😊", true, false);
            }
            hoiThoaiRepo.save(ht);
        }
        return new ChiTietHoiThoaiDto(toNhanVienDto(ht), tinNhanDtos(ht.getId()));
    }

    @Transactional(readOnly = true)
    public long tongChuaDocChoNhanVien() {
        return hoiThoaiRepo.findAll().stream()
                .mapToLong(h -> tinNhanRepo.countByHoiThoaiIdAndNguoiGuiAndDaDocBoiNvFalse(h.getId(), "KHACH"))
                .sum();
    }

    /* ===================== BOT (khách chưa đăng nhập) ===================== */

    public BotHoiResponse botHoi(String noiDung) {
        return new BotHoiResponse(chatBot.traLoi(noiDung));
    }

    /* ===================== helper ===================== */

    private ChatHoiThoai layHoacTao(Long khachHangId) {
        KhachHang kh = khachHangRepo.findById(khachHangId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khách hàng"));

        return hoiThoaiRepo.findByKhachHangId(kh.getId()).orElseGet(() -> {
            LocalDateTime now = LocalDateTime.now();
            ChatHoiThoai ht = hoiThoaiRepo.save(ChatHoiThoai.builder()
                    .khachHangId(kh.getId())
                    .cheDo(BOT)
                    .ngayTao(now)
                    .ngayCapNhat(now)
                    .build());
            luuTin(ht, "BOT", ChatBotService.LOI_CHAO, true, false);
            return hoiThoaiRepo.save(ht);
        });
    }

    private ChatHoiThoai timHoiThoai(Long id) {
        return hoiThoaiRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hội thoại"));
    }

    private void luuTin(ChatHoiThoai ht, String nguoiGui, String noiDung, boolean daDocNv, boolean daDocKh) {
        LocalDateTime now = LocalDateTime.now();
        tinNhanRepo.save(ChatTinNhan.builder()
                .hoiThoaiId(ht.getId())
                .nguoiGui(nguoiGui)
                .noiDung(noiDung)
                // cờ "nhân viên đã đọc" chỉ có nghĩa với tin của khách -> tin khách mới luôn chưa đọc
                .daDocBoiNv(!"KHACH".equals(nguoiGui) && daDocNv)
                // tin của khách mặc định khách đã đọc; tin của bot/nhân viên theo tham số
                .daDocBoiKh("KHACH".equals(nguoiGui) || daDocKh)
                .ngayGui(now)
                .build());
        ht.setTinCuoi(noiDung.length() > 200 ? noiDung.substring(0, 200) + "…" : noiDung);
        ht.setNgayCapNhat(now);
    }

    private String kiemTra(String noiDung) {
        String nd = noiDung == null ? "" : noiDung.trim();
        if (nd.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung tin nhắn không được để trống");
        }
        if (nd.length() > MAX_LEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin nhắn tối đa " + MAX_LEN + " ký tự");
        }
        return nd;
    }

    private String chuanCheDo(String cheDo) {
        return NHAN_VIEN.equalsIgnoreCase(cheDo) ? NHAN_VIEN : BOT;
    }

    private List<TinNhanDto> tinNhanDtos(Long hoiThoaiId) {
        return tinNhanRepo.findByHoiThoaiIdOrderByIdAsc(hoiThoaiId).stream()
                .map(t -> new TinNhanDto(t.getId(), t.getNguoiGui(), t.getNoiDung(), t.getNgayGui()))
                .toList();
    }

    private HoiThoaiKhachDto toKhachDto(ChatHoiThoai ht, boolean tinhChuaDoc) {
        long chuaDoc = tinhChuaDoc
                ? tinNhanRepo.countByHoiThoaiIdAndNguoiGuiInAndDaDocBoiKhFalse(ht.getId(), List.of("BOT", "NHAN_VIEN"))
                : 0;
        return new HoiThoaiKhachDto(ht.getId(), ht.getCheDo(), tinNhanDtos(ht.getId()), chuaDoc);
    }

    private HoiThoaiNhanVienDto toNhanVienDto(ChatHoiThoai ht) {
        KhachHang kh = khachHangRepo.findById(ht.getKhachHangId()).orElse(null);
        return new HoiThoaiNhanVienDto(
                ht.getId(),
                ht.getKhachHangId(),
                kh != null ? kh.getHoTen() : "Khách #" + ht.getKhachHangId(),
                kh != null ? kh.getSoDienThoai() : null,
                ht.getCheDo(),
                ht.getTinCuoi(),
                ht.getNgayCapNhat(),
                tinNhanRepo.countByHoiThoaiIdAndNguoiGuiAndDaDocBoiNvFalse(ht.getId(), "KHACH")
        );
    }
}
