package com.merrykids.backend.dto;

import com.merrykids.backend.entity.StudentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class StatusChangeRequest {

    @NotNull(message = "Status is required")
    private StudentStatus status;

    @NotNull(message = "Leave date is required")
    private LocalDate leaveDate;
}
