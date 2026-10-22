package com.example.bangiay.controller;

import com.example.bangiay.dto.DoiTraResponse;
import com.example.bangiay.dto.TaoDoiTraRequest;
import com.example.bangiay.service.DoiTraService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/doi-tra")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class DoiTraController {
    private final DoiTraService doiTraService;

    @GetMapping
    public ResponseEntity<List<DoiTraResponse>> getAll() {
        return ResponseEntity.ok(doiTraService.getAll());
    }

    @PostMapping
    public ResponseEntity<DoiTraResponse> tao(@RequestBody TaoDoiTraRequest request) {
        return ResponseEntity.ok(doiTraService.tao(request));
    }

    @PatchMapping("/{id}/trang-thai")
    public ResponseEntity<DoiTraResponse> capNhatTrangThai(@PathVariable Long id, @RequestBody TrangThaiRequest request) {
        return ResponseEntity.ok(doiTraService.capNhatTrangThai(id, request.getTrangThai()));
    }

    @lombok.Getter @lombok.Setter @lombok.NoArgsConstructor
    public static class TrangThaiRequest { private String trangThai; }
}
