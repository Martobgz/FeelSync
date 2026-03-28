package com.durjavnici.server.dtos;

import com.durjavnici.server.models.MovementType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MeasurementRequest {
    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("300.0")
    private Float pulse;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private Float spo2;

    @NotNull
    private MovementType movement;

    // GSR-derived state from ESP32 (nullable — older clients may not send it)
    private Integer gsrState;
}

