package com.merrykids.backend.dto;

import com.merrykids.backend.entity.SubmissionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateStatusRequest {

    @NotNull(message = "Status is required")
    private SubmissionStatus status;
}
