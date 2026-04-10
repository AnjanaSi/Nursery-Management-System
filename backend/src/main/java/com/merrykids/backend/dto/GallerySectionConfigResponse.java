package com.merrykids.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GallerySectionConfigResponse {

    private Long id;
    private String sectionTitle;
    private String subtitle;
    private LocalDateTime updatedAt;
}
