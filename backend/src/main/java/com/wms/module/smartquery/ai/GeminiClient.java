package com.wms.module.smartquery.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiClient {
    private static final List<String> RESILIENT_MODELS = List.of(
            "gemini-3-flash-preview",
            "gemini-flash-lite-latest",
            "gemini-3.1-flash-lite",
            "gemini-3.8-flash"
    );
    private final AiLlmProperties properties;
    private final ObjectMapper objectMapper;

    @FunctionalInterface
    public interface ToolExecutor {
        Map<String, Object> execute(String toolName, Map<String, Object> args);
    }

    public boolean isAvailable() {
        return properties.isEnabled()
                && properties.getApiKey() != null
                && !properties.getApiKey().isBlank();
    }

    public String generate(String systemInstruction, String prompt, boolean jsonMode) {
        if (!isAvailable()) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Trợ lý Gemini chưa được cấu hình GEMINI_API_KEY ở backend");
        }

        Map<String, Object> generationConfig = new java.util.HashMap<>();
        generationConfig.put("temperature", properties.getTemperature());
        generationConfig.put("maxOutputTokens", properties.getMaxTokens());
        if (jsonMode) generationConfig.put("responseMimeType", "application/json");

        Map<String, Object> body = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", systemInstruction))),
                "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", prompt)))),
                "generationConfig", generationConfig
        );

        try {
            String response = postGenerateContentWithFallback(body);
            JsonNode root = objectMapper.readTree(response);
            JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
            StringBuilder textBuilder = new StringBuilder();
            if (parts.isArray()) {
                for (JsonNode part : parts) {
                    if (!part.path("thought").asBoolean(false) && part.has("text")) {
                        textBuilder.append(part.get("text").asText());
                    }
                }
            }
            String text = textBuilder.toString().trim();
            if (text.isBlank()) throw new IllegalStateException("Gemini không trả về nội dung");
            return text;
        } catch (BusinessException be) {
            throw be;
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Không thể kết nối Gemini: " + ex.getMessage());
        }
    }

    /**
     * Vòng lặp Gemini Function Calling (tối đa 4 bước gọi Tool liên tiếp) chuẩn REST API.
     */
    public String runFunctionCallingLoop(
            String systemInstruction,
            String userPrompt,
            List<Map<String, Object>> functionDeclarations,
            ToolExecutor executor
    ) {
        if (!isAvailable()) {
            throw new IllegalStateException("GEMINI_API_KEY chưa được cấu hình");
        }

        List<Map<String, Object>> contents = new ArrayList<>();
        contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", userPrompt))));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", properties.getTemperature());
        generationConfig.put("maxOutputTokens", properties.getMaxTokens());

        List<Map<String, Object>> tools = List.of(Map.of("functionDeclarations", functionDeclarations));

        for (int round = 0; round < 4; round++) {
            Map<String, Object> body = new HashMap<>();
            body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", systemInstruction))));
            body.put("contents", contents);
            body.put("tools", tools);
            body.put("generationConfig", generationConfig);

            String response = postGenerateContentWithFallback(body);

            try {
                JsonNode root = objectMapper.readTree(response);
                JsonNode modelContent = root.path("candidates").path(0).path("content");
                JsonNode parts = modelContent.path("parts");

                List<Map<String, Object>> functionCalls = new ArrayList<>();
                StringBuilder finalText = new StringBuilder();

                if (parts.isArray()) {
                    for (JsonNode part : parts) {
                        if (part.has("functionCall")) {
                            JsonNode fc = part.get("functionCall");
                            String name = fc.path("name").asText();
                            Map<String, Object> args = objectMapper.convertValue(
                                    fc.path("args"),
                                    new TypeReference<Map<String, Object>>() {}
                            );
                            functionCalls.add(Map.of("name", name, "args", args != null ? args : Map.of()));
                        } else if (!part.path("thought").asBoolean(false) && part.has("text")) {
                            finalText.append(part.get("text").asText());
                        }
                    }
                }

                if (functionCalls.isEmpty()) {
                    if (round == 0 && contents.size() == 1 && !functionDeclarations.isEmpty()) {
                        contents.add(objectMapper.convertValue(modelContent, new TypeReference<Map<String, Object>>() {}));
                        contents.add(Map.of("role", "user", "parts", List.of(Map.of("text",
                                "Bạn BẮT BUỘC phải gọi ít nhất 1 công cụ đọc dữ liệu được cấp quyền trước khi đưa ra kết luận."))));
                        continue;
                    }
                    String txt = finalText.toString().trim();
                    if (txt.isBlank()) throw new IllegalStateException("Gemini không trả về nội dung");
                    return txt;
                }

                // Lưu turn của model (functionCall) vào lịch sử
                contents.add(objectMapper.convertValue(modelContent, new TypeReference<Map<String, Object>>() {}));

                // Thực thi từng Tool Java và gửi functionResponse lại cho Gemini
                List<Map<String, Object>> responseParts = new ArrayList<>();
                for (Map<String, Object> call : functionCalls) {
                    String name = String.valueOf(call.get("name"));
                    @SuppressWarnings("unchecked")
                    Map<String, Object> args = (Map<String, Object>) call.get("args");
                    Map<String, Object> toolResult = executor.execute(name, args);
                    responseParts.add(Map.of(
                            "functionResponse", Map.of(
                                    "name", name,
                                    "response", Map.of("result", toolResult)
                            )
                    ));
                }
                contents.add(Map.of("role", "user", "parts", responseParts));
            } catch (BusinessException be) {
                throw be;
            } catch (Exception ex) {
                throw new IllegalStateException("Lỗi xử lý Function Calling Gemini: " + ex.getMessage(), ex);
            }
        }
        throw new IllegalStateException("Vượt quá số vòng lặp Function Calling cho phép");
    }

    private String postGenerateContentWithFallback(Map<String, Object> body) {
        LinkedHashSet<String> candidates = new LinkedHashSet<>();
        if (properties.getModel() != null && !properties.getModel().isBlank()) {
            candidates.add(properties.getModel().trim());
        }
        candidates.addAll(RESILIENT_MODELS);

        Exception lastError = null;
        RestClient client = buildRestClient();
        for (String modelName : candidates) {
            try {
                String res = client.post()
                        .uri("/models/{model}:generateContent", modelName)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .body(String.class);
                if (res != null && !res.isBlank()) {
                    return res;
                }
            } catch (HttpStatusCodeException httpEx) {
                int code = httpEx.getStatusCode().value();
                log.warn("Gemini model '{}' trả HTTP {} — thử model dự phòng nếu khả dụng", modelName, code);
                lastError = httpEx;
                // Sai API key (401/403) hoặc bad request cấu trúc (400) không retry sang model khác trừ 404/429/5xx
                if (code == 400 || code == 401 || code == 403) {
                    throw new IllegalStateException("Gemini API HTTP " + code + ": " + httpEx.getResponseBodyAsString(), httpEx);
                }
            } catch (Exception ex) {
                log.warn("Lỗi kết nối Gemini model '{}': {}", modelName, ex.getMessage());
                lastError = ex;
            }
        }
        throw new IllegalStateException("Tất cả model Gemini đều tạm bận hoặc không khả dụng", lastError);
    }

    private RestClient buildRestClient() {
        return RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .defaultHeader("x-goog-api-key", properties.getApiKey())
                .requestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory() {{
                    setConnectTimeout(properties.getTimeoutMs());
                    setReadTimeout(properties.getTimeoutMs());
                }})
                .build();
    }
}
