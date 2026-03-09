package com.merrykids.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "students")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admission_no", nullable = false, unique = true)
    private String admissionNo;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @Column(name = "entry_year", nullable = false)
    private int entryYear;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_level", nullable = false)
    private LevelAssigned entryLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_level", nullable = false)
    private LevelAssigned currentLevel;

    @Column(name = "batch_code", nullable = false)
    private String batchCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StudentStatus status = StudentStatus.ACTIVE;

    @Column(name = "enrollment_date", nullable = false)
    private LocalDate enrollmentDate;

    @Column(name = "leave_date")
    private LocalDate leaveDate;

    @Column(name = "profile_photo_original_name")
    private String profilePhotoOriginalName;

    @Column(name = "profile_photo_stored_name")
    private String profilePhotoStoredName;

    @Column(name = "profile_photo_path")
    private String profilePhotoPath;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
