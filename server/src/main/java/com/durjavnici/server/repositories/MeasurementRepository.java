package com.durjavnici.server.repositories;

import com.durjavnici.server.models.Measurement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface MeasurementRepository extends JpaRepository<Measurement, Long> {

    List<Measurement> findByUserIdAndCreatedAtAfter(
            Long userId,
            Instant createdAfter
    );
}

