package com.durjavnici.server.dtos;

import com.durjavnici.server.models.UserRole;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String username;
    private String email;
    private UserRole role;
    private boolean patientLinked;
}
