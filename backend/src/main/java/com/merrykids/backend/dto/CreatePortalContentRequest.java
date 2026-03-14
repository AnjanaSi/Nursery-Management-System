package com.merrykids.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreatePortalContentRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Body is required")
    private String body;

    private boolean pinned = false;
    private boolean urgent = false;
    private LocalDate dueDate;
    private String category;
}
