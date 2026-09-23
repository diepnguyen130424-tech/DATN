package com.example.bangiay.service;

import com.example.bangiay.entity.MauSac;
import com.example.bangiay.repository.MauSacRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MauSacService {

    private final MauSacRepository mauSacRepository;

    public List<MauSac> getAll() {
        return mauSacRepository.findAll();
    }

    public MauSac getById(Long id) {
        return mauSacRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy màu sắc"));
    }

    public MauSac save(MauSac mauSac) {
        if (mauSac.getTrangThai() == null) {
            mauSac.setTrangThai("HOAT_DONG");
        }

        return mauSacRepository.save(mauSac);
    }

    public void delete(Long id) {
        MauSac mauSac = getById(id);

        // Không xóa cứng vì màu sắc có thể đang được SPCT sử dụng
        mauSac.setTrangThai("NGUNG_HOAT_DONG");

        mauSacRepository.save(mauSac);
    }
}
