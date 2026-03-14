package com.merrykids.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PortalContentAttachmentResponse {
    private Long id;
    private String originalFileName;
    private String contentType;
    private long sizeBytes;
    private LocalDateTime createdAt;
}
