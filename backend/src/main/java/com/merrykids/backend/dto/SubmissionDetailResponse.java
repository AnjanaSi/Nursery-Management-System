package com.merrykids.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class SubmissionDetailResponse {
    private Long id;
    private String referenceNo;
    private String childFullName;
    private LocalDate dateOfBirth;
    private String levelApplyingFor;
    private String guardianFullName;
    private String email;
    private String phone;
    private String address;
    private String submittedPdfOriginalName;
    private String status;
    private String adminNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
