package com.wms.module.smartquery.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GeminiClient {
    private final AiLlmProperties properties;
    private final ObjectMapper objectMapper;

    public String generate(String systemInstruction, String prompt, boolean jsonMode) {
        if (!properties.isEnabled() || properties.getApiKey() == null || properties.getApiKey().isBlank()) {
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
            RestClient client = RestClient.builder()
                    .baseUrl(properties.getBaseUrl())
                    .defaultHeader("x-goog-api-key", properties.getApiKey())
                    .requestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory() {{
                        setConnectTimeout(properties.getTimeoutMs());
                        setReadTimeout(properties.getTimeoutMs());
                    }})
                    .build();
            String response = client.post()
                    .uri("/models/{model}:generateContent", properties.getModel())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            JsonNode root = objectMapper.readTree(response);
            String text = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText();
            if (text == null || text.isBlank()) throw new IllegalStateException("Gemini không trả về nội dung");
            return text;
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Không thể kết nối Gemini: " + ex.getMessage());
        }
    }
}
