package com.merrykids.backend.dto;

import com.merrykids.backend.entity.LevelAssigned;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class ParentChildProfileResponse {
    private Long id;
    private String admissionNo;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private LevelAssigned currentLevel;
    private LevelAssigned entryLevel;
    private int entryYear;
    private String batchCode;
    private String status;
    private LocalDate enrollmentDate;
    private String relationshipType;
    private List<OtherGuardianSummary> otherGuardians;

    @Data
    @Builder
    public static class OtherGuardianSummary {
        private String fullName;
        private String relationshipType;
        private String phone;
    }
}
