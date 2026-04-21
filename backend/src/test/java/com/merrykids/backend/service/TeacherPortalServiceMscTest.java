package com.merrykids.backend.service;

import com.merrykids.backend.dto.CreatePortalContentRequest;
import com.merrykids.backend.entity.ContentType;
import com.merrykids.backend.entity.EmploymentStatus;
import com.merrykids.backend.entity.LevelAssigned;
import com.merrykids.backend.entity.PortalContent;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.Teacher;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.PortalContentAttachmentRepository;
import com.merrykids.backend.repository.PortalContentRepository;
import com.merrykids.backend.repository.TeacherRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * MSc Unit Test — TeacherPortalService
 * Approved test ID: TCH-U01
 *
 * Verifies that content targetLevel is always set from the teacher's
 * own levelAssigned — never from any client-supplied value.
 * Also verifies that academicYear is auto-populated.
 */
@ExtendWith(MockitoExtension.class)
class TeacherPortalServiceMscTest {

    @Mock TeacherRepository teacherRepository;
    @Mock PortalContentRepository contentRepository;
    @Mock PortalContentAttachmentRepository attachmentRepository;
    @Mock FileStorageService fileStorageService;

    @InjectMocks TeacherPortalService teacherPortalService;

    private Teacher lkg1Teacher;

    @BeforeEach
    void setUp() {
        // getTeacherByEmail() uses findByUser_EmailAndIsDeletedFalse —
        // the teacher must have a linked User whose email matches the lookup key
        User linkedUser = User.builder()
                .id(10L)
                .email("priya.fernando@example.com")
                .role(Role.TEACHER)
                .active(true)
                .mustChangePassword(false)
                .build();

        lkg1Teacher = Teacher.builder()
                .id(1L)
                .employmentId("MK-STF-2025-0001")
                .fullName("Priya Fernando")
                .email("priya.fernando@example.com")
                .dateOfBirth(LocalDate.of(1985, 3, 12))
                .phoneNumber("+94771234567")
                .permanentAddress("123 Main St")
                .currentAddress("123 Main St")
                .emergencyContactName("Ravi Fernando")
                .emergencyContactNumber("+94771234568")
                .dateOfJoining(LocalDate.of(2020, 1, 15))
                .levelAssigned(LevelAssigned.LKG1)   // Teacher is assigned to LKG1
                .employmentStatus(EmploymentStatus.ACTIVE)
                .isDeleted(false)
                .user(linkedUser)
                .build();
    }

    // ── TCH-U01 ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TCH-U01: Content targetLevel is set from teacher's levelAssigned (LKG1), not from client; academicYear is auto-set")
    void createContent_targetLevelDerivedFromTeacher_notFromClient() {
        // Arrange
        // Service resolves teacher via linked user's email
        when(teacherRepository.findByUser_EmailAndIsDeletedFalse("priya.fernando@example.com"))
                .thenReturn(Optional.of(lkg1Teacher));

        ArgumentCaptor<PortalContent> captor = ArgumentCaptor.forClass(PortalContent.class);
        when(contentRepository.save(captor.capture())).thenAnswer(inv -> {
            PortalContent c = inv.getArgument(0);
            c.setId(100L);
            return c;
        });

        CreatePortalContentRequest request = new CreatePortalContentRequest();
        request.setTitle("Welcome back — LKG1 parents!");
        request.setBody("Please ensure children arrive by 8:00 AM.");
        // Client does NOT supply targetLevel — service must derive it from teacher profile

        // Act
        teacherPortalService.createContent(
                "priya.fernando@example.com",
                ContentType.ANNOUNCEMENT,
                request,
                null   // no attachments
        );

        // Assert: targetLevel matches teacher's assigned level
        PortalContent saved = captor.getValue();
        assertThat(saved.getTargetLevel()).isEqualTo(LevelAssigned.LKG1);

        // Assert: academicYear was automatically populated (non-null, non-blank)
        assertThat(saved.getAcademicYear()).isNotBlank();
    }
}
