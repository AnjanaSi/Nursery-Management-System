package com.merrykids.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ArchiveYearRequest {

    @NotBlank(message = "Academic year is required")
    private String academicYear;
}
