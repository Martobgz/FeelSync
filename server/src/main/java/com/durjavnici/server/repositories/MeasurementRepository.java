package com.durjavnici.server.repositories;

import com.durjavnici.server.models.Measurement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MeasurementRepository extends JpaRepository<Measurement, Long> {
}

