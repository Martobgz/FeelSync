package com.durjavnici.server.services.biometrics;

import com.durjavnici.server.dtos.BiometricBlockRequest;
import com.durjavnici.server.dtos.BiometricSummaryResponse;
import com.durjavnici.server.models.User;

import java.util.List;

public interface BiometricsService {
    void saveBatch(User patient, List<BiometricBlockRequest> blocks);
    BiometricSummaryResponse getSummary(User guardian, int days);
}
