package com.merrykids.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PublicProgramCardResponse {
    private Long id;
    private String title;
    private String description;
    private String ageRange;
    private int displayOrder;
    private String imageUrl;
}
