package com.merrykids.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merrykids.backend.dto.LoginRequest;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.PasswordResetTokenRepository;
import com.merrykids.backend.repository.UserRepository;
import com.merrykids.backend.service.EmailService;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Security integration tests for Feature 2 Authentication.
 * Verifies public endpoint access, JWT enforcement, role-based access control,
 * and disabled-account handling.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SecurityRulesIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordResetTokenRepository tokenRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @MockitoBean
    EmailService emailService;

    @BeforeEach
    void setUp() {
        tokenRepository.deleteAll();
        userRepository.deleteAll();

        userRepository.save(User.builder()
                .email("admin@example.com")
                .passwordHash(passwordEncoder.encode("Admin123!"))
                .role(Role.ADMIN).active(true).mustChangePassword(false).build());

        userRepository.save(User.builder()
                .email("teacher@example.com")
                .passwordHash(passwordEncoder.encode("Teacher123!"))
                .role(Role.TEACHER).active(true).mustChangePassword(false).build());

        userRepository.save(User.builder()
                .email("parent@example.com")
                .passwordHash(passwordEncoder.encode("Parent123!"))
                .role(Role.PARENT).active(true).mustChangePassword(false).build());
    }

    // ─── Public endpoints accessible without JWT ─────────────────────────────

    @Test
    @DisplayName("SEC-01: GET /api/v1/health is accessible without JWT")
    void healthEndpoint_noJwt_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("SEC-02: POST /api/v1/auth/login is accessible without JWT")
    void loginEndpoint_noJwt_accessible() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("admin@example.com");
        req.setPassword("Admin123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("SEC-03: POST /api/v1/auth/forgot-password is accessible without JWT → 200")
    void forgotPasswordEndpoint_noJwt_returns200() throws Exception {
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@example.com\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("SEC-04: POST /api/v1/auth/reset-password is accessible without JWT → not 401")
    void resetPasswordEndpoint_noJwt_notBlockedByAuth() throws Exception {
        // Returns 400 (invalid token), not 401 (unauthenticated) — confirms it is public
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"fake\",\"newPassword\":\"NewPass1!\"}"))
                .andExpect(status().isBadRequest());
    }

    // ─── Protected endpoints blocked without JWT ──────────────────────────────

    @Test
    @DisplayName("SEC-05: GET /api/v1/auth/me without JWT returns 401 'Authentication required'")
    void meEndpoint_noJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Authentication required"));
    }

    @Test
    @DisplayName("SEC-06: GET /api/v1/auth/me with malformed JWT returns 401")
    void meEndpoint_malformedJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer not.a.valid.token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SEC-07: POST /api/v1/admin/users without JWT returns 401")
    void adminCreateUser_noJwt_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"x@x.com\",\"role\":\"PARENT\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ─── Role-based access control ────────────────────────────────────────────

    @Test
    @DisplayName("SEC-08: POST /api/v1/admin/users with TEACHER token → 403 Forbidden")
    void adminCreateUser_teacherToken_returns403() throws Exception {
        String token = obtainToken("teacher@example.com", "Teacher123!");

        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"x@x.com\",\"role\":\"PARENT\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("SEC-09: POST /api/v1/admin/users with PARENT token → 403 Forbidden")
    void adminCreateUser_parentToken_returns403() throws Exception {
        String token = obtainToken("parent@example.com", "Parent123!");

        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"x@x.com\",\"role\":\"PARENT\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("SEC-10: POST /api/v1/admin/users with ADMIN token → 201 Created")
    void adminCreateUser_adminToken_returns201() throws Exception {
        String token = obtainToken("admin@example.com", "Admin123!");

        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"newteacher@example.com\",\"role\":\"TEACHER\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.mustChangePassword").value(true));
    }

    @Test
    @DisplayName("SEC-11: ADMIN can access GET /api/v1/auth/me with valid token → 200")
    void adminToken_canAccessMeEndpoint() throws Exception {
        String token = obtainToken("admin@example.com", "Admin123!");

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("admin@example.com"))
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    @Test
    @DisplayName("SEC-12: TEACHER can access GET /api/v1/auth/me with valid token → 200")
    void teacherToken_canAccessMeEndpoint() throws Exception {
        String token = obtainToken("teacher@example.com", "Teacher123!");

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("TEACHER"));
    }

    // ─── Disabled account ─────────────────────────────────────────────────────

    @Test
    @DisplayName("SEC-13: Disabled (active=false) account returns 401 'Account is disabled' on login")
    void login_disabledAccount_returns401() throws Exception {
        userRepository.save(User.builder()
                .email("disabled@example.com")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .role(Role.PARENT).active(false).mustChangePassword(false).build());

        LoginRequest req = new LoginRequest();
        req.setEmail("disabled@example.com");
        req.setPassword("Pass123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Account is disabled"));
    }

    @Test
    @DisplayName("SEC-14: Login with missing fields returns 400 validation error")
    void login_missingFields_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("SEC-15: Login with invalid email format returns 400 validation error")
    void login_invalidEmailFormat_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\",\"password\":\"Pass1!\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ─── helper ──────────────────────────────────────────────────────────────

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
