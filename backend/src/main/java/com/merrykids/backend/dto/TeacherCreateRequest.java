package com.merrykids.backend.dto;

import com.merrykids.backend.entity.Designation;
import com.merrykids.backend.entity.EmploymentStatus;
import com.merrykids.backend.entity.LevelAssigned;
import com.merrykids.backend.entity.MaritalStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TeacherCreateRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Permanent address is required")
    private String permanentAddress;

    @NotBlank(message = "Current address is required")
    private String currentAddress;

    @NotBlank(message = "Emergency contact name is required")
    private String emergencyContactName;

    @NotBlank(message = "Emergency contact number is required")
    private String emergencyContactNumber;

    private MaritalStatus maritalStatus;

    @NotNull(message = "Date of joining is required")
    @PastOrPresent(message = "Date of joining must be today or in the past")
    private LocalDate dateOfJoining;

    @NotNull(message = "Level assigned is required")
    private LevelAssigned levelAssigned;

    @NotNull(message = "Designation is required")
    private Designation designation;

    private EmploymentStatus employmentStatus;

    private String notes;
}
