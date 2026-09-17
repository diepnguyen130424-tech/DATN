package com.example.bangiay.controller;

import com.example.bangiay.entity.ThuongHieu;
import com.example.bangiay.service.ThuongHieuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/thuong-hieu")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class ThuongHieuController {

    private final ThuongHieuService thuongHieuService;

    @GetMapping
    public ResponseEntity<List<ThuongHieu>> getAll() {
        return ResponseEntity.ok(thuongHieuService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ThuongHieu> getById(@PathVariable Long id) {
        return ResponseEntity.ok(thuongHieuService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ThuongHieu> create(@RequestBody ThuongHieu thuongHieu) {
        return ResponseEntity.ok(thuongHieuService.save(thuongHieu));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ThuongHieu> update(
            @PathVariable Long id,
            @RequestBody ThuongHieu thuongHieu) {

        thuongHieu.setId(id);
        return ResponseEntity.ok(thuongHieuService.save(thuongHieu));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        thuongHieuService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
