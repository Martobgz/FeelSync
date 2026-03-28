package com.durjavnici.server.controllers;

import com.durjavnici.server.dtos.ApiResponse;
import com.durjavnici.server.dtos.MeasurementRequest;
import com.durjavnici.server.dtos.MeasurementResponse;
import com.durjavnici.server.models.Measurement;
import com.durjavnici.server.models.User;
import com.durjavnici.server.services.measurements.MeasurementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/measurements")
@RequiredArgsConstructor
public class MeasurementController {
    private final MeasurementService measurementService;

    @PostMapping
    public ResponseEntity<ApiResponse> create(@AuthenticationPrincipal User currentUser,
                                              @Valid @RequestBody MeasurementRequest request) {
        Measurement created = measurementService.create(currentUser, request);

        ApiResponse response = new ApiResponse(
                HttpStatus.CREATED.value(),
                "Measurement created successfully",
                created
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/pulse")
    public ResponseEntity<ApiResponse> getPulseSummary(@AuthenticationPrincipal User currentUser,@RequestParam(defaultValue = "7") int days) {
        MeasurementResponse measurements = measurementService.getPulse(currentUser.getPatient(), days);

        ApiResponse response = new ApiResponse(
                HttpStatus.OK.value(),
                "User state checked successfully",
                Map.of("measurements", measurements)
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/spo2")
    public ResponseEntity<ApiResponse> getSpo2Summary(@AuthenticationPrincipal User currentUser,@RequestParam(defaultValue = "7") int days) {
        MeasurementResponse measurements = measurementService.getSpo2(currentUser.getPatient(), days);

        ApiResponse response = new ApiResponse(
                HttpStatus.OK.value(),
                "User state checked successfully",
                Map.of("measurements", measurements)
        );

        return ResponseEntity.ok(response);
    }
}

