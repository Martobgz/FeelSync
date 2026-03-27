package com.durjavnici.server.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BiometricBlockRequest {

    private String timestamp;

    @JsonProperty("avg_hr")
    private double avgHr;

    @JsonProperty("min_hr")
    private double minHr;

    @JsonProperty("max_hr")
    private double maxHr;

    @JsonProperty("hr_sample_count")
    private int hrSampleCount;

    @JsonProperty("avg_movement")
    private double avgMovement;
}
