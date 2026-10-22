package com.example.bangiay.service;

import com.example.bangiay.entity.DiaChi;
import com.example.bangiay.repository.DiaChiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiaChiService {

    private final DiaChiRepository diaChiRepository;
    private final ShippingService shippingService;

    public List<DiaChi> getByKhachHangId(Long khachHangId) {
        return diaChiRepository.findByKhachHang_Id(khachHangId);
    }

    public DiaChi getById(Long id) {
        return diaChiRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy địa chỉ"));
    }

    public DiaChi save(DiaChi diaChi) {
        // Phí ship luôn do server tính theo khoảng cách, không tin giá trị client gửi lên
        diaChi.setPhiShip(shippingService.tinhPhi(diaChi.getDiaChi()).getPhiShip());
        if (Boolean.TRUE.equals(diaChi.getMacDinh()) && diaChi.getKhachHang() != null && diaChi.getKhachHang().getId() != null) {
            diaChiRepository.findByKhachHang_Id(diaChi.getKhachHang().getId()).forEach(a -> { a.setMacDinh(false); diaChiRepository.save(a); });
        }
        if (diaChi.getMacDinh() == null) diaChi.setMacDinh(false);
        return diaChiRepository.save(diaChi);
    }

    public DiaChi update(Long id, DiaChi diaChi) {

        DiaChi existing = getById(id);

        existing.setTenNguoiNhan(diaChi.getTenNguoiNhan());
        existing.setSoDienThoai(diaChi.getSoDienThoai());
        existing.setDiaChi(diaChi.getDiaChi());
        existing.setPhiShip(shippingService.tinhPhi(diaChi.getDiaChi()).getPhiShip());
        if (Boolean.TRUE.equals(diaChi.getMacDinh())) {
            diaChiRepository.findByKhachHang_Id(existing.getKhachHang().getId()).forEach(a -> { a.setMacDinh(false); diaChiRepository.save(a); });
        }
        existing.setMacDinh(diaChi.getMacDinh() != null && diaChi.getMacDinh());
        return diaChiRepository.save(existing);
    }

    public void delete(Long id) {

        if (!diaChiRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy địa chỉ");
        }

        diaChiRepository.deleteById(id);
    }
}