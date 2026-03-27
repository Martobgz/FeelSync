package com.durjavnici.server.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "biometric_blocks")
@Getter
@NoArgsConstructor
public class BiometricBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    private double avgHr;
    private double minHr;
    private double maxHr;
    private int hrSampleCount;
    private double avgMovement;

    public BiometricBlock(User patient, LocalDateTime timestamp,
                          double avgHr, double minHr, double maxHr,
                          int hrSampleCount, double avgMovement) {
        this.patient = patient;
        this.timestamp = timestamp;
        this.avgHr = avgHr;
        this.minHr = minHr;
        this.maxHr = maxHr;
        this.hrSampleCount = hrSampleCount;
        this.avgMovement = avgMovement;
    }
}
