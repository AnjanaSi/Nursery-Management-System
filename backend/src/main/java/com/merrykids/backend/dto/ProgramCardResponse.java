package com.merrykids.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ProgramCardResponse {
    private Long id;
    private String title;
    private String description;
    private String ageRange;
    private int displayOrder;
    private boolean hasImage;
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
