package com.merrykids.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.*;
import com.merrykids.backend.repository.*;
import com.merrykids.backend.service.EmailService;
import com.merrykids.backend.util.TokenGenerator;
import org.junit.jupiter.api.*;
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

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for forgot-password and reset-password flows.
 * Uses H2 in-memory database (profile: test) and mocks EmailService.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PasswordResetIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordResetTokenRepository tokenRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired TokenGenerator tokenGenerator;

    @MockitoBean
    EmailService emailService;

    private User testUser;

    @BeforeEach
    void setUp() {
        tokenRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(User.builder()
                .email("reset@example.com")
                .passwordHash(passwordEncoder.encode("OldPass1!"))
                .role(Role.PARENT)
                .active(true)
                .mustChangePassword(false)
                .build());
    }

    // ─── /forgot-password ────────────────────────────────────────────────────

    @Test
    @DisplayName("IT-PRF-01: Forgot password for existing active user returns 200 with generic message")
    void forgotPassword_existingActiveUser_returns200GenericMessage() throws Exception {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("reset@example.com");

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.message").value(
                        "If an account with that email exists, a password reset link has been sent"));
    }

    @Test
    @DisplayName("IT-PRF-02: Forgot password for unknown email returns same 200 generic message (no user enumeration)")
    void forgotPassword_unknownEmail_sameGenericMessage() throws Exception {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("nobody@example.com");

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.message").value(
                        "If an account with that email exists, a password reset link has been sent"));
    }

    @Test
    @DisplayName("IT-PRF-03: Forgot password with invalid email format returns 400 validation error")
    void forgotPassword_invalidEmailFormat_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("IT-PRF-04: Forgot password endpoint is accessible without JWT (public endpoint)")
    void forgotPassword_noJwt_notBlockedBy401() throws Exception {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("reset@example.com");

        // Must return 200, not 401 — it is a public endpoint
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    // ─── /reset-password ─────────────────────────────────────────────────────

    @Test
    @DisplayName("IT-PRS-01: Valid token resets password successfully; new password works at login")
    void resetPassword_validToken_passwordChangedAndLoginWorks() throws Exception {
        String rawToken = tokenGenerator.generateResetToken();
        tokenRepository.save(PasswordResetToken.builder()
                .tokenHash(tokenGenerator.hashToken(rawToken))
                .user(testUser)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build());

        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken(rawToken);
        req.setNewPassword("NewReset1!");

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.message").value("Password has been reset successfully"));

        // Verify the new password now works at login
        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("reset@example.com");
        loginReq.setPassword("NewReset1!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("IT-PRS-02: Already-used token returns 400 with descriptive error")
    void resetPassword_usedToken_returns400() throws Exception {
        String rawToken = tokenGenerator.generateResetToken();
        tokenRepository.save(PasswordResetToken.builder()
                .tokenHash(tokenGenerator.hashToken(rawToken))
                .user(testUser)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .usedAt(LocalDateTime.now().minusMinutes(2))   // already used
                .build());

        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken(rawToken);
        req.setNewPassword("NewPass1!");

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("This reset token has already been used"));
    }

    @Test
    @DisplayName("IT-PRS-03: Expired token returns 400 with descriptive error")
    void resetPassword_expiredToken_returns400() throws Exception {
        String rawToken = tokenGenerator.generateResetToken();
        tokenRepository.save(PasswordResetToken.builder()
                .tokenHash(tokenGenerator.hashToken(rawToken))
                .user(testUser)
                .expiresAt(LocalDateTime.now().minusMinutes(5))   // expired
                .build());

        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken(rawToken);
        req.setNewPassword("NewPass1!");

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Reset token has expired"));
    }

    @Test
    @DisplayName("IT-PRS-04: Non-existent token returns 400")
    void resetPassword_unknownToken_returns400() throws Exception {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("completelyfaketoken1234567");
        req.setNewPassword("NewPass1!");

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("IT-PRS-05: Token cannot be reused — second attempt returns 400")
    void resetPassword_tokenCannotBeReused() throws Exception {
        String rawToken = tokenGenerator.generateResetToken();
        tokenRepository.save(PasswordResetToken.builder()
                .tokenHash(tokenGenerator.hashToken(rawToken))
                .user(testUser)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build());

        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken(rawToken);
        req.setNewPassword("FirstNew1!");

        // First use succeeds
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // Second use must fail
        req.setNewPassword("SecondNew1!");
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("This reset token has already been used"));
    }

    @Test
    @DisplayName("IT-PRS-06: Reset password endpoint accessible without JWT (returns 400 not 401 for bad token)")
    void resetPassword_noJwt_notBlockedByAuth() throws Exception {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("nonexistent");
        req.setNewPassword("NewPass1!");

        // Must be 400 (invalid token), NOT 401 (unauthenticated)
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("IT-PRS-07: Successful reset clears mustChangePassword=false and sets passwordChangedAt in DB")
    void resetPassword_validToken_persistsStateChangesInDb() throws Exception {
        testUser.setMustChangePassword(true);
        userRepository.save(testUser);

        String rawToken = tokenGenerator.generateResetToken();
        tokenRepository.save(PasswordResetToken.builder()
                .tokenHash(tokenGenerator.hashToken(rawToken))
                .user(testUser)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build());

        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken(rawToken);
        req.setNewPassword("ClearedPass1!");

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        User updated = userRepository.findByEmail("reset@example.com").orElseThrow();
        assertThat(updated.isMustChangePassword()).isFalse();
        assertThat(updated.getPasswordChangedAt()).isNotNull();
    }

    // ─── helper ──────────────────────────────────────────────────────────────

    @SuppressWarnings("unused")
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
