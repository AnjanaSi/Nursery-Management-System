package com.merrykids.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactSectionConfigRequest {

    @NotBlank(message = "Section title is required")
    @Size(min = 3, max = 120, message = "Section title must be between 3 and 120 characters")
    private String sectionTitle;

    @NotBlank(message = "Subtitle is required")
    @Size(min = 10, max = 1000, message = "Subtitle must be between 10 and 1000 characters")
    private String subtitle;

    @NotBlank(message = "Map embed URL is required")
    @Size(max = 2000, message = "Map embed URL must not exceed 2000 characters")
    @Pattern(regexp = "^https://.*", message = "Map embed URL must start with https://")
    private String mapEmbedUrl;
}
