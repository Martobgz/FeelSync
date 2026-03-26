package com.durjavnici.server.services.auth;

import com.durjavnici.server.dtos.AuthResponse;
import com.durjavnici.server.dtos.LoginRequest;
import com.durjavnici.server.dtos.RegisterRequest;
import com.durjavnici.server.exceptions.EmailAlreadyExistsException;
import com.durjavnici.server.exceptions.InvalidCredentialsException;
import com.durjavnici.server.exceptions.UsernameAlreadyExistsException;
import com.durjavnici.server.jwt.JwtProvider;
import com.durjavnici.server.models.User;
import com.durjavnici.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration attempt with already existing email: {}", request.getEmail());
            throw new EmailAlreadyExistsException(request.getEmail());
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            log.warn("Registration attempt with already existing username: {}", request.getUsername());
            throw new UsernameAlreadyExistsException(request.getUsername());
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                encodedPassword);

        userRepository.save(user);

        String token = jwtProvider.generateToken(user.getUsername(), user.getEmail());
        log.info("User registered and authenticated: {}", user.getUsername());

        return new AuthResponse(token, "User registered and authenticated successfully");
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseGet(() -> userRepository.findByEmail(request.getUsername())
                        .orElse(null));

        if (user == null) {
            log.warn("Login attempt with non-existent username or email: {}", request.getUsername());
            throw new InvalidCredentialsException();
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Login attempt with incorrect password for username/email: {}", request.getUsername());
            throw new InvalidCredentialsException();
        }

        String token = jwtProvider.generateToken(user.getUsername(), user.getEmail());
        log.info("User successfully logged in and authenticated: {}", user.getUsername());

        return new AuthResponse(token, "Login successful");
    }
}
