package com.durjavnici.server.services.measurements;

import com.durjavnici.server.dtos.MeasurementRequest;
import com.durjavnici.server.models.Measurement;
import com.durjavnici.server.repositories.MeasurementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MeasurementServiceImpl implements MeasurementService {

    private final MeasurementRepository measurementRepository;

    @Override
    public Measurement create(MeasurementRequest request) {
        Measurement measurement = new Measurement(
                request.getPulse(),
                request.getSpo2(),
                request.getMovement()
        );
        return measurementRepository.save(measurement);
    }
}

