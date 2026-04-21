package com.merrykids.backend.service;

import com.merrykids.backend.dto.CreateStudentRequest;
import com.merrykids.backend.dto.GuardianDto;
import com.merrykids.backend.dto.StatusChangeRequest;
import com.merrykids.backend.entity.Gender;
import com.merrykids.backend.entity.Guardian;
import com.merrykids.backend.entity.GuardianRelationshipType;
import com.merrykids.backend.entity.LevelAssigned;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.Student;
import com.merrykids.backend.entity.StudentGuardian;
import com.merrykids.backend.entity.StudentStatus;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.GuardianRepository;
import com.merrykids.backend.repository.StudentGuardianRepository;
import com.merrykids.backend.repository.StudentRepository;
import com.merrykids.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * MSc Unit Tests — StudentService
 * Approved test IDs: STD-U01, STD-U02
 */
@ExtendWith(MockitoExtension.class)
class StudentServiceMscTest {

    @Mock StudentRepository studentRepository;
    @Mock GuardianRepository guardianRepository;
    @Mock StudentGuardianRepository studentGuardianRepository;
    @Mock UserRepository userRepository;
    @Mock UserService userService;
    @Mock FileStorageService fileStorageService;

    @InjectMocks StudentService studentService;

    private User parentUser;
    private Guardian guardianWithAccount;
    private Student activeStudent;
    private StudentGuardian guardianLink;

    @BeforeEach
    void setUp() {
        parentUser = User.builder()
                .id(20L)
                .email("nimal.silva@example.com")
                .role(Role.PARENT)
                .active(true)
                .mustChangePassword(false)
                .build();

        guardianWithAccount = Guardian.builder()
                .id(5L)
                .fullName("Nimal Silva")
                .email("nimal.silva@example.com")
                .phone("+94771234567")
                .user(parentUser)
                .isDeleted(false)
                .build();

        activeStudent = Student.builder()
                .id(1L)
                .admissionNo("MK-25LKG1-0001")
                .fullName("Emma Silva")
                .dateOfBirth(LocalDate.of(2020, 6, 15))
                .gender(Gender.FEMALE)
                .entryLevel(LevelAssigned.LKG1)
                .currentLevel(LevelAssigned.LKG1)
                .batchCode("25LKG1")
                .status(StudentStatus.ACTIVE)
                .enrollmentDate(LocalDate.of(2025, 1, 6))
                .isDeleted(false)
                .build();

        guardianLink = StudentGuardian.builder()
                .id(1L)
                .student(activeStudent)
                .guardian(guardianWithAccount)
                .relationshipType(GuardianRelationshipType.FATHER)
                .build();
    }

    // ── STD-U01 ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("STD-U01: Entry level UKG2 is rejected — only LKG1 and UKG1 are valid entry levels")
    void createStudent_entryLevelUkg2_throwsIllegalArgument() {
        CreateStudentRequest request = new CreateStudentRequest();
        request.setFullName("Test Child");
        request.setDateOfBirth(LocalDate.of(2020, 1, 1));
        request.setGender(Gender.MALE);
        request.setEntryLevel(LevelAssigned.UKG2);    // Invalid: UKG2 is not a valid entry level
        request.setEnrollmentDate(LocalDate.now());
        request.setGuardians(List.of(
                buildGuardianDto(GuardianRelationshipType.FATHER),
                buildGuardianDto(GuardianRelationshipType.MOTHER)
        ));

        assertThatThrownBy(() -> studentService.createStudent(request, null, false))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Entry level must be LKG1 or UKG1");
    }

    // ── STD-U02 ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("STD-U02: Withdrawing a student disables the guardian's user account when no other active children remain")
    void changeStatus_withdraw_disablesGuardianAccount_whenNoOtherActiveChildren() {
        // Arrange
        when(studentRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(activeStudent));
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));
        when(studentGuardianRepository.findByStudentId(1L)).thenReturn(List.of(guardianLink));

        // Guardian has no other active students — count returns 0 after this withdrawal
        when(studentGuardianRepository.countActiveStudentsByGuardianId(5L)).thenReturn(0L);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        StatusChangeRequest request = new StatusChangeRequest();
        request.setStatus(StudentStatus.WITHDRAWN);
        request.setLeaveDate(LocalDate.now());

        // Act
        studentService.changeStatus(1L, request);

        // Assert: guardian's user account is now disabled
        assertThat(parentUser.isActive()).isFalse();

        // Assert: the disable was persisted to the DB
        verify(userRepository).save(parentUser);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private GuardianDto buildGuardianDto(GuardianRelationshipType type) {
        GuardianDto dto = new GuardianDto();
        dto.setFullName("Guardian " + type.name());
        dto.setPhone("+94771234567");
        dto.setRelationshipType(type);
        return dto;
    }
}
