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
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy màu sắc"));
    }

    public MauSac save(MauSac mauSac) {
        if (mauSac.getTrangThai() == null) {
            mauSac.setTrangThai("HOAT_DONG");
        }

        return mauSacRepository.save(mauSac);
    }

    public void delete(Long id) {
        if (!mauSacRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy màu sắc");
        }

        mauSacRepository.deleteById(id);
    }
}