package com.durjavnici.server.controllers;

import com.durjavnici.server.dtos.*;
import com.durjavnici.server.jwt.JwtProvider;
import com.durjavnici.server.models.User;
import com.durjavnici.server.models.UserRole;
import com.durjavnici.server.repositories.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;

    @PatchMapping("/users/me/role")
    public ResponseEntity<AuthResponse> updateRole(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody RoleUpdateRequest request) {

        currentUser.setRole(request.getRole());
        userRepository.save(currentUser);

        String token = jwtProvider.generateToken(currentUser.getUsername(), currentUser.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, "Role updated", currentUser.getRole()));
    }

    @GetMapping("/users/me")
    public ResponseEntity<UserProfileResponse> getMe(@AuthenticationPrincipal User currentUser) {
        boolean patientLinked = currentUser.getPatient() != null;
        return ResponseEntity.ok(new UserProfileResponse(
                currentUser.getId(),
                currentUser.getUsername(),
                currentUser.getEmail(),
                currentUser.getRole(),
                patientLinked
        ));
    }

    @PostMapping("/guardian/link")
    public ResponseEntity<ApiResponse> linkPatient(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody LinkPatientRequest request) {

        if (currentUser.getRole() != UserRole.GUARDIAN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only guardians can link a patient");
        }

        User patient = userRepository.findByEmail(request.getPatientEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No patient found with that email"));

        if (patient.getRole() != UserRole.PATIENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The user with that email is not registered as a patient");
        }

        currentUser.setPatient(patient);
        userRepository.save(currentUser);

        return ResponseEntity.ok(new ApiResponse(200, "Patient linked successfully", null));
    }
}
