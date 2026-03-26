package com.durjavnici.server.controllers;

import com.durjavnici.server.dtos.ApiResponse;
import com.durjavnici.server.dtos.MeasurementRequest;
import com.durjavnici.server.models.Measurement;
import com.durjavnici.server.services.measurements.MeasurementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/measurements")
@RequiredArgsConstructor
public class MeasurementController {
    private final MeasurementService measurementService;

    @PostMapping
    public ResponseEntity<ApiResponse> create(@Valid @RequestBody MeasurementRequest request) {
        Measurement created = measurementService.create(request);

        ApiResponse response = new ApiResponse(
                HttpStatus.CREATED.value(),
                "Measurement created successfully",
                created
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

