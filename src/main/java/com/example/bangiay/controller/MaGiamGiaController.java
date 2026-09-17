package com.example.bangiay.controller;

import com.example.bangiay.entity.MaGiamGia;
import com.example.bangiay.service.MaGiamGiaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ma-giam-gia")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class MaGiamGiaController {

    private final MaGiamGiaService maGiamGiaService;


    @GetMapping
    public ResponseEntity<List<MaGiamGia>> getAll() {
        return ResponseEntity.ok(
                maGiamGiaService.getAll()
        );
    }


    @GetMapping("/{id}")
    public ResponseEntity<MaGiamGia> getById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                maGiamGiaService.getById(id)
        );
    }

    @GetMapping("/ma/{maVoucher}")
    public ResponseEntity<MaGiamGia> getByMaVoucher(
            @PathVariable String maVoucher
    ) {
        return ResponseEntity.ok(
                maGiamGiaService.getByMaVoucher(maVoucher)
        );
    }

    @PostMapping
    public ResponseEntity<MaGiamGia> create(
            @RequestBody MaGiamGia maGiamGia
    ) {
        return ResponseEntity.ok(
                maGiamGiaService.save(maGiamGia)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaGiamGia> update(
            @PathVariable Long id,
            @RequestBody MaGiamGia maGiamGia
    ) {
        maGiamGia.setId(id);

        return ResponseEntity.ok(
                maGiamGiaService.save(maGiamGia)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        maGiamGiaService.delete(id);

        return ResponseEntity.noContent().build();
    }
}
