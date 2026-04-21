package com.merrykids.backend.service;

import com.merrykids.backend.entity.AdmissionAnnouncement;
import com.merrykids.backend.entity.AdmissionSubmission;
import com.merrykids.backend.entity.ApplyingLevel;
import com.merrykids.backend.entity.SubmissionStatus;
import com.merrykids.backend.repository.AdmissionAnnouncementRepository;
import com.merrykids.backend.repository.AdmissionSubmissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * MSc Unit Test — AdmissionSubmissionService
 * Approved test ID: ADM-U01
 *
 * Verifies that a new submission is saved with status=RECEIVED
 * and a reference number matching the format MK-ADM-{YEAR}-{6-digit-seq}.
 */
@ExtendWith(MockitoExtension.class)
class AdmissionSubmissionServiceMscTest {

    @Mock AdmissionSubmissionRepository submissionRepository;
    @Mock AdmissionAnnouncementRepository announcementRepository;
    @Mock FileStorageService fileStorageService;

    @InjectMocks AdmissionSubmissionService service;

    private AdmissionAnnouncement openAnnouncement;

    @BeforeEach
    void setUp() {
        // Admission window: open today
        openAnnouncement = AdmissionAnnouncement.builder()
                .id(1L)
                .message("Admissions open for 2025")
                .openDate(LocalDate.now().minusDays(5))
                .closeDate(LocalDate.now().plusDays(30))
                .build();
    }

    // ── ADM-U01 ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("ADM-U01: Submission saved with status=RECEIVED and referenceNo matching MK-ADM-{YEAR}-{6-digits}")
    void submitApplication_openWindow_savedWithReceivedStatusAndCorrectRefNo() {
        // Arrange
        when(announcementRepository.findTopByOrderByCreatedAtDesc())
                .thenReturn(Optional.of(openAnnouncement));

        when(fileStorageService.storeFile(any(MultipartFile.class), anyString()))
                .thenReturn(new FileStorageService.StoredFile("app.pdf", "stored-uuid.pdf", "admissions/submissions/stored-uuid.pdf"));

        // countByYear returns 0 so first submission gets sequence 000001
        when(submissionRepository.countByYear(anyInt())).thenReturn(0L);

        // Capture the entity passed to save()
        ArgumentCaptor<AdmissionSubmission> captor = ArgumentCaptor.forClass(AdmissionSubmission.class);
        when(submissionRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        MultipartFile mockPdf = mock(MultipartFile.class);

        // Act
        service.submitApplication(
                "Emma Silva",
                LocalDate.of(2020, 5, 10),
                ApplyingLevel.LKG1,
                "Nimal Silva",
                "nimal@example.com",
                "+94771234567",
                "123 Main St, Colombo",
                mockPdf
        );

        // Assert: status must default to RECEIVED
        AdmissionSubmission saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(SubmissionStatus.RECEIVED);

        // Assert: reference number matches MK-ADM-{YEAR}-{6-digit-sequence}
        int currentYear = LocalDate.now().getYear();
        assertThat(saved.getReferenceNo())
                .matches("MK-ADM-" + currentYear + "-\\d{6}");
    }
}
