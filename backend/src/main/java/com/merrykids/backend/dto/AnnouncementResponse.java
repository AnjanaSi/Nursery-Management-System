package com.merrykids.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class AnnouncementResponse {
    private Long id;
    private String message;
    private LocalDate openDate;
    private LocalDate closeDate;
    private boolean open;
    private boolean hasApplicationPdf;
    private String applicationPdfOriginalName;
}
