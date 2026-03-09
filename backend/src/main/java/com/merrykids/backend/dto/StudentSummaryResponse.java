package com.merrykids.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentSummaryResponse {
    private Long id;
    private String admissionNo;
    private String fullName;
    private String currentLevel;
    private String batchCode;
    private String status;
    private boolean hasPhoto;
    private String guardianNames;
    private LocalDateTime createdAt;
}
