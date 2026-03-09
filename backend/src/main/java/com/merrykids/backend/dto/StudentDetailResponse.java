package com.merrykids.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDetailResponse {
    private Long id;
    private String admissionNo;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private int entryYear;
    private String entryLevel;
    private String currentLevel;
    private String batchCode;
    private String status;
    private LocalDate enrollmentDate;
    private LocalDate leaveDate;
    private boolean hasPhoto;
    private String notes;
    private List<GuardianResponse> guardians;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
