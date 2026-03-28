package com.durjavnici.server.dtos;

import com.durjavnici.server.models.UserType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class RegisterRequest {
    @NotBlank
    @Size(min = 3, max = 15)
    private String username;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 6)
    private String password;

    @Size(max = 255)
    private String expoPushToken;

    @NotNull
    private UserType userType;

    @Size(max = 255)
    private String patientUsername;
}
