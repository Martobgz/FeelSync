package com.durjavnici.server.services.measurements;

import com.durjavnici.server.dtos.GsrDistribution;
import com.durjavnici.server.dtos.MeasurementRequest;
import com.durjavnici.server.dtos.NightlySleepEntry;
import com.durjavnici.server.dtos.TimestampedPulse;
import com.durjavnici.server.models.Measurement;
import com.durjavnici.server.models.MovementType;
import com.durjavnici.server.models.User;
import com.durjavnici.server.models.UserStats;
import com.durjavnici.server.repositories.MeasurementRepository;
import com.durjavnici.server.repositories.UserStatsRepository;
import com.durjavnici.server.services.notifications.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.util.DoubleSummaryStatistics;

@Service
@RequiredArgsConstructor
@EnableScheduling
public class MeasurementServiceImpl implements MeasurementService {

    private static final double HEART_RATE_STDDEV_MULTIPLIER_THRESHOLD = 2.0;
    private static final double HEART_RATE_MULTIPLIER_THRESHOLD = 1.6;
    private static final double HIGH_READINGS_PERCENT_THRESHOLD = 70.0;

    /** Minutes represented by each measurement (ESP32 SEND_INTERVAL_MS = 300 000 ms). */
    private static final double MINUTES_PER_READING = 5.0;

    private final MeasurementRepository measurementRepository;
    private final UserStatsRepository userStatsRepository;
    private final NotificationService notificationService;

    @Override
    public Measurement create(User authenticatedUser, MeasurementRequest request) {
        Measurement measurement = new Measurement(
                request.getPulse(),
                request.getSpo2(),
                request.getMovement(),
                request.getGsrState(),
                authenticatedUser
        );
        return measurementRepository.save(measurement);
    }

    // ─── Guardian endpoints ──────────────────────────────────────────────────────

    @Override
    public List<TimestampedPulse> getPulse(User patient, int days) {
        if (patient == null) throw new IllegalArgumentException("Patient cannot be null");

        Instant from = Instant.now().minus(days, ChronoUnit.DAYS);
        return measurementRepository
                .findByUserIdAndCreatedAtAfter(patient.getId(), from)
                .stream()
                .map(m -> new TimestampedPulse(m.getCreatedAt().toString(), m.getPulse()))
                .toList();
    }

    @Override
    public List<NightlySleepEntry> getSleep(User patient, int days) {
        if (patient == null) throw new IllegalArgumentException("Patient cannot be null");

        Instant from = Instant.now().minus(days, ChronoUnit.DAYS);
        List<Measurement> measurements = measurementRepository
                .findByUserIdAndCreatedAtAfter(patient.getId(), from);

        // Sleep = STILL movement during nighttime (22:00–08:00 UTC).
        // Each reading represents MINUTES_PER_READING minutes of data.
        // Night date = calendar date of the 22:00 start (readings from 00:00–07:59 belong to the previous date).
        Map<String, Long> stillCountByNight = new LinkedHashMap<>();

        for (Measurement m : measurements) {
            if (m.getMovement() != MovementType.STILL) continue;

            ZonedDateTime zdt = m.getCreatedAt().atZone(ZoneOffset.UTC);
            int hour = zdt.getHour();

            if (hour >= 22 || hour < 8) {
                String nightDate = (hour >= 22)
                        ? zdt.toLocalDate().toString()
                        : zdt.toLocalDate().minusDays(1).toString();
                stillCountByNight.merge(nightDate, 1L, Long::sum);
            }
        }

        return stillCountByNight.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    double hours = Math.round((e.getValue() * MINUTES_PER_READING / 60.0) * 10.0) / 10.0;
                    boolean anomaly = hours < 5.0 || hours > 10.0;
                    return new NightlySleepEntry(e.getKey(), hours, anomaly);
                })
                .toList();
    }

    @Override
    public GsrDistribution getGsr(User patient, int days) {
        if (patient == null) throw new IllegalArgumentException("Patient cannot be null");

        Instant from = Instant.now().minus(days, ChronoUnit.DAYS);
        List<Measurement> measurements = measurementRepository
                .findByUserIdAndCreatedAtAfter(patient.getId(), from);

        int normal = 0, tense = 0, stressed = 0, calm = 0, happy = 0;
        for (Measurement m : measurements) {
            Integer state = m.getGsrState();
            if (state == null) continue;
            switch (state) {
                case 1 -> normal++;
                case 2 -> tense++;
                case 3 -> stressed++;
                case 4 -> calm++;
                case 5 -> happy++;
            }
        }
        return new GsrDistribution(normal, tense, stressed, calm, happy);
    }

    // ─── Scheduled risk detection ────────────────────────────────────────────────

    @Scheduled(fixedDelayString = "${measurements.check.interval-ms:900000}")
    public void checkAllUsersState() {
        List<UserStats> allStats = userStatsRepository.findAll();

        for (UserStats stats : allStats) {
            Long userId = stats.getUser().getId();
            boolean isAtRisk = checkUserState(userId);

            if (isAtRisk) {
                System.out.println("User " + userId + " is at risk!");
                // notificationService.sendRiskAlert(stats.getUser().getExpoPushToken(), "...");
            }
        }
    }

    @Override
    public boolean checkUserState(Long userId) {
        Optional<UserStats> maybeStats = userStatsRepository.findByUserId(userId);
        if (maybeStats.isEmpty()) return false;

        List<Measurement> recentMeasurements = getRecentMeasurementsForUser(userId);
        if (recentMeasurements.isEmpty()) return false;

        return analyzeRecentMeasurements(recentMeasurements, maybeStats.get());
    }

    @Scheduled(fixedDelayString = "${measurements.stats.recalculation-interval-ms:1200000}")
    public void recalculateUserStats() {
        List<Measurement> allMeasurements = measurementRepository.findAll();

        Map<User, List<Measurement>> measurementsByUser = allMeasurements.stream()
                .collect(Collectors.groupingBy(Measurement::getUser));

        measurementsByUser.forEach((user, measurements) -> {
            if (measurements.isEmpty()) return;

            DoubleSummaryStatistics stats = measurements.stream()
                    .map(Measurement::getPulse)
                    .mapToDouble(Float::doubleValue)
                    .summaryStatistics();

            double average = stats.getAverage();
            double variance = measurements.stream()
                    .map(Measurement::getPulse)
                    .mapToDouble(Float::doubleValue)
                    .map(pulse -> {
                        double diff = pulse - average;
                        return diff * diff;
                    })
                    .average()
                    .orElse(0.0d);
            double stdDev = Math.sqrt(variance);

            UserStats userStats = userStatsRepository.findByUserId(user.getId())
                    .orElseGet(() -> new UserStats(user, average, stdDev));

            userStats.setAverageHeartRate(average);
            userStats.setHeartRateStdDev(stdDev);
            userStats.setUpdatedAt(Instant.now());

            userStatsRepository.save(userStats);
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private List<Measurement> getRecentMeasurementsForUser(Long userId) {
        Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        return measurementRepository.findByUserIdAndCreatedAtAfter(userId, oneHourAgo);
    }

    private boolean analyzeRecentMeasurements(List<Measurement> recentMeasurements, UserStats baseline) {
        double baselineAvg = baseline.getAverageHeartRate();
        double baselineStdDev = baseline.getHeartRateStdDev();

        if (recentMeasurements.isEmpty()) return false;

        long totalConsidered = 0;
        long highReadings = 0;

        for (Measurement measurement : recentMeasurements) {
            if (measurement.getMovement() != MovementType.STILL) continue;

            totalConsidered++;
            double pulse = measurement.getPulse();
            double highThreshold = Math.max(
                    baselineAvg + HEART_RATE_STDDEV_MULTIPLIER_THRESHOLD * baselineStdDev,
                    baselineAvg * HEART_RATE_MULTIPLIER_THRESHOLD
            );

            if (pulse > highThreshold) highReadings++;
        }

        if (totalConsidered == 0) return false;

        return (highReadings * 100.0d / totalConsidered) >= HIGH_READINGS_PERCENT_THRESHOLD;
    }
}
