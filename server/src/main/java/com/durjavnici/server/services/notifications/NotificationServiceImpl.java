package com.durjavnici.server.services.notifications;

import com.durjavnici.server.exceptions.ExpoPushTokenMissingException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Service
public class NotificationServiceImpl implements NotificationService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final RestClient restClient;

    public NotificationServiceImpl(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    @Override
    public void sendRiskAlert(String expoPushToken, String riskType) {
        if (expoPushToken == null || expoPushToken.isBlank()) {
            throw new ExpoPushTokenMissingException();
        }

        String title = "FeelSync alert";
        String body = "Please open FeelSync to review your latest check-in.";

        Map<String, Object> payload = Map.of(
                "to", expoPushToken,
                "title", title,
                "body", body,
                "data", Map.of(
                        "riskType", riskType == null ? "" : riskType
                )
        );

        try {
            String responseBody = restClient.post()
                    .uri(EXPO_PUSH_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            log.info("Expo push sent. riskType={} tokenPrefix={} response={}",
                    riskType,
                    safeTokenPrefix(expoPushToken),
                    responseBody);
        } catch (Exception e) {
            log.error("Failed to send Expo push. riskType={} tokenPrefix={}",
                    riskType,
                    safeTokenPrefix(expoPushToken),
                    e);
        }
    }

    private String safeTokenPrefix(String token) {
        if (token == null) return "null";
        int end = Math.min(token.length(), 18);
        return token.substring(0, end);
    }
}

