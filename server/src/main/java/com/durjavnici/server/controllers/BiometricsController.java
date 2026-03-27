package com.durjavnici.server.controllers;

import com.durjavnici.server.dtos.ApiResponse;
import com.durjavnici.server.dtos.BiometricBlockRequest;
import com.durjavnici.server.dtos.BiometricSummaryResponse;
import com.durjavnici.server.models.User;
import com.durjavnici.server.services.biometrics.BiometricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/biometrics")
@RequiredArgsConstructor
public class BiometricsController {

    private final BiometricsService biometricsService;

    @PostMapping("/batch")
    public ResponseEntity<ApiResponse> saveBatch(
            @AuthenticationPrincipal User currentUser,
            @RequestBody List<BiometricBlockRequest> blocks) {

        biometricsService.saveBatch(currentUser, blocks);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse(201, "Batch saved", null));
    }

    @GetMapping("/summary")
    public ResponseEntity<BiometricSummaryResponse> getSummary(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "7") int days) {

        BiometricSummaryResponse summary = biometricsService.getSummary(currentUser, days);
        return ResponseEntity.ok(summary);
    }
}
