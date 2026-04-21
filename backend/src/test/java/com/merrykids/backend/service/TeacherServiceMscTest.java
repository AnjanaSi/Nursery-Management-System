package com.merrykids.backend.service;

import com.merrykids.backend.dto.TeacherUpdateRequest;
import com.merrykids.backend.entity.Designation;
import com.merrykids.backend.entity.EmploymentStatus;
import com.merrykids.backend.entity.LevelAssigned;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.Teacher;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.TeacherRepository;
import com.merrykids.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * MSc Unit Test — TeacherService
 * Approved test ID: STF-U01
 *
 * Verifies that updating a teacher's employment status to a terminal value
 * (TERMINATED) automatically revokes the linked user account:
 * user.active = false and teacher.user = null.
 */
@ExtendWith(MockitoExtension.class)
class TeacherServiceMscTest {

    @Mock TeacherRepository teacherRepository;
    @Mock UserRepository userRepository;
    @Mock UserService userService;
    @Mock FileStorageService fileStorageService;

    @InjectMocks TeacherService teacherService;

    private User linkedUser;
    private Teacher activeTeacher;

    @BeforeEach
    void setUp() {
        linkedUser = User.builder()
                .id(10L)
                .email("priya.fernando@example.com")
                .passwordHash("$2a$10$hash")
                .role(Role.TEACHER)
                .active(true)
                .mustChangePassword(false)
                .build();

        activeTeacher = Teacher.builder()
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
                .levelAssigned(LevelAssigned.LKG1)
                .designation(Designation.TEACHER)
                .employmentStatus(EmploymentStatus.ACTIVE)
                .isDeleted(false)
                .user(linkedUser)
                .build();
    }

    // ── STF-U01 ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("STF-U01: Setting employmentStatus to TERMINATED revokes linked user account (user.active=false, teacher.user=null)")
    void updateTeacher_terminalStatus_revokesLinkedUserAccount() {
        // Arrange
        when(teacherRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(activeTeacher));
        when(teacherRepository.save(any(Teacher.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        TeacherUpdateRequest request = new TeacherUpdateRequest();
        request.setEmploymentStatus(EmploymentStatus.TERMINATED);

        // Act
        teacherService.updateTeacher(1L, request, null);

        // Assert: user account was disabled
        assertThat(linkedUser.isActive()).isFalse();

        // Assert: teacher no longer holds the user reference
        assertThat(activeTeacher.getUser()).isNull();

        // Assert: user.active=false was persisted
        verify(userRepository).save(linkedUser);
    }
}
