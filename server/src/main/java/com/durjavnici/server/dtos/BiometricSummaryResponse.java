package com.durjavnici.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class BiometricSummaryResponse {

    private List<DailyHeartRateResponse> heartRate;
    private List<NightlySleepResponse> sleep;

    @Getter
    @AllArgsConstructor
    public static class DailyHeartRateResponse {
        private String date;   // YYYY-MM-DD
        private double avg;
        private double min;
        private double max;
        private boolean anomaly;
    }

    @Getter
    @AllArgsConstructor
    public static class NightlySleepResponse {
        private String date;   // YYYY-MM-DD (the morning date of the sleep night)
        private double hours;
        private boolean anomaly;
    }
}
