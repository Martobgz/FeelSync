package com.durjavnici.server.services.measurements;

import com.durjavnici.server.dtos.MeasurementRequest;
import com.durjavnici.server.dtos.MeasurementResponse;
import com.durjavnici.server.models.Measurement;
import com.durjavnici.server.models.User;

public interface MeasurementService {

    Measurement create(User authenticatedUser, MeasurementRequest request);

    MeasurementResponse getPulse(User patient, int days);

    MeasurementResponse getSpo2(User patient, int days);

    boolean checkUserState(Long userId);
}

