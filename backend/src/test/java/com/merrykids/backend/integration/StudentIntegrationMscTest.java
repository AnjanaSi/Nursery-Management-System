package com.merrykids.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merrykids.backend.dto.CreateStudentRequest;
import com.merrykids.backend.dto.GuardianDto;
import com.merrykids.backend.dto.LoginRequest;
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
import com.merrykids.backend.repository.PasswordResetTokenRepository;
import com.merrykids.backend.repository.StudentGuardianRepository;
import com.merrykids.backend.repository.StudentRepository;
import com.merrykids.backend.repository.UserRepository;
import com.merrykids.backend.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MSc Integration Tests — Student Management (Feature 6)
 * Approved test IDs: INT-STD-01, INT-STD-02
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class StudentIntegrationMscTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired StudentRepository studentRepository;
    @Autowired GuardianRepository guardianRepository;
    @Autowired StudentGuardianRepository studentGuardianRepository;
    @Autowired PasswordResetTokenRepository tokenRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @MockitoBean
    EmailService emailService;

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        tokenRepository.deleteAll();
        studentGuardianRepository.deleteAll();
        studentRepository.deleteAll();
        guardianRepository.deleteAll();
        userRepository.deleteAll();

        userRepository.save(User.builder()
                .email("admin@example.com")
                .passwordHash(passwordEncoder.encode("Admin@123"))
                .role(Role.ADMIN)
                .active(true)
                .mustChangePassword(false)
                .build());

        adminToken = obtainToken("admin@example.com", "Admin@123");
    }

    // ── INT-STD-01 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("INT-STD-01: Creating student without MOTHER guardian is rejected with 400 — both FATHER and MOTHER are required")
    void createStudent_missingMotherGuardian_returns400() throws Exception {
        CreateStudentRequest req = new CreateStudentRequest();
        req.setFullName("Emma Silva");
        req.setDateOfBirth(LocalDate.of(2020, 6, 15));
        req.setGender(Gender.FEMALE);
        req.setEntryLevel(LevelAssigned.LKG1);
        req.setEnrollmentDate(LocalDate.now());
        // Only FATHER provided — MOTHER is missing
        GuardianDto father = new GuardianDto();
        father.setFullName("Nimal Silva");
        father.setPhone("+94771234567");
        father.setRelationshipType(GuardianRelationshipType.FATHER);

        GuardianDto otherGuardian = new GuardianDto();
        otherGuardian.setFullName("Uncle Silva");
        otherGuardian.setPhone("+94771234568");
        otherGuardian.setRelationshipType(GuardianRelationshipType.GUARDIAN);

        req.setGuardians(List.of(father, otherGuardian));

        MockMultipartFile dataPart = new MockMultipartFile(
                "data", "", MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(req));

        mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .multipart("/api/v1/admin/students")
                                .file(dataPart)
                                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());

        // No student should have been saved
        assertThat(studentRepository.findAll()).isEmpty();
    }

    // ── INT-STD-02 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("INT-STD-02: Withdrawing a student disables guardian's user account when no other active children remain")
    void changeStatus_withdraw_disablesGuardianAccount_whenLastActiveChild() throws Exception {
        // Seed: parent user linked to a guardian
        User parentUser = userRepository.save(User.builder()
                .email("nimal.silva@example.com")
                .passwordHash(passwordEncoder.encode("Parent123!"))
                .role(Role.PARENT)
                .active(true)
                .mustChangePassword(false)
                .build());

        Guardian guardian = guardianRepository.save(Guardian.builder()
                .fullName("Nimal Silva")
                .email("nimal.silva@example.com")
                .phone("+94771234567")
                .user(parentUser)
                .isDeleted(false)
                .build());

        Student student = studentRepository.save(Student.builder()
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
                .build());

        studentGuardianRepository.save(StudentGuardian.builder()
                .student(student)
                .guardian(guardian)
                .relationshipType(GuardianRelationshipType.FATHER)
                .build());

        StatusChangeRequest req = new StatusChangeRequest();
        req.setStatus(StudentStatus.WITHDRAWN);
        req.setLeaveDate(LocalDate.now());

        mockMvc.perform(put("/api/v1/admin/students/" + student.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("WITHDRAWN"));

        // Verify guardian's user account was disabled
        User updatedParent = userRepository.findById(parentUser.getId()).orElseThrow();
        assertThat(updatedParent.isActive()).isFalse();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private String obtainToken(String email, String password) throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail(email);
        req.setPassword(password);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("token").asText();
    }
}
