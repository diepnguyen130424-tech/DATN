package com.example.bangiay.service;
import java.time.LocalDateTime;
import com.example.bangiay.entity.DanhMuc;
import com.example.bangiay.repository.DanhMucRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DanhMucService {

    private final DanhMucRepository danhMucRepository;

    public List<DanhMuc> getAll() {
        return danhMucRepository.findAll();
    }

    public DanhMuc getById(Long id) {
        return danhMucRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));
    }

    public DanhMuc save(DanhMuc danhMuc) {
        if (danhMuc.getNgayTao() == null) {
            danhMuc.setNgayTao(LocalDateTime.now());
        }
        return danhMucRepository.save(danhMuc);
    }

    public void delete(Long id) {
        danhMucRepository.deleteById(id);
    }
}
