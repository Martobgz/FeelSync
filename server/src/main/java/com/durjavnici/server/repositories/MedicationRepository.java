package com.durjavnici.server.repositories;

import com.durjavnici.server.models.Medication;
import com.durjavnici.server.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicationRepository extends JpaRepository<Medication, Long> {
    List<Medication> findByPatient(User patient);
}
