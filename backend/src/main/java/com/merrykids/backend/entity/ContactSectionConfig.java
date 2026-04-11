package com.merrykids.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "contact_section_config")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactSectionConfig {

    @Id
    private Long id; // Always 1L — singleton row

    @Column(nullable = false, length = 120)
    private String sectionTitle;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String subtitle;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mapEmbedUrl;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
