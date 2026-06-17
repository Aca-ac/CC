package com.chronos.ai.provider;

import com.chronos.ai.provider.dto.AiProviderException;
import com.chronos.ai.provider.dto.ChatCompletionRequest;
import com.chronos.ai.provider.dto.ChatCompletionResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * DeepSeek AI 提供商适配器，使用 OpenAI-compatible chat completions API。
 */
public class DeepSeekProvider implements AiProvider {

    private static final Logger logger = LoggerFactory.getLogger(DeepSeekProvider.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final String baseUrl;
    private final String model;
    private final String apiKey;
    private final RestTemplate restTemplate;

    public DeepSeekProvider(String baseUrl, String model, String apiKey) {
        this.baseUrl = baseUrl;
        this.model = model;
        this.apiKey = apiKey;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(120));
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public String getProviderName() {
        return "deepseek";
    }

    @Override
    public ChatCompletionResponse chatCompletion(ChatCompletionRequest request) {
        String url = baseUrl + "/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = buildRequestBody(request);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, String.class);

            return parseResponse(response.getBody());
        } catch (HttpStatusCodeException e) {
            int status = e.getStatusCode().value();
            String errorMsg = extractErrorMessage(e.getResponseBodyAsString());
            logger.error("DeepSeek API 错误: status={}, body={}", status, errorMsg);
            throw new AiProviderException("deepseek", status, errorMsg);
        } catch (RestClientException e) {
            logger.error("DeepSeek 网络请求失败: {}", e.getMessage());
            throw new AiProviderException("deepseek", "网络请求失败: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    private Map<String, Object> buildRequestBody(ChatCompletionRequest request) {
        Map<String, String> systemMsg = Map.of("role", "system", "content", request.systemPrompt());
        Map<String, String> userMsg = Map.of("role", "user", "content", request.userMessage());

        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", List.of(systemMsg, userMsg));
        body.put("temperature", request.temperature());
        body.put("max_tokens", request.maxTokens());

        if (request.jsonMode()) {
            body.put("response_format", Map.of("type", "json_object"));
        }

        return body;
    }

    private ChatCompletionResponse parseResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode choice = root.path("choices").get(0);
            String content = choice.path("message").path("content").asText();
            String finishReason = choice.path("finish_reason").asText("stop");
            String modelName = root.path("model").asText(model);
            int promptTokens = root.path("usage").path("prompt_tokens").asInt(0);
            int completionTokens = root.path("usage").path("completion_tokens").asInt(0);

            return new ChatCompletionResponse(content, modelName, promptTokens, completionTokens, finishReason);
        } catch (Exception e) {
            logger.error("解析 DeepSeek 响应失败: {}", responseBody);
            throw new AiProviderException("deepseek", "响应解析失败: " + e.getMessage(), e);
        }
    }

    private String extractErrorMessage(String errorBody) {
        try {
            JsonNode root = objectMapper.readTree(errorBody);
            JsonNode error = root.path("error");
            return error.path("message").asText(error.toString());
        } catch (Exception e) {
            return errorBody;
        }
    }
}
