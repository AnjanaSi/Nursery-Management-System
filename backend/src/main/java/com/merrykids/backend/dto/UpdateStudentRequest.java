package com.merrykids.backend.dto;

import com.merrykids.backend.entity.Gender;
import com.merrykids.backend.entity.LevelAssigned;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Past;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateStudentRequest {

    private String fullName;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    private Gender gender;

    private LevelAssigned currentLevel;

    private LocalDate enrollmentDate;

    private String notes;

    @Valid
    private List<GuardianDto> guardians;
}
