package com.durjavnici.server.dtos;

import com.durjavnici.server.models.Medication;
import lombok.Getter;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Getter
public class MedicationResponse {

    private final Long id;
    private final String name;
    private final int currentAmount;
    private final int dailyDose;
    private final List<String> intakeTimes;
    private final boolean wristbandNotifications;
    private final String addedDate;

    public MedicationResponse(Medication m) {
        this.id = m.getId();
        this.name = m.getName();
        this.currentAmount = m.getCurrentAmount();
        this.dailyDose = m.getDailyDose();
        this.intakeTimes = m.getIntakeTimes() == null || m.getIntakeTimes().isBlank()
                ? Collections.emptyList()
                : Arrays.asList(m.getIntakeTimes().split(","));
        this.wristbandNotifications = m.isWristbandNotifications();
        this.addedDate = m.getAddedDate() != null ? m.getAddedDate().toString() : null;
    }
}
