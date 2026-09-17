package com.example.bangiay.controller;

import com.example.bangiay.entity.MauSac;
import com.example.bangiay.service.MauSacService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mau-sac")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class MauSacController {

    private final MauSacService mauSacService;

    @GetMapping
    public ResponseEntity<List<MauSac>> getAll() {
        return ResponseEntity.ok(mauSacService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MauSac> getById(@PathVariable Long id) {
        return ResponseEntity.ok(mauSacService.getById(id));
    }

    @PostMapping
    public ResponseEntity<MauSac> create(@RequestBody MauSac mauSac) {
        return ResponseEntity.ok(mauSacService.save(mauSac));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MauSac> update(
            @PathVariable Long id,
            @RequestBody MauSac mauSac) {

        mauSac.setId(id);
        return ResponseEntity.ok(mauSacService.save(mauSac));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        mauSacService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
