package com.merrykids.backend.dto;

import com.merrykids.backend.entity.ContentType;
import com.merrykids.backend.entity.LevelAssigned;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ParentContentListItemResponse {
    private Long id;
    private ContentType type;
    private String title;
    private String bodyExcerpt;
    private String academicYear;
    private LevelAssigned targetLevel;
    private boolean pinned;
    private boolean urgent;
    private LocalDate dueDate;
    private String category;
    private int attachmentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean viewed;
}
