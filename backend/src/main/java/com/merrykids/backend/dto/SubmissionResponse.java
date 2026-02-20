package com.merrykids.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class SubmissionResponse {
    private Long id;
    private String referenceNo;
    private LocalDateTime submittedDate;
    private String childFullName;
    private String levelApplyingFor;
    private String guardianFullName;
    private String email;
    private String phone;
    private String status;
    private String adminNote;
}
