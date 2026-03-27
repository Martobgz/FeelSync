package com.durjavnici.server.services.notifications;

public interface NotificationService {
    void sendRiskAlert(String expoPushToken, String riskType);
}

