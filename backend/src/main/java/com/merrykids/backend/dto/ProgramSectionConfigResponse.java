package com.merrykids.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ProgramSectionConfigResponse {
    private Long id;
    private String sectionTitle;
    private String subtitle;
    private LocalDateTime updatedAt;
}
