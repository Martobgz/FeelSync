package com.durjavnici.server.exceptions;

import com.durjavnici.server.dtos.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        log.warn("Validation failed: {}", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(HttpStatus.BAD_REQUEST.value(), message, null));
    }

    @ExceptionHandler(ExpoPushTokenMissingException.class)
    public ResponseEntity<ApiResponse> handleExpoPushTokenMissing(ExpoPushTokenMissingException ex) {
        log.warn("Expo push token missing: {}", ex.getMessage());

        ApiResponse response = new ApiResponse(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                null
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiResponse> handleEmailExists(EmailAlreadyExistsException ex) {
        log.warn("Email already exists: {}", ex.getMessage());

        ApiResponse response = new ApiResponse(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                null
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(UsernameAlreadyExistsException.class)
    public ResponseEntity<ApiResponse> handleUsernameExists(UsernameAlreadyExistsException ex) {
        log.warn("Username already exists: {}", ex.getMessage());

        ApiResponse response = new ApiResponse(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                null
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse> handleInvalidCredentials(InvalidCredentialsException ex) {
        log.warn("Invalid login attempt");

        ApiResponse response = new ApiResponse(
                HttpStatus.UNAUTHORIZED.value(),
                ex.getMessage(),
                null
        );

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleGenericException(Exception ex) {
        log.error("Unexpected error occurred", ex);

        ApiResponse response = new ApiResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected error occurred",
                null
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}

