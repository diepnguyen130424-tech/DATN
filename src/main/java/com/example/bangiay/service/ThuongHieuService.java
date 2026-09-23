package com.example.bangiay.service;

import com.example.bangiay.entity.ThuongHieu;
import com.example.bangiay.repository.ThuongHieuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ThuongHieuService {

    private final ThuongHieuRepository thuongHieuRepository;

    public List<ThuongHieu> getAll() {
        return thuongHieuRepository.findAll();
    }

    public ThuongHieu getById(Long id) {
        return thuongHieuRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy thương hiệu"));
    }

    public ThuongHieu save(ThuongHieu thuongHieu) {

        if (thuongHieu.getNgayTao() == null) {
            thuongHieu.setNgayTao(LocalDateTime.now());
        }

        if (thuongHieu.getTrangThai() == null) {
            thuongHieu.setTrangThai("HOAT_DONG");
        }

        return thuongHieuRepository.save(thuongHieu);
    }

    public void delete(Long id) {
        ThuongHieu thuongHieu = getById(id);

        thuongHieu.setTrangThai("NGUNG_HOAT_DONG");

        thuongHieuRepository.save(thuongHieu);
    }
}
