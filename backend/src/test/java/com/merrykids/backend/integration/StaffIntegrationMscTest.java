package com.merrykids.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merrykids.backend.dto.LoginRequest;
import com.merrykids.backend.dto.TeacherCreateRequest;
import com.merrykids.backend.entity.Designation;
import com.merrykids.backend.entity.LevelAssigned;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.Teacher;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.PasswordResetTokenRepository;
import com.merrykids.backend.repository.TeacherRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MSc Integration Tests — Staff Management (Feature 5)
 * Approved test IDs: INT-STF-01, INT-STF-02
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class StaffIntegrationMscTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired TeacherRepository teacherRepository;
    @Autowired PasswordResetTokenRepository tokenRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @MockitoBean
    EmailService emailService;

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        tokenRepository.deleteAll();
        teacherRepository.deleteAll();
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

    // ── INT-STF-01 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("INT-STF-01: Creating teacher with account provisions Teacher record and linked User(TEACHER, mustChangePassword=true)")
    void createTeacherWithAccount_provisionsTeacherAndUser() throws Exception {
        TeacherCreateRequest req = buildTeacherRequest("Ms. Kumari Perera", "kumari@merrykids.lk");

        MockMultipartFile dataPart = new MockMultipartFile(
                "data", "", MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(req));

        mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .multipart("/api/v1/admin/staff/with-account")
                                .file(dataPart)
                                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.employmentId").value(
                        org.hamcrest.Matchers.matchesPattern("MK-STF-\\d{4}-\\d{4}")));

        // Verify Teacher saved in DB
        Teacher savedTeacher = teacherRepository.findAll().stream()
                .filter(t -> "kumari@merrykids.lk".equals(t.getEmail()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Teacher not found in DB"));
        assertThat(savedTeacher.getEmploymentId()).matches("MK-STF-\\d{4}-\\d{4}");
        assertThat(savedTeacher.getUser()).isNotNull();

        // Verify linked User has correct role and mustChangePassword=true
        User linkedUser = savedTeacher.getUser();
        assertThat(linkedUser.getRole()).isEqualTo(Role.TEACHER);
        assertThat(linkedUser.isActive()).isTrue();
        assertThat(linkedUser.isMustChangePassword()).isTrue();
    }

    // ── INT-STF-02 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("INT-STF-02: Revoking teacher account sets user.active=false and teacher.user=null; profile retained")
    void revokeTeacherAccount_disablesUserAndUnlinks_teacherProfileRetained() throws Exception {
        // Create teacher with account first
        User linkedUser = userRepository.save(User.builder()
                .email("revoketest@merrykids.lk")
                .passwordHash(passwordEncoder.encode("Teacher123!"))
                .role(Role.TEACHER)
                .active(true)
                .mustChangePassword(false)
                .build());

        Teacher teacher = teacherRepository.save(Teacher.builder()
                .employmentId("MK-STF-2025-TEST1")
                .fullName("Test Teacher")
                .email("revoketest@merrykids.lk")
                .dateOfBirth(LocalDate.of(1985, 5, 10))
                .phoneNumber("+94771234567")
                .permanentAddress("123 Main St")
                .currentAddress("123 Main St")
                .emergencyContactName("Emergency Contact")
                .emergencyContactNumber("+94771234568")
                .dateOfJoining(LocalDate.of(2020, 1, 15))
                .levelAssigned(LevelAssigned.LKG1)
                .designation(Designation.TEACHER)
                .isDeleted(false)
                .user(linkedUser)
                .build());

        mockMvc.perform(delete("/api/v1/admin/staff/" + teacher.getId() + "/account")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Verify User is now disabled
        User updatedUser = userRepository.findById(linkedUser.getId()).orElseThrow();
        assertThat(updatedUser.isActive()).isFalse();

        // Verify teacher.user link is removed (null)
        Teacher updatedTeacher = teacherRepository.findById(teacher.getId()).orElseThrow();
        assertThat(updatedTeacher.getUser()).isNull();

        // Verify Teacher profile itself still exists (not deleted)
        assertThat(updatedTeacher.isDeleted()).isFalse();
        assertThat(updatedTeacher.getFullName()).isEqualTo("Test Teacher");
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private TeacherCreateRequest buildTeacherRequest(String name, String email) {
        TeacherCreateRequest req = new TeacherCreateRequest();
        req.setFullName(name);
        req.setEmail(email);
        req.setDateOfBirth(LocalDate.of(1988, 4, 20));
        req.setPhoneNumber("+94771234567");
        req.setPermanentAddress("123 Main Street, Colombo");
        req.setCurrentAddress("123 Main Street, Colombo");
        req.setEmergencyContactName("Emergency Contact");
        req.setEmergencyContactNumber("+94771234568");
        req.setDateOfJoining(LocalDate.now().minusMonths(6));
        req.setLevelAssigned(LevelAssigned.LKG1);
        req.setDesignation(Designation.TEACHER);
        return req;
    }

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
