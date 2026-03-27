package com.durjavnici.server.services.time;

import com.durjavnici.server.dtos.TimeWindowResponse;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class TimeWindowServiceImpl implements TimeWindowService {

    private static final long MS_PER_HOUR = 60L * 60L * 1000L;

    @Override
    public TimeWindowResponse calculateWindowMs(List<Integer> hours) {
        List<Integer> sortedHours = new ArrayList<>(hours);
        Collections.sort(sortedHours);

        List<Long> windowsMs = new ArrayList<>();
        long timeLeftMs = calculateTimeUntilNextHour(sortedHours);

        if (sortedHours.size() == 1) {
            windowsMs.add(24L * MS_PER_HOUR);
            return new TimeWindowResponse(windowsMs, timeLeftMs);
        }

        int startIndex = findNextTriggerIndex(sortedHours, LocalDateTime.now());
        for (int offset = 0; offset < sortedHours.size(); offset++) {
            int i = (startIndex + offset) % sortedHours.size();
            int currentHour = sortedHours.get(i);
            int nextHour = sortedHours.get((i + 1) % sortedHours.size());
            int diffHours = (nextHour - currentHour + 24) % 24;
            windowsMs.add(diffHours * MS_PER_HOUR);
        }

        return new TimeWindowResponse(windowsMs, timeLeftMs);
    }

    private int findNextTriggerIndex(List<Integer> hours, LocalDateTime now) {
        int bestIndex = 0;
        LocalDateTime bestTrigger = null;

        for (int i = 0; i < hours.size(); i++) {
            int targetHour = hours.get(i);
            LocalDateTime candidate = now.withHour(targetHour)
                    .withMinute(0)
                    .withSecond(0)
                    .withNano(0);

            if (!candidate.isAfter(now)) {
                candidate = candidate.plusDays(1);
            }

            if (bestTrigger == null || candidate.isBefore(bestTrigger)) {
                bestTrigger = candidate;
                bestIndex = i;
            }
        }

        return bestIndex;
    }

    private long calculateTimeUntilNextHour(List<Integer> hours) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nextTrigger = null;

        for (int targetHour : hours) {
            LocalDateTime candidate = now.withHour(targetHour)
                    .withMinute(0)
                    .withSecond(0)
                    .withNano(0);

            if (!candidate.isAfter(now)) {
                candidate = candidate.plusDays(1);
            }

            if (nextTrigger == null || candidate.isBefore(nextTrigger)) {
                nextTrigger = candidate;
            }
        }

        return Duration.between(now, nextTrigger).toMillis();
    }
}

