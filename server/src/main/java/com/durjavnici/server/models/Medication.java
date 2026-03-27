package com.durjavnici.server.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "medications")
@Getter
@NoArgsConstructor
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(nullable = false)
    private String name;

    private int currentAmount;
    private int dailyDose;

    // Comma-separated "HH:mm,HH:mm"
    @Column(length = 500)
    private String intakeTimes;

    @Column(nullable = false)
    private boolean wristbandNotifications = false;

    @Column(nullable = false)
    private LocalDate addedDate;

    public Medication(User patient, String name, int currentAmount, int dailyDose,
                      String intakeTimes, boolean wristbandNotifications) {
        this.patient = patient;
        this.name = name;
        this.currentAmount = currentAmount;
        this.dailyDose = dailyDose;
        this.intakeTimes = intakeTimes;
        this.wristbandNotifications = wristbandNotifications;
        this.addedDate = LocalDate.now();
    }

    public void update(String name, int currentAmount, int dailyDose,
                       String intakeTimes, boolean wristbandNotifications) {
        this.name = name;
        this.currentAmount = currentAmount;
        this.dailyDose = dailyDose;
        this.intakeTimes = intakeTimes;
        this.wristbandNotifications = wristbandNotifications;
    }
}
