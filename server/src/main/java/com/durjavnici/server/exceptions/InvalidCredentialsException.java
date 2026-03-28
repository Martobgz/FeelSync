package com.durjavnici.server.exceptions;

public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() {
        super("Invalid credentials");
    }
    public InvalidCredentialsException(String message) {
        super(message);
    }
}
