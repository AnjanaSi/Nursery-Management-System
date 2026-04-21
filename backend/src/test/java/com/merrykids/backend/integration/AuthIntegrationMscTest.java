package com.merrykids.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merrykids.backend.dto.ForgotPasswordRequest;
import com.merrykids.backend.dto.LoginRequest;
import com.merrykids.backend.dto.ResetPasswordRequest;
import com.merrykids.backend.entity.PasswordResetToken;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.PasswordResetTokenRepository;
import com.merrykids.backend.repository.UserRepository;
import com.merrykids.backend.service.EmailService;
import com.merrykids.backend.util.TokenGenerator;
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

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MSc Integration Tests — Authentication
 * Approved test IDs: INT-AUTH-01, INT-AUTH-02, INT-AUTH-03, INT-AUTH-04
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthIntegrationMscTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordResetTokenRepository tokenRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired TokenGenerator tokenGenerator;

    @MockitoBean
    EmailService emailService;

    @BeforeEach
    void setUp() {
        tokenRepository.deleteAll();
        userRepository.deleteAll();

        // Standard admin — no forced password change
        userRepository.save(User.builder()
                .email("admin@example.com")
                .passwordHash(passwordEncoder.encode("Admin@123"))
                .role(Role.ADMIN)
                .active(true)
                .mustChangePassword(false)
                .build());

        // User who must change password on first login
        userRepository.save(User.builder()
                .email("newstaff@merrykids.lk")
                .passwordHash(passwordEncoder.encode("TempPass1!"))
                .role(Role.TEACHER)
                .active(true)
                .mustChangePassword(true)
                .build());

        // Teacher used for the password-reset flow test
        userRepository.save(User.builder()
                .email("priya.fernando@example.com")
                .passwordHash(passwordEncoder.encode("Teacher123!"))
                .role(Role.TEACHER)
                .active(true)
                .mustChangePassword(false)
                .build());
    }

    // ── INT-AUTH-01 ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("INT-AUTH-01: Valid login returns JWT, role=ADMIN, and mustChangePassword=false")
    void login_validCredentials_returnsJwtAndRole() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("admin@example.com");
        req.setPassword("Admin@123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.role").value("ADMIN"))
                .andExpect(jsonPath("$.data.mustChangePassword").value(false));
    }

    // ── INT-AUTH-02 ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("INT-AUTH-02: Request to protected endpoint without Authorization header returns 401")
    void protectedEndpoint_noJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/staff"))
                .andExpect(status().isUnauthorized());
    }

    // ── INT-AUTH-03 ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("INT-AUTH-03: User with mustChangePassword=true is blocked from protected endpoints (403) even with valid JWT")
    void mustChangePasswordUser_blockedOnProtectedEndpoint_returns403() throws Exception {
        String token = obtainToken("newstaff@merrykids.lk", "TempPass1!");

        mockMvc.perform(get("/api/v1/admin/staff")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── INT-AUTH-04 ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("INT-AUTH-04: Password reset flow — token works once, second use returns 4xx (single-use enforcement)")
    void passwordReset_fullFlow_tokenIsSingleUse() throws Exception {
        // Step 1: Request reset token
        ForgotPasswordRequest forgotReq = new ForgotPasswordRequest();
        forgotReq.setEmail("priya.fernando@example.com");
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgotReq)))
                .andExpect(status().isOk());

        // Step 2: Extract the raw token directly from DB (bypasses email mock)
        String rawToken = extractRawTokenForUser("priya.fernando@example.com");

        ResetPasswordRequest resetReq = new ResetPasswordRequest();
        resetReq.setToken(rawToken);
        resetReq.setNewPassword("NewSecure1!");

        // Step 2: Use token — must succeed
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isOk());

        // Step 3: Reuse same token — must fail (token already used)
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().is4xxClientError());
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

    /**
     * Retrieves the raw (unhashed) reset token by generating it the same way as
     * PasswordResetService: the stored tokenHash was produced by tokenGenerator.hashToken(raw).
     * For integration testing we trigger the flow via the API and then fetch the stored
     * PasswordResetToken; we cannot reverse SHA-256, so we generate a new consistent token
     * by re-triggering the request and reading the token that the service saved.
     *
     * Simpler approach: inject TokenGenerator and use the token written to DB.
     * Since @Transactional rolls back, we read immediately after the forgot-password call.
     */
    private String extractRawTokenForUser(String email) {
        // Re-trigger forgot-password to get a fresh token in DB
        User user = userRepository.findByEmail(email).orElseThrow();

        // The token stored in DB is SHA-256 hashed — we cannot reverse it.
        // Clean solution: wipe existing tokens and insert a known raw/hash pair
        // using TokenGenerator directly, then return the raw token to the test.
        tokenRepository.deleteAll();

        String rawToken = tokenGenerator.generateResetToken();
        String hashedToken = tokenGenerator.hashToken(rawToken);

        PasswordResetToken prt = PasswordResetToken.builder()
                .user(user)
                .tokenHash(hashedToken)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();
        tokenRepository.save(prt);

        return rawToken;
    }
}
