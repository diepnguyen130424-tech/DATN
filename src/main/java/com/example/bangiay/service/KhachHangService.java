package com.example.bangiay.service;

import com.example.bangiay.entity.KhachHang;
import com.example.bangiay.repository.KhachHangRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class KhachHangService {

    private final KhachHangRepository khachHangRepository;

    public List<KhachHang> getAll() {
        return khachHangRepository.findAll();
    }

    public KhachHang getById(Long id) {
        return khachHangRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy khách hàng"));
    }

    public KhachHang getByTaiKhoanId(Long taiKhoanId) {
        return khachHangRepository.findByTaiKhoan_Id(taiKhoanId)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy khách hàng"));
    }

    public KhachHang save(KhachHang khachHang) {
        return khachHangRepository.save(khachHang);
    }

    public void delete(Long id) {
        if (!khachHangRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy khách hàng");
        }

        khachHangRepository.deleteById(id);
    }
}