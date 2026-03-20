package com.merrykids.backend.dto;

import com.merrykids.backend.entity.AdminType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AdminProfileCreateRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    private String address;

    private String nic;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    private AdminType adminType;

    private String notes;
}
