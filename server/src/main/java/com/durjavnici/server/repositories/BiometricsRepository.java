package com.durjavnici.server.repositories;

import com.durjavnici.server.models.BiometricBlock;
import com.durjavnici.server.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface BiometricsRepository extends JpaRepository<BiometricBlock, Long> {
    List<BiometricBlock> findByPatientAndTimestampAfter(User patient, LocalDateTime since);
}
