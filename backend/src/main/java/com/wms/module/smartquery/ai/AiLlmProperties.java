package com.wms.module.smartquery.ai;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ai.llm")
public class AiLlmProperties {
    private boolean enabled = true;
    private String apiKey;
    private String baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    private String model = "gemini-3.8-flash";
    private int maxTokens = 1000;
    private double temperature = 0.1;
    private int timeoutMs = 30000;
}
