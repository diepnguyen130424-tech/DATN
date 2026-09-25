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

    public List<DiaChi> getByKhachHangId(Long khachHangId) {
        return diaChiRepository.findByKhachHang_Id(khachHangId);
    }

    public DiaChi getById(Long id) {
        return diaChiRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy địa chỉ"));
    }

    public DiaChi save(DiaChi diaChi) {
        return diaChiRepository.save(diaChi);
    }

    public DiaChi update(Long id, DiaChi diaChi) {

        DiaChi existing = getById(id);

        existing.setTenNguoiNhan(diaChi.getTenNguoiNhan());
        existing.setSoDienThoai(diaChi.getSoDienThoai());
        existing.setDiaChi(diaChi.getDiaChi());
        existing.setMacDinh(diaChi.getMacDinh());

        return diaChiRepository.save(existing);
    }

    public void delete(Long id) {

        if (!diaChiRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy địa chỉ");
        }

        diaChiRepository.deleteById(id);
    }
}