package com.durjavnici.server.services.measurements;

import com.durjavnici.server.dtos.MeasurementRequest;
import com.durjavnici.server.dtos.MeasurementResponse;
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
import java.time.temporal.ChronoUnit;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@EnableScheduling
public class MeasurementServiceImpl implements MeasurementService {

    private static final double HEART_RATE_STDDEV_MULTIPLIER_THRESHOLD = 2.0;
    private static final double HEART_RATE_MULTIPLIER_THRESHOLD = 1.6;
    private static final double HIGH_READINGS_PERCENT_THRESHOLD = 70.0;

    private final MeasurementRepository measurementRepository;
    private final UserStatsRepository userStatsRepository;
    private final NotificationService notificationService;

    @Override
    public Measurement create(User authenticatedUser, MeasurementRequest request) {
        Measurement measurement = new Measurement(
                request.getPulse(),
                request.getSpo2(),
                request.getMovement(),
                authenticatedUser
        );
        return measurementRepository.save(measurement);
    }

    @Scheduled(fixedDelayString = "${measurements.check.interval-ms:900000}")
    public void checkAllUsersState() {
        List<UserStats> allStats = userStatsRepository.findAll();

        for (UserStats stats : allStats) {
            Long userId = stats.getUser().getId();

            boolean isAtRisk = checkUserState(userId);

            if (isAtRisk) {
                System.out.println("User " + userId + " is at risk!");
                // notificationService.sendRiskAlert(stats.getUser().getExpoPushToken(),
                // "Your recent measurements indicate a potential health risk.");
            }
        }
    }

    @Override
    public boolean checkUserState(Long userId) {
        Optional<UserStats> maybeStats = userStatsRepository.findByUserId(userId);
        if (maybeStats.isEmpty()) {
            return false;
        }

        List<Measurement> recentMeasurements = getRecentMeasurementsForUser(userId);
        if (recentMeasurements.isEmpty()) {
            return false;
        }

        return analyzeRecentMeasurements(recentMeasurements, maybeStats.get());
    }

    @Scheduled(fixedDelayString = "${measurements.stats.recalculation-interval-ms:1200000}")
    public void recalculateUserStats() {
        List<Measurement> allMeasurements = measurementRepository.findAll();

        Map<User, List<Measurement>> measurementsByUser = allMeasurements.stream()
                .collect(Collectors.groupingBy(Measurement::getUser));

        measurementsByUser.forEach((user, measurements) -> {
            if (measurements.isEmpty()) {
                return;
            }

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

    private List<Measurement> getRecentMeasurementsForUser(Long userId) {
        Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        return measurementRepository.findByUserIdAndCreatedAtAfter(userId, oneHourAgo);
    }

    private boolean analyzeRecentMeasurements(List<Measurement> recentMeasurements, UserStats baseline) {
        double baselineAvg = baseline.getAverageHeartRate();
        double baselineStdDev = baseline.getHeartRateStdDev();

        if (recentMeasurements.isEmpty()) {
            return false;
        }

        long totalConsidered = 0;
        long highReadings = 0;

        for (Measurement measurement : recentMeasurements) {
            if (!isLowActivity(measurement.getMovement())) {
                continue;
            }

            totalConsidered++;

            double pulse = measurement.getPulse();
            double stdDevBasedThreshold = baselineAvg + HEART_RATE_STDDEV_MULTIPLIER_THRESHOLD * baselineStdDev;
            double multiplierThreshold = baselineAvg * HEART_RATE_MULTIPLIER_THRESHOLD;
            double highThreshold = Math.max(stdDevBasedThreshold, multiplierThreshold);

            if (pulse > highThreshold) {
                highReadings++;
            }
        }

        if (totalConsidered == 0) {
            return false;
        }

        double highPercentage = (highReadings * 100.0d) / (double) totalConsidered;

        return highPercentage >= HIGH_READINGS_PERCENT_THRESHOLD;
    }

    private boolean isLowActivity(MovementType movementType) {
        return movementType == MovementType.STILL;
    }

    @Override
    public MeasurementResponse getPulse(User patient, int days) {
        if (patient == null) {
            throw new IllegalArgumentException("Patient cannot be null");
        }

        Instant fromDate = Instant.now().minus(days, java.time.temporal.ChronoUnit.DAYS);

        List<Measurement> measurements = measurementRepository
                .findByUserIdAndCreatedAtAfter(patient.getId(), fromDate);

        List<Float> pulseValues = measurements.stream()
                .map(Measurement::getPulse)
                .toList();

        return new MeasurementResponse(pulseValues);
    }

        @Override
        public MeasurementResponse getSpo2(User patient, int days) {
            if (patient == null) {
                throw new IllegalArgumentException("Patient cannot be null");
            }

            Instant fromDate = Instant.now().minus(days, java.time.temporal.ChronoUnit.DAYS);

            List<Measurement> measurements = measurementRepository
                    .findByUserIdAndCreatedAtAfter(patient.getId(), fromDate);

            List<Float> spo2Values = measurements.stream()
                    .map(Measurement::getSpo2)
                    .toList();

            return new MeasurementResponse(spo2Values);
        }
    }