package com.merrykids.backend.dto;

import com.merrykids.backend.entity.LevelAssigned;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ParentChildSummaryResponse {
    private Long id;
    private String admissionNo;
    private String fullName;
    private LevelAssigned currentLevel;
    private String batchCode;
    private String academicYear;
}
