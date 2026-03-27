package com.durjavnici.server.dtos;


import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class DatedMeasurement {
    private Instant timestamp;
    private Float measurement;
}
