package com.durjavnici.server.controllers;

import com.durjavnici.server.dtos.ApiResponse;
import com.durjavnici.server.dtos.TimeWindowRequest;
import com.durjavnici.server.dtos.TimeWindowResponse;
import com.durjavnici.server.services.time.TimeWindowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/time")
@RequiredArgsConstructor
public class TimeController {
    private final TimeWindowService timeWindowService;

    @PostMapping("/window-ms")
    public ResponseEntity<ApiResponse> calculateWindowMs(@Valid @RequestBody TimeWindowRequest request) {
        TimeWindowResponse result = timeWindowService.calculateWindowMs(request.getHours());

        ApiResponse response = new ApiResponse(
                HttpStatus.OK.value(),
                "Time windows calculated successfully",
                result
        );
        return ResponseEntity.ok(response);
    }
}

