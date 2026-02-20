package com.merrykids.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "admission_announcements")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdmissionAnnouncement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "open_date", nullable = false)
    private LocalDate openDate;

    @Column(name = "close_date", nullable = false)
    private LocalDate closeDate;

    @Column(name = "application_pdf_original_name")
    private String applicationPdfOriginalName;

    @Column(name = "application_pdf_stored_name")
    private String applicationPdfStoredName;

    @Column(name = "application_pdf_path")
    private String applicationPdfPath;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
