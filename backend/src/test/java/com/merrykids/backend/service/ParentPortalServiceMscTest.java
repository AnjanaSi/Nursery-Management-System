package com.merrykids.backend.service;

import com.merrykids.backend.dto.ParentContentListItemResponse;
import com.merrykids.backend.entity.ContentType;
import com.merrykids.backend.entity.Gender;
import com.merrykids.backend.entity.Guardian;
import com.merrykids.backend.entity.LevelAssigned;
import com.merrykids.backend.entity.ParentContentView;
import com.merrykids.backend.entity.PortalContent;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.Student;
import com.merrykids.backend.entity.StudentGuardian;
import com.merrykids.backend.entity.StudentStatus;
import com.merrykids.backend.entity.Teacher;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.GuardianRepository;
import com.merrykids.backend.repository.ParentContentViewRepository;
import com.merrykids.backend.repository.PortalContentAttachmentRepository;
import com.merrykids.backend.repository.PortalContentRepository;
import com.merrykids.backend.repository.StudentGuardianRepository;
import com.merrykids.backend.repository.StudentRepository;
import com.merrykids.backend.util.AcademicYearUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * MSc Unit Test — ParentPortalService
 * Approved test ID: PAR-U01
 *
 * Verifies that content edited AFTER the parent's last view is returned
 * with isViewed=false, forcing the parent to re-read the updated content.
 *
 * computeIsViewed() is private, so this is tested through the public
 * listAnnouncements() method, inspecting the isViewed field in the response.
 */
@ExtendWith(MockitoExtension.class)
class ParentPortalServiceMscTest {

    @Mock GuardianRepository guardianRepository;
    @Mock StudentRepository studentRepository;
    @Mock StudentGuardianRepository studentGuardianRepository;
    @Mock PortalContentRepository contentRepository;
    @Mock PortalContentAttachmentRepository attachmentRepository;
    @Mock ParentContentViewRepository viewRepository;
    @Mock FileStorageService fileStorageService;

    @InjectMocks ParentPortalService parentPortalService;

    private User parentUser;
    private Guardian guardian;
    private Student student;
    private Teacher teacher;
    private PortalContent announcement;
    private StudentGuardian link;

    @BeforeEach
    void setUp() {
        parentUser = User.builder()
                .id(1L).email("nimal.silva@example.com")
                .role(Role.PARENT).active(true).build();

        guardian = Guardian.builder()
                .id(5L).fullName("Nimal Silva")
                .email("nimal.silva@example.com")
                .phone("+94771234567")
                .user(parentUser).isDeleted(false).build();

        student = Student.builder()
                .id(10L).admissionNo("MK-25LKG1-0001")
                .fullName("Emma Silva")
                .dateOfBirth(LocalDate.of(2020, 6, 15))
                .gender(Gender.FEMALE)
                .currentLevel(LevelAssigned.LKG1)
                .entryLevel(LevelAssigned.LKG1)
                .batchCode("25LKG1")
                .status(StudentStatus.ACTIVE)
                .enrollmentDate(LocalDate.of(2025, 1, 6))
                .isDeleted(false).build();

        teacher = Teacher.builder().id(2L).fullName("Priya Fernando").build();

        // T2: teacher edited the announcement AFTER the parent's last view (T1)
        LocalDateTime t2 = LocalDateTime.now().minusHours(1);
        announcement = PortalContent.builder()
                .id(100L)
                .type(ContentType.ANNOUNCEMENT)
                .title("Updated: School trip notice")
                .body("Please note the trip date has changed.")
                .targetLevel(LevelAssigned.LKG1)
                .academicYear(AcademicYearUtil.getCurrent())
                .createdByTeacher(teacher)
                .pinned(false).urgent(false).archived(false)
                .updatedAt(t2)    // teacher edited at T2
                .build();

        link = StudentGuardian.builder()
                .id(1L).student(student).guardian(guardian)
                .build();
    }

    // ── PAR-U01 ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("PAR-U01: Content edited after parent's last view is returned with isViewed=false")
    void listAnnouncements_contentEditedAfterLastView_isViewedFalse() {
        // Arrange
        when(guardianRepository.findByUser_EmailAndIsDeletedFalse("nimal.silva@example.com"))
                .thenReturn(Optional.of(guardian));
        when(studentRepository.findByIdAndIsDeletedFalse(10L))
                .thenReturn(Optional.of(student));
        when(studentGuardianRepository.findByGuardianId(5L))
                .thenReturn(List.of(link));
        when(contentRepository.findByTargetLevelAndTypeAndAcademicYearAndArchived(
                eq(LevelAssigned.LKG1), eq(ContentType.ANNOUNCEMENT),
                anyString(), anyBoolean(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(announcement)));

        // T1 = parent last viewed 2 hours ago; T2 (updatedAt) = 1 hour ago → T2 > T1
        LocalDateTime t1 = LocalDateTime.now().minusHours(2);
        ParentContentView staleView = ParentContentView.builder()
                .guardian(guardian).student(student).content(announcement)
                .lastViewedAt(t1)   // viewed at T1, before the teacher's T2 edit
                .build();

        when(viewRepository.findByGuardianIdAndStudentIdAndContentIdIn(
                eq(5L), eq(10L), anyList()))
                .thenReturn(List.of(staleView));

        // Act
        var page = parentPortalService.listAnnouncements("nimal.silva@example.com", 10L, 0, 10);

        // Assert: content is shown as NOT viewed because teacher edited it after parent's last view
        assertThat(page.getContent()).hasSize(1);
        ParentContentListItemResponse item = page.getContent().get(0);
        assertThat(item.isViewed()).isFalse();
    }
}
