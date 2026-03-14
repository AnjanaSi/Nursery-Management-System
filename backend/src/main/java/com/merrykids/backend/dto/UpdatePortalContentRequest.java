package com.merrykids.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class UpdatePortalContentRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Body is required")
    private String body;

    private boolean pinned = false;
    private boolean urgent = false;
    private LocalDate dueDate;
    private String category;

    /** When non-null, switches the archived state. */
    private Boolean archived;

    /** IDs of existing attachments to keep; any not listed will be deleted. */
    private List<Long> keepAttachmentIds;
}
