package com.merrykids.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherResponse {

    private Long id;
    private String employmentId;
    private String fullName;
    private LocalDate dateOfBirth;
    private String email;
    private String phoneNumber;
    private String permanentAddress;
    private String currentAddress;
    private String emergencyContactName;
    private String emergencyContactNumber;
    private String maritalStatus;
    private LocalDate dateOfJoining;
    private String levelAssigned;
    private String designation;
    private String employmentStatus;
    private String notes;
    private boolean hasPhoto;
    private String accountStatus;
    private String accountEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
