package com.durjavnici.server.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "user_stats")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;

    @Column(name = "avg_heart_rate", nullable = false)
    private Double averageHeartRate;

    @Column(name = "stddev_heart_rate", nullable = false)
    private Double heartRateStdDev;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UserStats(User user, Double averageHeartRate, Double heartRateStdDev) {
        this.user = user;
        this.averageHeartRate = averageHeartRate;
        this.heartRateStdDev = heartRateStdDev;
        this.updatedAt = Instant.now();
    }
}

