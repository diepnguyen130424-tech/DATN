
package com.example.bangiay.controller;

import com.example.bangiay.service.AiDoSizeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/ai-size")
public class AiDoSizeController {

    private static final Logger log =
            LoggerFactory.getLogger(AiDoSizeController.class);

    private final AiDoSizeService aiDoSizeService;

    public AiDoSizeController(AiDoSizeService aiDoSizeService) {
        this.aiDoSizeService = aiDoSizeService;
    }

    @PostMapping(
            value = "/analyze",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> analyze(
            @RequestParam("file") MultipartFile file
    ) {
        // Kiểm tra ảnh đầu vào
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Vui lòng chọn ảnh bàn chân.")
            );
        }

        if (file.getSize() > 5L * 1024 * 1024) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Ảnh tối đa 5MB.")
            );
        }

        String contentType = file.getContentType();

        if (contentType == null ||
                !(contentType.equalsIgnoreCase("image/jpeg")
                        || contentType.equalsIgnoreCase("image/png")
                        || contentType.equalsIgnoreCase("image/webp"))) {

            return ResponseEntity.badRequest().body(
                    Map.of("message", "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.")
            );
        }

        try {
            return ResponseEntity.ok(
                    aiDoSizeService.analyze(file.getBytes(), contentType)
            );

        } catch (IllegalStateException ex) {
            // Phân biệt thiếu API key với Gemini quá tải / bị gián đoạn.
            log.error("Lỗi dịch vụ AI: ", ex);

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "success", false,
                            "message", ex.getMessage() != null
                                    ? ex.getMessage()
                                    : "Dịch vụ AI đang tạm thời không khả dụng."
                    ));

        } catch (IllegalArgumentException ex) {
            // Lỗi ảnh không đạt điều kiện nhận diện hoặc dữ liệu AI không hợp lệ.
            log.warn("Ảnh không đạt điều kiện đo size: {}", ex.getMessage());

            return ResponseEntity.unprocessableEntity()
                    .body(Map.of(
                            "success", false,
                            "message", ex.getMessage() != null
                                    ? ex.getMessage()
                                    : "Không thể nhận diện ảnh. Vui lòng thử lại."
                    ));

        } catch (RestClientResponseException ex) {
            int status = ex.getStatusCode().value();

            log.error(
                    "Gemini API trả lỗi HTTP {}: {}",
                    status,
                    ex.getResponseBodyAsString()
            );

            if (status == 429 || status == 502 || status == 503 || status == 504) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of(
                                "success", false,
                                "message", "Dịch vụ AI đang quá tải hoặc tạm thời không phản hồi. Vui lòng thử lại sau."
                        ));
            }

            if (status == 401 || status == 403) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(Map.of(
                                "success", false,
                                "message", "Gemini API key không hợp lệ hoặc chưa được cấp quyền. Hãy kiểm tra cấu hình Backend."
                        ));
            }

            if (status == 404) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(Map.of(
                                "success", false,
                                "message", "Model Gemini hiện không khả dụng cho API key này. Hãy kiểm tra tên model trong AiDoSizeService."
                        ));
            }

            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of(
                            "success", false,
                            "message", "Gemini từ chối yêu cầu phân tích. Hãy kiểm tra log Backend để biết chi tiết."
                    ));

        } catch (ResourceAccessException ex) {
            log.error("Không kết nối được Gemini API:", ex);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "success", false,
                            "message", "Kết nối tới Gemini bị gián đoạn hoặc hết thời gian chờ. Vui lòng thử lại."
                    ));

        } catch (Exception ex) {
            log.error("Lỗi khi phân tích ảnh đo size:", ex);

            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of(
                            "message",
                            "AI chưa phân tích được ảnh. Vui lòng thử ảnh khác."
                    ));
        }
    }
}
