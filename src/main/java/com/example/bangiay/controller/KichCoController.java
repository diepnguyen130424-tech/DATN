package com.example.bangiay.controller;

import com.example.bangiay.entity.KichCo;
import com.example.bangiay.service.KichCoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kich-co")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class KichCoController {

    private final KichCoService kichCoService;

    @GetMapping
    public ResponseEntity<List<KichCo>> getAll() {
        return ResponseEntity.ok(kichCoService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<KichCo> getById(@PathVariable Long id) {
        return ResponseEntity.ok(kichCoService.getById(id));
    }

    @PostMapping
    public ResponseEntity<KichCo> create(@RequestBody KichCo kichCo) {
        return ResponseEntity.ok(kichCoService.save(kichCo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<KichCo> update(
            @PathVariable Long id,
            @RequestBody KichCo kichCo) {

        kichCo.setId(id);
        return ResponseEntity.ok(kichCoService.save(kichCo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        kichCoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
