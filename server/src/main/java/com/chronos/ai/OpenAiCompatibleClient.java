package com.chronos.ai;

import com.chronos.ai.dto.AiBreakdownPreviewRequest;
import com.chronos.ai.dto.AiBreakdownPreviewResponse;
import com.chronos.ai.dto.AiBreakdownPreviewResponse.BreakdownPhase;
import com.chronos.ai.dto.AiBreakdownPreviewResponse.BreakdownTask;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class OpenAiCompatibleClient {
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(45);
    private static final String SYSTEM_PROMPT = """
            You are Chronos, a study task planning assistant.
            Return JSON only, no markdown.
            The JSON schema is:
            {
              "projectName": "short project name",
              "phases": [
                {
                  "name": "phase name",
                  "weeks": 1,
                  "tasks": [
                    {
                      "title": "task title",
                      "description": "task description",
                      "estimatedMinutes": 30,
                      "priority": "LOW|MEDIUM|HIGH|URGENT",
                      "subTasks": []
                    }
                  ]
                }
              ],
              "firstAction": {
                "title": "first action",
                "description": "smallest useful next step",
                "estimatedMinutes": 30,
                "priority": "MEDIUM",
                "subTasks": []
              }
            }
            Keep the plan practical and small enough for a student to start today.
            """;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public OpenAiCompatibleClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public AiBreakdownPreviewResponse generateBreakdown(
            AiBreakdownPreviewRequest request,
            String baseUrl,
            String apiKey,
            String model
    ) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "model", model,
                    "temperature", 0.3,
                    "response_format", Map.of("type", "json_object"),
                    "messages", List.of(
                            Map.of("role", "system", "content", SYSTEM_PROMPT),
                            Map.of(
                                    "role", "user",
                                    "content", "Goal: " + request.goal() + "\nWeeks: " + request.weeks()
                            )
                    )
            ));

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(normalizeBaseUrl(baseUrl) + "/chat/completions"))
                    .timeout(REQUEST_TIMEOUT)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("AI provider returned HTTP " + response.statusCode() + ": " + limit(response.body()));
            }

            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("choices").path(0).path("message").path("content").asText("");
            if (content.isBlank()) {
                throw new IllegalStateException("AI provider response did not include message content.");
            }

            GeneratedBreakdown generated = objectMapper.readValue(stripJsonFence(content), GeneratedBreakdown.class);
            validate(generated);
            return new AiBreakdownPreviewResponse(
                    UUID.randomUUID().toString(),
                    generated.projectName(),
                    request.goal(),
                    generated.phases(),
                    generated.firstAction()
            );
        } catch (IOException e) {
            throw new IllegalStateException("AI provider response could not be parsed: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI provider request was interrupted.", e);
        }
    }

    private static String normalizeBaseUrl(String baseUrl) {
        String trimmed = baseUrl == null ? "" : baseUrl.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private static String stripJsonFence(String content) {
        String trimmed = content.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstNewline >= 0 && lastFence > firstNewline) {
                return trimmed.substring(firstNewline + 1, lastFence).trim();
            }
        }
        return trimmed;
    }

    private static String limit(String value) {
        if (value == null) return "";
        return value.length() <= 500 ? value : value.substring(0, 500);
    }

    private static void validate(GeneratedBreakdown generated) {
        if (generated.projectName() == null || generated.projectName().isBlank()) {
            throw new IllegalStateException("AI provider response is missing projectName.");
        }
        if (generated.phases() == null || generated.phases().isEmpty()) {
            throw new IllegalStateException("AI provider response is missing phases.");
        }
        if (generated.firstAction() == null || generated.firstAction().title() == null || generated.firstAction().title().isBlank()) {
            throw new IllegalStateException("AI provider response is missing firstAction.");
        }
    }

    private record GeneratedBreakdown(
            String projectName,
            List<BreakdownPhase> phases,
            BreakdownTask firstAction
    ) {
    }
}
