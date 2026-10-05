package com.example.bangiay.controller;

import com.example.bangiay.entity.KhachHang;
import com.example.bangiay.service.KhachHangService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/khach-hang")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class KhachHangController {

    private final KhachHangService khachHangService;


    @GetMapping
    public ResponseEntity<List<KhachHang>> getAll() {
        return ResponseEntity.ok(
                khachHangService.getAll()
        );
    }


    @GetMapping("/{id}")
    public ResponseEntity<KhachHang> getById(
            @PathVariable Long id
    ) {
        KhachHang khachHang =
                khachHangService.getById(id);

        if (khachHang == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(khachHang);
    }


    @GetMapping("/tai-khoan/{taiKhoanId}")
    public ResponseEntity<KhachHang> getByTaiKhoanId(
            @PathVariable Long taiKhoanId
    ) {
        KhachHang khachHang =
                khachHangService.getByTaiKhoanId(taiKhoanId);

        if (khachHang == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(khachHang);
    }

    @GetMapping("/tai-khoan/{taiKhoanId}/id")
    public ResponseEntity<Long> getIdByTaiKhoanId(
            @PathVariable Long taiKhoanId
    ) {
        KhachHang khachHang =
                khachHangService.getByTaiKhoanId(taiKhoanId);

        if (khachHang == null ||
                khachHang.getId() == null) {

            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                khachHang.getId()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        KhachHang khachHang =
                khachHangService.getById(id);

        if (khachHang == null) {
            return ResponseEntity.notFound().build();
        }

        khachHangService.delete(id);

        return ResponseEntity.noContent().build();
    }
}