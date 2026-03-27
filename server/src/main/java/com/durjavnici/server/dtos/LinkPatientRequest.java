package com.durjavnici.server.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class LinkPatientRequest {

    @NotBlank
    @Email
    private String patientEmail;
}
