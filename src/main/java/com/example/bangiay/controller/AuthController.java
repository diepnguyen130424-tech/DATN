package com.example.bangiay.controller;

import com.example.bangiay.entity.TaiKhoan;
import com.example.bangiay.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<TaiKhoan> login(
            @RequestParam String tenDangNhap,
            @RequestParam String matKhau
    ) {
        return ResponseEntity.ok(
                authService.login(tenDangNhap, matKhau)
        );
    }

    @PostMapping("/register")
    public ResponseEntity<TaiKhoan> register(
            @RequestBody TaiKhoan taiKhoan
    ) {
        return ResponseEntity.ok(
                authService.register(taiKhoan)
        );
    }
}