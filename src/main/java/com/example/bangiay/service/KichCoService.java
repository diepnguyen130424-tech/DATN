package com.example.bangiay.service;

import com.example.bangiay.entity.KichCo;
import com.example.bangiay.repository.KichCoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class KichCoService {

    private final KichCoRepository kichCoRepository;

    public List<KichCo> getAll() {
        return kichCoRepository.findAll();
    }

    public KichCo getById(Long id) {
        return kichCoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kích cỡ"));
    }

    public KichCo save(KichCo kichCo) {
        return kichCoRepository.save(kichCo);
    }

    public void delete(Long id) {
        kichCoRepository.deleteById(id);
    }
}
