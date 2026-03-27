package com.durjavnici.server.dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;

import java.util.List;

@Getter
public class TimeWindowRequest {
    @NotNull
    @Size(min = 1)
    private List<@Min(0) @Max(23) Integer> hours;
}

