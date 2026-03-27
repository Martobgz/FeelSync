package com.durjavnici.server.exceptions;

public class ExpoPushTokenMissingException extends RuntimeException {
    public ExpoPushTokenMissingException() {
        super("Expo push token is missing for this device");
    }
}

