package com.merrykids.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "admission_submissions")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdmissionSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference_no", nullable = false, unique = true)
    private String referenceNo;

    @Column(name = "child_full_name", nullable = false)
    private String childFullName;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "level_applying_for", nullable = false)
    private ApplyingLevel levelApplyingFor;

    @Column(name = "guardian_full_name", nullable = false)
    private String guardianFullName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(name = "submitted_pdf_original_name")
    private String submittedPdfOriginalName;

    @Column(name = "submitted_pdf_stored_name")
    private String submittedPdfStoredName;

    @Column(name = "submitted_pdf_path")
    private String submittedPdfPath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.RECEIVED;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
