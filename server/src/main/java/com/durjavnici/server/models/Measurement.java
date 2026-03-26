package com.durjavnici.server.models;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "measurements")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Measurement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(nullable = false)
    private Float pulse;

    @Column(nullable = false)
    private Float spo2;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MovementType movement;

    @Column(name = "timestamp", nullable = false)
    private Instant createdAt = Instant.now();

    public Measurement(Float pulse, Float spo2, MovementType movement) {
        this.pulse = pulse;
        this.spo2 = spo2;
        this.movement = movement;
    }
}
