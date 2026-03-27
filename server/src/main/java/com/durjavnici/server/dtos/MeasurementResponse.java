package com.durjavnici.server.dtos;


import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class MeasurementResponse {
    List<Float> measurements;
}
