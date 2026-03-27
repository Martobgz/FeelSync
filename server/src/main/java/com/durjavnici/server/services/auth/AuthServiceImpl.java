package com.durjavnici.server.services.auth;

import com.durjavnici.server.dtos.AuthResponse;
import com.durjavnici.server.dtos.RegisterRequest;
import com.durjavnici.server.exceptions.EmailAlreadyExistsException;
import com.durjavnici.server.exceptions.InvalidCredentialsException;
import com.durjavnici.server.exceptions.UsernameAlreadyExistsException;
import com.durjavnici.server.jwt.JwtProvider;
import com.durjavnici.server.models.User;
import com.durjavnici.server.models.UserType;
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
        String patientUsername = request.getPatientUsername();

        User patient = null;

        if (request.getUserType() != UserType.PATIENT) {

            if (patientUsername != null && !patientUsername.isBlank()) {

                patient = userRepository.findByUsername(patientUsername)
                        .orElseThrow(() -> {
                            log.warn("Registration with non-existing patient username: {}", patientUsername);
                            return new InvalidCredentialsException(
                                    "Patient username does not exist: " + patientUsername
                            );
                        });
            }
        }

        if(patient != null && patient.getUserType() != UserType.PATIENT) {
            log.warn("Registration with invalid patient association: {} is not a patient", patientUsername);
            throw new InvalidCredentialsException(
                    "Associated user is not a patient: " + patientUsername
            );

        } else {
            log.info("Registering user without patient association: {}", request.getUsername());
        }

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                encodedPassword,
                request.getExpoPushToken(),
                request.getUserType(),
                patient
        );

        userRepository.save(user);

        String token = jwtProvider.generateToken(user.getUsername(), user.getEmail());
        log.info("User registered and authenticated: {}", user.getUsername());

        return new AuthResponse(token, "User registered and authenticated successfully");
    }
}
