package com.merrykids.backend.dto;

import com.merrykids.backend.entity.Designation;
import com.merrykids.backend.entity.EmploymentStatus;
import com.merrykids.backend.entity.LevelAssigned;
import com.merrykids.backend.entity.MaritalStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.PastOrPresent;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TeacherUpdateRequest {

    private String fullName;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @Email(message = "Invalid email format")
    private String email;

    private String phoneNumber;

    private String permanentAddress;

    private String currentAddress;

    private String emergencyContactName;

    private String emergencyContactNumber;

    private MaritalStatus maritalStatus;

    @PastOrPresent(message = "Date of joining must be today or in the past")
    private LocalDate dateOfJoining;

    private LevelAssigned levelAssigned;

    private Designation designation;

    private EmploymentStatus employmentStatus;

    private String notes;
}
