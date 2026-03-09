package com.merrykids.backend.dto;

import com.merrykids.backend.entity.Gender;
import com.merrykids.backend.entity.LevelAssigned;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CreateStudentRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotNull(message = "Entry level is required")
    private LevelAssigned entryLevel;

    @NotNull(message = "Enrollment date is required")
    private LocalDate enrollmentDate;

    private String notes;

    @NotNull(message = "Guardians are required")
    @Size(min = 2, max = 3, message = "Must provide 2-3 guardians (father + mother required)")
    @Valid
    private List<GuardianDto> guardians;
}
