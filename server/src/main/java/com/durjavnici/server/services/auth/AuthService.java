package com.durjavnici.server.services.auth;

import com.durjavnici.server.dtos.AuthResponse;
import com.durjavnici.server.dtos.LoginRequest;
import com.durjavnici.server.dtos.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}