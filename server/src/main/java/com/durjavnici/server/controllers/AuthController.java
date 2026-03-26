package com.durjavnici.server.controllers;

import com.durjavnici.server.dtos.ApiResponse;
import com.durjavnici.server.dtos.AuthResponse;
import com.durjavnici.server.dtos.LoginRequest;
import com.durjavnici.server.dtos.RegisterRequest;
import com.durjavnici.server.services.auth.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        AuthResponse authResponse = authService.register(request);
        ApiResponse response = new ApiResponse(
                HttpStatus.CREATED.value(),
                "User registered successfully",
                authResponse
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        AuthResponse authResponse = authService.login(request);
        ApiResponse response = new ApiResponse(
                HttpStatus.OK.value(),
                "Login successful",
                authResponse
        );
        return ResponseEntity.ok(response);
    }
}
