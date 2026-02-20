package com.merrykids.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SubmissionConfirmationResponse {
    private String referenceNo;
    private String message;
}
