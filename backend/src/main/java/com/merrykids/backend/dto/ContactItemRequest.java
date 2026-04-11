package com.merrykids.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactItemRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 2, max = 80, message = "Title must be between 2 and 80 characters")
    private String title;

    @NotBlank(message = "Content is required")
    @Size(min = 2, max = 1000, message = "Content must be between 2 and 1000 characters")
    private String content;
}
