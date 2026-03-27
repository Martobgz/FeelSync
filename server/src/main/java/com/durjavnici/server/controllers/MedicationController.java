package com.durjavnici.server.controllers;

import com.durjavnici.server.dtos.MedicationRequest;
import com.durjavnici.server.dtos.MedicationResponse;
import com.durjavnici.server.models.Medication;
import com.durjavnici.server.models.User;
import com.durjavnici.server.models.UserRole;
import com.durjavnici.server.repositories.MedicationRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/medications")
@RequiredArgsConstructor
public class MedicationController {

    private final MedicationRepository medicationRepository;

    @PostMapping
    public ResponseEntity<MedicationResponse> create(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody MedicationRequest request) {

        requireGuardian(currentUser);
        User patient = requireLinkedPatient(currentUser);

        String intakeTimesStr = request.getIntakeTimes() == null
                ? ""
                : String.join(",", request.getIntakeTimes());

        Medication med = new Medication(
                patient,
                request.getName(),
                request.getCurrentAmount(),
                request.getDailyDose(),
                intakeTimesStr,
                request.isWristbandNotifications()
        );

        medicationRepository.save(med);
        return ResponseEntity.status(HttpStatus.CREATED).body(new MedicationResponse(med));
    }

    @GetMapping
    public ResponseEntity<List<MedicationResponse>> list(@AuthenticationPrincipal User currentUser) {
        User patient = resolvePatient(currentUser);
        List<MedicationResponse> meds = medicationRepository.findByPatient(patient)
                .stream()
                .map(MedicationResponse::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(meds);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MedicationResponse> update(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @Valid @RequestBody MedicationRequest request) {

        requireGuardian(currentUser);
        requireLinkedPatient(currentUser);

        Medication med = medicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medication not found"));

        if (!med.getPatient().getId().equals(currentUser.getPatient().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your patient's medication");
        }

        String intakeTimesStr = request.getIntakeTimes() == null
                ? ""
                : String.join(",", request.getIntakeTimes());

        med.update(request.getName(), request.getCurrentAmount(), request.getDailyDose(),
                intakeTimesStr, request.isWristbandNotifications());

        medicationRepository.save(med);
        return ResponseEntity.ok(new MedicationResponse(med));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {

        requireGuardian(currentUser);
        requireLinkedPatient(currentUser);

        Medication med = medicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medication not found"));

        if (!med.getPatient().getId().equals(currentUser.getPatient().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your patient's medication");
        }

        medicationRepository.delete(med);
        return ResponseEntity.noContent().build();
    }

    // ─── helpers ────────────────────────────────────────────────────────────────

    private void requireGuardian(User user) {
        if (user.getRole() != UserRole.GUARDIAN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Guardian access required");
        }
    }

    private User requireLinkedPatient(User guardian) {
        User patient = guardian.getPatient();
        if (patient == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No linked patient");
        }
        return patient;
    }

    private User resolvePatient(User user) {
        if (user.getRole() == UserRole.PATIENT) return user;
        if (user.getRole() == UserRole.GUARDIAN) return requireLinkedPatient(user);
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Role not set");
    }
}
