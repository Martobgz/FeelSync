package com.durjavnici.server.dtos;

import com.durjavnici.server.models.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RoleUpdateRequest {

    @NotNull
    private UserRole role;
}
