package com.merrykids.backend.dto;

import com.merrykids.backend.entity.ContentType;
import com.merrykids.backend.entity.LevelAssigned;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PortalContentDetailResponse {
    private Long id;
    private ContentType type;
    private String title;
    private String body;
    private String academicYear;
    private LevelAssigned targetLevel;
    private boolean pinned;
    private boolean urgent;
    private LocalDate dueDate;
    private String category;
    private boolean archived;
    private String createdByTeacherName;
    private String lastEditedByTeacherName;
    private List<PortalContentAttachmentResponse> attachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
