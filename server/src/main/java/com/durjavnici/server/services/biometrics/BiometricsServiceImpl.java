package com.durjavnici.server.services.biometrics;

import com.durjavnici.server.dtos.BiometricBlockRequest;
import com.durjavnici.server.dtos.BiometricSummaryResponse;
import com.durjavnici.server.dtos.BiometricSummaryResponse.DailyHeartRateResponse;
import com.durjavnici.server.dtos.BiometricSummaryResponse.NightlySleepResponse;
import com.durjavnici.server.models.BiometricBlock;
import com.durjavnici.server.models.User;
import com.durjavnici.server.repositories.BiometricsRepository;
import com.durjavnici.server.repositories.UserRepository;
import com.durjavnici.server.services.notifications.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BiometricsServiceImpl implements BiometricsService {

    private final BiometricsRepository biometricsRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    public void saveBatch(User patient, List<BiometricBlockRequest> blocks) {
        List<BiometricBlock> entities = blocks.stream().map(b -> new BiometricBlock(
                patient,
                LocalDateTime.parse(b.getTimestamp(), DateTimeFormatter.ISO_DATE_TIME),
                b.getAvgHr(), b.getMinHr(), b.getMaxHr(),
                b.getHrSampleCount(), b.getAvgMovement()
        )).collect(Collectors.toList());

        biometricsRepository.saveAll(entities);
        checkAnomalies(patient, entities);
    }

    private void checkAnomalies(User patient, List<BiometricBlock> blocks) {
        Optional<User> guardianOpt = userRepository.findByPatient(patient);
        if (guardianOpt.isEmpty()) return;

        User guardian = guardianOpt.get();
        if (guardian.getExpoPushToken() == null || guardian.getExpoPushToken().isBlank()) return;

        for (BiometricBlock block : blocks) {
            if (block.getAvgHr() > 110) {
                notificationService.sendRiskAlert(guardian.getExpoPushToken(), "HIGH_HR");
                log.info("HIGH_HR anomaly detected for patient {}", patient.getUsername());
                return; // send at most one alert per batch
            }
            if (block.getAvgHr() > 0 && block.getAvgHr() < 45) {
                notificationService.sendRiskAlert(guardian.getExpoPushToken(), "LOW_HR");
                log.info("LOW_HR anomaly detected for patient {}", patient.getUsername());
                return;
            }
        }
    }

    @Override
    public BiometricSummaryResponse getSummary(User guardian, int days) {
        User patient = guardian.getPatient();
        if (patient == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guardian has no linked patient");
        }

        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<BiometricBlock> blocks = biometricsRepository.findByPatientAndTimestampAfter(patient, since);

        List<DailyHeartRateResponse> heartRate = buildDailyHeartRate(blocks);
        List<NightlySleepResponse> sleep = buildNightlySleep(blocks);

        return new BiometricSummaryResponse(heartRate, sleep);
    }

    private List<DailyHeartRateResponse> buildDailyHeartRate(List<BiometricBlock> blocks) {
        Map<LocalDate, List<BiometricBlock>> byDay = blocks.stream()
                .collect(Collectors.groupingBy(b -> b.getTimestamp().toLocalDate()));

        return byDay.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    List<BiometricBlock> day = e.getValue();
                    double avg = day.stream().mapToDouble(BiometricBlock::getAvgHr).average().orElse(0);
                    double min = day.stream().mapToDouble(BiometricBlock::getMinHr).min().orElse(0);
                    double max = day.stream().mapToDouble(BiometricBlock::getMaxHr).max().orElse(0);
                    boolean anomaly = avg > 100 || (avg > 0 && avg < 50);
                    return new DailyHeartRateResponse(e.getKey().toString(), avg, min, max, anomaly);
                })
                .collect(Collectors.toList());
    }

    // Sleep: blocks where avgHr < 65 AND avgMovement < 0.5 between 22:00 and 10:00
    private List<NightlySleepResponse> buildNightlySleep(List<BiometricBlock> blocks) {
        // Group 5-min sleep blocks by "sleep date" (date of the morning, i.e. if hour < 10 → date, else date+1)
        Map<LocalDate, Long> sleepBlocksByNight = new HashMap<>();

        for (BiometricBlock b : blocks) {
            if (b.getAvgHr() > 0 && b.getAvgHr() < 65 && b.getAvgMovement() < 0.5) {
                int hour = b.getTimestamp().getHour();
                if (hour >= 22 || hour < 10) {
                    LocalDate sleepDate = hour < 10
                            ? b.getTimestamp().toLocalDate()
                            : b.getTimestamp().toLocalDate().plusDays(1);
                    sleepBlocksByNight.merge(sleepDate, 1L, Long::sum);
                }
            }
        }

        return sleepBlocksByNight.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    // each block = 5 min
                    double hours = (e.getValue() * 5.0) / 60.0;
                    boolean anomaly = hours < 5 || hours > 10;
                    return new NightlySleepResponse(e.getKey().toString(), hours, anomaly);
                })
                .collect(Collectors.toList());
    }
}
