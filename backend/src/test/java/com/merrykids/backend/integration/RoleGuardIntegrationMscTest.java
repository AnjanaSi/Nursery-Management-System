package com.merrykids.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merrykids.backend.dto.LoginRequest;
import com.merrykids.backend.entity.Designation;
import com.merrykids.backend.entity.EmploymentStatus;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MSc Integration Test — Cross-feature Role Guard
 * Approved test ID: INT-ROLE-01
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class RoleGuardIntegrationMscTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired TeacherRepository teacherRepository;
    @Autowired PasswordResetTokenRepository tokenRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @MockitoBean
    EmailService emailService;

    private String teacherToken;

    @BeforeEach
    void setUp() throws Exception {
        tokenRepository.deleteAll();
        teacherRepository.deleteAll();
        userRepository.deleteAll();

        User teacherUser = userRepository.save(User.builder()
                .email("teacher@example.com")
                .passwordHash(passwordEncoder.encode("Teacher123!"))
                .role(Role.TEACHER)
                .active(true)
                .mustChangePassword(false)
                .build());

        teacherRepository.save(Teacher.builder()
                .employmentId("MK-STF-2025-0001")
                .fullName("Test Teacher")
                .email("teacher@example.com")
                .dateOfBirth(LocalDate.of(1988, 5, 20))
                .phoneNumber("+94771234569")
                .permanentAddress("456 Side St").currentAddress("456 Side St")
                .emergencyContactName("EC").emergencyContactNumber("+94771234570")
                .dateOfJoining(LocalDate.of(2021, 1, 10))
                .levelAssigned(LevelAssigned.UKG1)
                .designation(Designation.TEACHER)
                .employmentStatus(EmploymentStatus.ACTIVE)
                .isDeleted(false).user(teacherUser).build());

        teacherToken = obtainToken("teacher@example.com", "Teacher123!");
    }

    // ── INT-ROLE-01 ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("INT-ROLE-01: TEACHER JWT cannot access admin-only admission submissions endpoint — returns 403")
    void teacherJwt_cannotAccessAdminAdmissions_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/admissions/submissions")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isForbidden());
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
