package com.example.bangiay.controller;

import com.example.bangiay.service.YeuThichService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/yeu-thich")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class YeuThichController {


    private final YeuThichService yeuThichService;

    @GetMapping("/khach-hang/{khachHangId}")
    public ResponseEntity<List<Long>> getSanPhamIds(
            @PathVariable Long khachHangId
    ) {

        return ResponseEntity.ok(
                yeuThichService.getSanPhamIds(
                        khachHangId
                )
        );
    }
    @PostMapping(
            "/khach-hang/{khachHangId}/san-pham/{sanPhamId}"
    )
    public ResponseEntity<List<Long>> them(
            @PathVariable Long khachHangId,
            @PathVariable Long sanPhamId
    ) {

        return ResponseEntity.ok(
                yeuThichService.them(
                        khachHangId,
                        sanPhamId
                )
        );
    }
    @DeleteMapping(
            "/khach-hang/{khachHangId}/san-pham/{sanPhamId}"
    )
    public ResponseEntity<List<Long>> xoa(
            @PathVariable Long khachHangId,
            @PathVariable Long sanPhamId
    ) {

        return ResponseEntity.ok(
                yeuThichService.xoa(
                        khachHangId,
                        sanPhamId
                )
        );
    }
}