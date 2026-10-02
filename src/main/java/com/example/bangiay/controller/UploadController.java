package com.example.bangiay.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Upload ảnh (logo thương hiệu, ảnh danh mục). Ảnh lưu ở thư mục ./uploads và được phục vụ tại /uploads/** */
@RestController
@RequestMapping("/api/upload")
public class UploadController {

    public static final Path UPLOAD_ROOT = Paths.get("uploads").toAbsolutePath().normalize();

    private static final long MAX_SIZE = 5L * 1024 * 1024;
    private static final Set<String> FOLDERS = Set.of("thuong-hieu", "danh-muc");
    private static final Map<String, String> EXT = Map.of(
            "image/png", ".png",
            "image/jpeg", ".jpg",
            "image/webp", ".webp",
            "image/gif", ".gif",
            "image/svg+xml", ".svg"
    );

    @PostMapping
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "thuong-hieu") String folder
    ) throws IOException {
        if (!FOLDERS.contains(folder)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thư mục không hợp lệ"));
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chưa chọn file"));
        }
        if (file.getSize() > MAX_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ảnh tối đa 5MB"));
        }
        String ext = EXT.get(String.valueOf(file.getContentType()).toLowerCase());
        if (ext == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Chỉ hỗ trợ ảnh PNG, JPG, WEBP, GIF, SVG"));
        }

        Path dir = UPLOAD_ROOT.resolve(folder);
        Files.createDirectories(dir);
        String name = UUID.randomUUID() + ext;
        Files.copy(file.getInputStream(), dir.resolve(name), StandardCopyOption.REPLACE_EXISTING);

        return ResponseEntity.ok(Map.of("url", "/uploads/" + folder + "/" + name));
    }
}
