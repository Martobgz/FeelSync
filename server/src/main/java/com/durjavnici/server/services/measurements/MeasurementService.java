package com.durjavnici.server.services.measurements;

import com.durjavnici.server.dtos.MeasurementRequest;
import com.durjavnici.server.models.Measurement;

public interface MeasurementService {

    Measurement create(MeasurementRequest request);

    boolean checkUserState(Long userId);
}

