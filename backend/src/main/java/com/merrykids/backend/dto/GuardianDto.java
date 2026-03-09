package com.merrykids.backend.dto;

import com.merrykids.backend.entity.GuardianRelationshipType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GuardianDto {

    private Long id;

    @NotBlank(message = "Guardian full name is required")
    private String fullName;

    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Guardian phone is required")
    private String phone;

    private String nic;

    private String address;

    @NotNull(message = "Relationship type is required")
    private GuardianRelationshipType relationshipType;

    private Boolean updateLoginEmail;
}
