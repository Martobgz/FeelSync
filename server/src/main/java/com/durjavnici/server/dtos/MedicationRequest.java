package com.durjavnici.server.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class MedicationRequest {

    @NotBlank
    private String name;

    @NotNull
    private Integer currentAmount;

    @NotNull
    private Integer dailyDose;

    private List<String> intakeTimes;   // ["HH:mm", ...]

    private boolean wristbandNotifications;
}
