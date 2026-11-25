
package com.example.bangiay.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@Service
public class AiDoSizeService {

    private static final Logger LOGGER =
            Logger.getLogger(AiDoSizeService.class.getName());

    private static final String GEMINI_BASE_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/";

    // Model chính và model dự phòng.
    private static final List<String> GEMINI_MODELS = List.of(
            "gemini-3.8-flash",
            "gemini-3.6-flash"
    );

    private static final ObjectMapper MAPPER = new ObjectMapper();

    // Mỗi model được thử tối đa 2 lần.
    private static final int MAX_ATTEMPTS_PER_MODEL = 2;

    private final RestClient restClient = RestClient.builder().build();

    @Value("${GEMINI_API_KEY:}")
    private String apiKey;

    /**
     * Ước lượng size giày từ ảnh bàn chân.
     * Không cần giấy A4, thẻ ngân hàng hay vật chuẩn.
     *
     * Kết quả chỉ mang tính tham khảo vì ảnh không có
     * vật chuẩn nên AI không thể xác định chính xác tỷ lệ cm/pixel.
     */
    public Map<String, Object> analyze(byte[] image, String mimeType)
            throws Exception {

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "Chưa cấu hình GEMINI_API_KEY cho Backend. " +
                            "Hãy thêm API key vào Environment variables rồi khởi động lại."
            );
        }

        if (image == null || image.length == 0) {
            throw new IllegalArgumentException("Ảnh tải lên đang trống.");
        }

        if (mimeType == null || !mimeType.startsWith("image/")) {
            throw new IllegalArgumentException("File tải lên không phải ảnh hợp lệ.");
        }

        String prompt = """
                Bạn là trợ lý AI tư vấn size giày.

                Người dùng chỉ tải lên ảnh bàn chân.
                Không yêu cầu người dùng có giấy A4, thẻ ngân hàng,
                thước đo hoặc bất kỳ vật chuẩn nào.

                Hãy phân tích ảnh và thực hiện:

                1. Kiểm tra ảnh có nhìn thấy bàn chân người thật hay không.
                2. Nếu nhìn thấy bàn chân tương đối rõ, hãy ước lượng
                   chiều dài bàn chân theo cm dựa trên hình dáng,
                   tỷ lệ giải phẫu và các dấu hiệu thị giác.
                3. Người dùng chấp nhận kết quả ước lượng tham khảo,
                   không yêu cầu phép đo chính xác.
                4. Tuyệt đối không khẳng định đây là phép đo chính xác.
                   Không giả vờ biết tỷ lệ pixel/cm khi ảnh không có vật chuẩn.
                5. Nếu ảnh quá mờ, chỉ thấy một phần bàn chân,
                   ảnh giày dép thay vì bàn chân hoặc không nhận diện được,
                   hãy trả detected=false.
                6. Nếu detected=true, lengthCm phải nằm trong khoảng
                   từ 18.0 đến 32.0.
                7. confidence là mức tự tin khi nhận diện ảnh,
                   nằm trong khoảng 0 đến 1.
                   Đây không phải độ chính xác của số đo.
                8. message phải nói rõ đây chỉ là kết quả ước lượng
                   và người dùng nên thử giày để xác nhận.
                9. Chỉ trả về JSON theo schema.
                   Không thêm Markdown hoặc văn bản bên ngoài JSON.

                Hãy ưu tiên nhận diện đúng bàn chân trước khi đưa ra
                kết quả ước lượng. Không tự bịa kết quả nếu ảnh không rõ.
                """;

        Map<String, Object> inlineData = Map.of(
                "mimeType", mimeType,
                "data", Base64.getEncoder().encodeToString(image)
        );

        Map<String, Object> contents = Map.of(
                "parts", List.of(
                        Map.of("inlineData", inlineData),
                        Map.of("text", prompt)
                )
        );

        Map<String, Object> generationConfig = Map.of(
                "temperature", 0.2,
                "responseMimeType", "application/json",
                "responseSchema", responseSchema()
        );

        Map<String, Object> request = Map.of(
                "contents", List.of(contents),
                "generationConfig", generationConfig
        );

        JsonNode response = callGemini(request);

        JsonNode parts = response
                .path("candidates")
                .path(0)
                .path("content")
                .path("parts");

        String jsonText = null;

        if (parts.isArray()) {
            for (JsonNode part : parts) {
                // Bỏ qua phần suy nghĩ nội bộ nếu có.
                if (part.path("thought").asBoolean(false)) {
                    continue;
                }

                if (part.hasNonNull("text")) {
                    jsonText = part.get("text").asText();
                    if (jsonText != null && !jsonText.isBlank()) {
                        break;
                    }
                }
            }
        }

        if (jsonText == null || jsonText.isBlank()) {
            throw new IllegalArgumentException(
                    "AI không trả về kết quả. Vui lòng thử ảnh khác."
            );
        }

        JsonNode result = MAPPER.readTree(jsonText);

        if (!result.path("detected").asBoolean(false)) {
            throw new IllegalArgumentException(
                    "AI chưa nhận diện rõ bàn chân. " +
                            "Hãy tải ảnh chụp trọn bàn chân trần từ trên xuống."
            );
        }

        double lengthCm = result.path("lengthCm").asDouble(Double.NaN);
        double confidence = result.path("confidence").asDouble(0.0);

        // Chuẩn hóa confidence nếu AI trả về dạng 0-100.
        if (confidence > 1 && confidence <= 100) {
            confidence /= 100.0;
        }

        if (!Double.isFinite(lengthCm)
                || lengthCm < 18.0
                || lengthCm > 32.0) {

            throw new IllegalArgumentException(
                    "AI chưa ước lượng được chiều dài hợp lý. " +
                            "Hãy thử ảnh thấy rõ toàn bộ bàn chân."
            );
        }

        if (!Double.isFinite(confidence)
                || confidence < 0
                || confidence > 1) {
            confidence = 0.35;
        }

        double roundedLength =
                Math.round(lengthCm * 10.0) / 10.0;

        String recommendedSize = recommendSize(roundedLength);

        Map<String, Object> output = new LinkedHashMap<>();

        output.put("success", true);
        output.put("lengthCm", roundedLength);
        output.put("recommendedSize", recommendedSize);
        output.put("referenceType", "AI_ESTIMATE");

        // Đây là độ tự tin nhận diện ảnh, không phải độ chính xác số đo.
        output.put("confidence", Math.round(confidence * 100));

        output.put(
                "message",
                "Size được AI ước lượng trực quan từ ảnh. " +
                        "Không có vật chuẩn nên chiều dài cm có thể sai lệch. " +
                        "Hãy thử giày để xác nhận."
        );

        output.put("measurementMode", "VISUAL_ESTIMATE");

        return output;
    }

    /**
     * Gọi model chính trước.
     * Nếu model chính gặp lỗi tạm thời hoặc không khả dụng,
     * tự động chuyển sang model dự phòng.
     */
    private JsonNode callGemini(Map<String, Object> request)
            throws Exception {

        Exception lastError = null;

        for (String model : GEMINI_MODELS) {

            String url = GEMINI_BASE_URL
                    + model
                    + ":generateContent";

            LOGGER.info("Đang gọi Gemini model: " + model);

            for (int attempt = 1;
                 attempt <= MAX_ATTEMPTS_PER_MODEL;
                 attempt++) {

                try {
                    JsonNode response = restClient.post()
                            .uri(url)
                            .header("x-goog-api-key", apiKey)
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(request)
                            .retrieve()
                            .body(JsonNode.class);

                    if (response == null) {
                        throw new IllegalStateException(
                                "Gemini không trả về dữ liệu."
                        );
                    }

                    LOGGER.info(
                            "Gemini xử lý thành công bằng model: " + model
                    );

                    return response;

                } catch (RestClientResponseException ex) {

                    int status = ex.getStatusCode().value();
                    lastError = ex;

                    LOGGER.warning(
                            "Gemini model " + model
                                    + " trả HTTP " + status
                                    + ", lần thử " + attempt
                    );

                    // 404: model không khả dụng, chuyển model tiếp theo.
                    if (status == 404) {
                        break;
                    }

                    // Các lỗi này thường không thể sửa bằng cách đổi model.
                    if (status == 400) {
                        throw new IllegalStateException(
                                "Gemini từ chối dữ liệu gửi lên (HTTP 400). " +
                                        "Hãy kiểm tra định dạng ảnh và cấu hình yêu cầu.",
                                ex
                        );
                    }

                    if (status == 401 || status == 403) {
                        throw new IllegalStateException(
                                "Gemini không cho phép truy cập API. " +
                                        "Hãy kiểm tra API key và quyền sử dụng Gemini API.",
                                ex
                        );
                    }

                    // Lỗi có thể tạm thời: thử lại rồi chuyển model.
                    boolean temporary = status == 429
                            || status == 500
                            || status == 502
                            || status == 503
                            || status == 504;

                    if (!temporary) {
                        throw new IllegalStateException(
                                "Gemini API trả lỗi HTTP " + status
                                        + ". Vui lòng kiểm tra cấu hình Backend.",
                                ex
                        );
                    }

                    if (attempt < MAX_ATTEMPTS_PER_MODEL) {
                        sleepBeforeRetry(attempt);
                    }

                } catch (ResourceAccessException ex) {

                    // Lỗi kết nối, timeout hoặc không truy cập được máy chủ.
                    lastError = ex;

                    LOGGER.warning(
                            "Không kết nối được Gemini model "
                                    + model + ", lần thử " + attempt
                    );

                    if (attempt < MAX_ATTEMPTS_PER_MODEL) {
                        sleepBeforeRetry(attempt);
                    }
                }
            }

            LOGGER.warning(
                    "Model " + model
                            + " không xử lý được. Đang chuyển model tiếp theo."
            );
        }

        throw new IllegalStateException(
                "Cả hai model AI đều chưa xử lý được ảnh. " +
                        "Có thể dịch vụ Gemini đang quá tải hoặc kết nối bị gián đoạn. " +
                        "Vui lòng thử lại sau.",
                lastError
        );
    }

    private void sleepBeforeRetry(int attempt) {
        try {
            // Chờ tăng dần: 1 giây, 2 giây...
            Thread.sleep(attempt * 1000L);

        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "Yêu cầu đo size bị gián đoạn.",
                    ex
            );
        }
    }

    private Map<String, Object> responseSchema() {

        Map<String, Object> properties = new LinkedHashMap<>();

        properties.put(
                "detected",
                Map.of("type", "BOOLEAN")
        );

        properties.put(
                "lengthCm",
                Map.of("type", "NUMBER")
        );

        properties.put(
                "confidence",
                Map.of("type", "NUMBER")
        );

        properties.put(
                "message",
                Map.of("type", "STRING")
        );

        return Map.of(
                "type", "OBJECT",
                "properties", properties,
                "required", List.of(
                        "detected",
                        "lengthCm",
                        "confidence",
                        "message"
                )
        );
    }

    /**
     * Bảng quy đổi size hiện tại của dự án: 39-44.
     * Nếu cửa hàng có bảng size riêng, cần thay theo bảng chính thức.
     */
    private String recommendSize(double cm) {

        double[][] ranges = {
                {24.0, 24.6},
                {24.7, 25.3},
                {25.4, 26.0},
                {26.1, 26.7},
                {26.8, 27.4},
                {27.5, 28.2}
        };

        String[] sizes = {
                "39", "40", "41", "42", "43", "44"
        };

        int nearest = 0;
        double nearestDistance = Double.MAX_VALUE;

        for (int i = 0; i < ranges.length; i++) {

            if (cm >= ranges[i][0] && cm <= ranges[i][1]) {
                return sizes[i];
            }

            double distance = cm < ranges[i][0]
                    ? ranges[i][0] - cm
                    : cm - ranges[i][1];

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = i;
            }
        }

        return sizes[nearest];
    }
}
