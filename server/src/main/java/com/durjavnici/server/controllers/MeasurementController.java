package com.durjavnici.server.controllers;

import com.durjavnici.server.dtos.ApiResponse;
import com.durjavnici.server.dtos.GsrDistribution;
import com.durjavnici.server.dtos.MeasurementRequest;
import com.durjavnici.server.dtos.NightlySleepEntry;
import com.durjavnici.server.dtos.TimestampedPulse;
import com.durjavnici.server.models.Measurement;
import com.durjavnici.server.models.User;
import com.durjavnici.server.services.measurements.MeasurementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/measurements")
@RequiredArgsConstructor
public class MeasurementController {
    private final MeasurementService measurementService;

    @PostMapping
    public ResponseEntity<ApiResponse> create(@AuthenticationPrincipal User currentUser,
                                              @Valid @RequestBody MeasurementRequest request) {
        Measurement created = measurementService.create(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse(HttpStatus.CREATED.value(), "Measurement created successfully", created));
    }

    /** Guardian-only: timestamped pulse readings for the linked patient. */
    @GetMapping("/pulse")
    public ResponseEntity<ApiResponse> getPulse(@AuthenticationPrincipal User currentUser,
                                                @RequestParam(defaultValue = "7") int days) {
        List<TimestampedPulse> data = measurementService.getPulse(currentUser.getPatient(), days);
        return ResponseEntity.ok(new ApiResponse(HttpStatus.OK.value(), "OK", data));
    }

    /** Guardian-only: per-night sleep hours for the linked patient. */
    @GetMapping("/sleep")
    public ResponseEntity<ApiResponse> getSleep(@AuthenticationPrincipal User currentUser,
                                                @RequestParam(defaultValue = "7") int days) {
        List<NightlySleepEntry> data = measurementService.getSleep(currentUser.getPatient(), days);
        return ResponseEntity.ok(new ApiResponse(HttpStatus.OK.value(), "OK", data));
    }

    /** Guardian-only: GSR state distribution for the linked patient. */
    @GetMapping("/gsr")
    public ResponseEntity<ApiResponse> getGsr(@AuthenticationPrincipal User currentUser,
                                              @RequestParam(defaultValue = "7") int days) {
        GsrDistribution data = measurementService.getGsr(currentUser.getPatient(), days);
        return ResponseEntity.ok(new ApiResponse(HttpStatus.OK.value(), "OK", data));
    }
}
