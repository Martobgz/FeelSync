package com.durjavnici.server.services.measurements;

import com.durjavnici.server.dtos.GsrDistribution;
import com.durjavnici.server.dtos.MeasurementRequest;
import com.durjavnici.server.dtos.NightlySleepEntry;
import com.durjavnici.server.dtos.TimestampedPulse;
import com.durjavnici.server.models.Measurement;
import com.durjavnici.server.models.User;

import java.util.List;

public interface MeasurementService {

    Measurement create(User authenticatedUser, MeasurementRequest request);

    /** Timestamped pulse readings for the last {@code days} days. Guardian-only. */
    List<TimestampedPulse> getPulse(User patient, int days);

    /** Per-night sleep hours inferred from STILL movement at night. Guardian-only. */
    List<NightlySleepEntry> getSleep(User patient, int days);

    /** Distribution of GSR states over the last {@code days} days. Guardian-only. */
    GsrDistribution getGsr(User patient, int days);

    boolean checkUserState(Long userId);
}
