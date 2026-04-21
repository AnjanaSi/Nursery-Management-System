package com.merrykids.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merrykids.backend.dto.LoginRequest;
import com.merrykids.backend.dto.UpdateStatusRequest;
import com.merrykids.backend.entity.AdmissionAnnouncement;
import com.merrykids.backend.entity.AdmissionSubmission;
import com.merrykids.backend.entity.ApplyingLevel;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.SubmissionStatus;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.AdmissionAnnouncementRepository;
import com.merrykids.backend.repository.AdmissionSubmissionRepository;
import com.merrykids.backend.repository.PasswordResetTokenRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MSc Integration Tests — Admissions (Feature 4)
 * Approved test IDs: INT-ADM-01, INT-ADM-02
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdmissionIntegrationMscTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordResetTokenRepository tokenRepository;
    @Autowired AdmissionAnnouncementRepository announcementRepository;
    @Autowired AdmissionSubmissionRepository submissionRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @MockitoBean
    EmailService emailService;

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        tokenRepository.deleteAll();
        submissionRepository.deleteAll();
        announcementRepository.deleteAll();
        userRepository.deleteAll();

        userRepository.save(User.builder()
                .email("admin@example.com")
                .passwordHash(passwordEncoder.encode("Admin@123"))
                .role(Role.ADMIN)
                .active(true)
                .mustChangePassword(false)
                .build());

        // Open admission window covering today
        announcementRepository.save(AdmissionAnnouncement.builder()
                .message("Admissions open for 2025/2026")
                .openDate(LocalDate.now().minusDays(5))
                .closeDate(LocalDate.now().plusDays(30))
                .build());

        adminToken = obtainToken("admin@example.com", "Admin@123");
    }

    // ── INT-ADM-01 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("INT-ADM-01: Public admission submission stored with status=RECEIVED and referenceNo matching MK-ADM-{YEAR}-{6-digits}")
    void submitApplication_openWindow_storedWithReceivedAndRefNo() throws Exception {
        MockMultipartFile pdf = new MockMultipartFile(
                "filledApplicationPdf", "application.pdf",
                MediaType.APPLICATION_PDF_VALUE, "PDF content".getBytes());

        mockMvc.perform(multipart("/api/v1/public/admissions/submissions")
                        .file(pdf)
                        .param("childFullName", "Emma Silva")
                        .param("dateOfBirth", "2020-06-15")
                        .param("levelApplyingFor", "LKG1")
                        .param("guardianFullName", "Nimal Silva")
                        .param("email", "nimal.silva@example.com")
                        .param("phone", "+94771234567")
                        .param("address", "123 Main Street, Colombo"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.referenceNo").value(
                        org.hamcrest.Matchers.matchesPattern(
                                "MK-ADM-" + LocalDate.now().getYear() + "-\\d{6}")));

        // Verify DB state
        AdmissionSubmission saved = submissionRepository.findAll().get(0);
        assertThat(saved.getStatus()).isEqualTo(SubmissionStatus.RECEIVED);
        assertThat(saved.getReferenceNo()).matches("MK-ADM-\\d{4}-\\d{6}");
    }

    // ── INT-ADM-02 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("INT-ADM-02: Admin updates submission status from RECEIVED to UNDER_REVIEW")
    void updateSubmissionStatus_adminJwt_statusUpdatedInDb() throws Exception {
        // Seed a submission directly
        AdmissionSubmission submission = submissionRepository.save(AdmissionSubmission.builder()
                .referenceNo("MK-ADM-2025-000001")
                .childFullName("Lily Silva")
                .dateOfBirth(LocalDate.of(2020, 3, 10))
                .levelApplyingFor(ApplyingLevel.LKG1)
                .guardianFullName("Nimal Silva")
                .email("nimal2@example.com")
                .phone("+94771234568")
                .address("456 Second St, Colombo")
                .status(SubmissionStatus.RECEIVED)
                .build());

        UpdateStatusRequest req = new UpdateStatusRequest();
        req.setStatus(SubmissionStatus.UNDER_REVIEW);

        mockMvc.perform(put("/api/v1/admin/admissions/submissions/" + submission.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("UNDER_REVIEW"));

        // Verify DB state
        AdmissionSubmission updated = submissionRepository.findById(submission.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(SubmissionStatus.UNDER_REVIEW);
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
