package com.example.bangiay.controller;

import com.example.bangiay.entity.DanhMuc;
import com.example.bangiay.service.DanhMucService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/danh-muc")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class DanhMucController {

    private final DanhMucService danhMucService;

    @GetMapping
    public ResponseEntity<List<DanhMuc>> getAll() {
        return ResponseEntity.ok(danhMucService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DanhMuc> getById(@PathVariable Long id) {
        return ResponseEntity.ok(danhMucService.getById(id));
    }

    @PostMapping
    public ResponseEntity<DanhMuc> create(@RequestBody DanhMuc danhMuc) {
        return ResponseEntity.ok(danhMucService.save(danhMuc));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DanhMuc> update(
            @PathVariable Long id,
            @RequestBody DanhMuc danhMuc) {

        danhMuc.setId(id);
        return ResponseEntity.ok(danhMucService.save(danhMuc));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        danhMucService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
