package com.merrykids.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventSummaryResponse {

    private Long id;
    private String title;
    private String description;
    private LocalDate eventDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int photoCount;
    private Long coverPhotoId;
}
