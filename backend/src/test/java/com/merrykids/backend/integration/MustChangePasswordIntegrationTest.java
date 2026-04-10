package com.merrykids.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.*;
import com.merrykids.backend.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the forced password-change flow.
 * Verifies that mustChangePassword=true blocks protected endpoints,
 * allows permitted endpoints, and that the flag clears after a successful change.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MustChangePasswordIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordResetTokenRepository tokenRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private String forcedToken;

    @BeforeEach
    void setUp() throws Exception {
        tokenRepository.deleteAll();
        userRepository.deleteAll();

        // User who must change password immediately
        userRepository.save(User.builder()
                .email("forced@example.com")
                .passwordHash(passwordEncoder.encode("Temp123!"))
                .role(Role.TEACHER)
                .active(true)
                .mustChangePassword(true)
                .build());

        // Normal user for comparison
        userRepository.save(User.builder()
                .email("normal@example.com")
                .passwordHash(passwordEncoder.encode("Normal123!"))
                .role(Role.ADMIN)
                .active(true)
                .mustChangePassword(false)
                .build());

        forcedToken = obtainToken("forced@example.com", "Temp123!");
    }

    @Test
    @DisplayName("IT-MCP-01: Login response includes mustChangePassword=true for forced-change user")
    void login_forcedChangeUser_responseIncludesFlagTrue() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("forced@example.com");
        req.setPassword("Temp123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mustChangePassword").value(true));
    }

    @Test
    @DisplayName("IT-MCP-02: Normal user login response has mustChangePassword=false")
    void login_normalUser_responseIncludesFlagFalse() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("normal@example.com");
        req.setPassword("Normal123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mustChangePassword").value(false));
    }

    @Test
    @DisplayName("IT-MCP-03: mustChangePassword user blocked on protected endpoint → 403 'Password change required'")
    void mustChangeUser_blockedOnProtectedEndpoint_403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/admins")
                        .header("Authorization", "Bearer " + forcedToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Password change required"));
    }

    @Test
    @DisplayName("IT-MCP-04: mustChangePassword user can access GET /api/v1/auth/me → 200")
    void mustChangeUser_canAccessMeEndpoint_200() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + forcedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("forced@example.com"));
    }

    @Test
    @DisplayName("IT-MCP-05: mustChangePassword user can POST to /api/v1/auth/change-password → 200")
    void mustChangeUser_canPostChangePassword_200() throws Exception {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("Temp123!");
        req.setNewPassword("NewStrong1!");

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", "Bearer " + forcedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.message").value("Password changed successfully"));
    }

    @Test
    @DisplayName("IT-MCP-06: After password change, mustChangePassword=false persisted in DB")
    void afterPasswordChange_flagClearedInDb() throws Exception {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("Temp123!");
        req.setNewPassword("NewStrong1!");

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", "Bearer " + forcedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        User updated = userRepository.findByEmail("forced@example.com").orElseThrow();
        assertThat(updated.isMustChangePassword()).isFalse();
        assertThat(updated.getPasswordChangedAt()).isNotNull();
    }

    @Test
    @DisplayName("IT-MCP-07: After password change, user can login with new credentials")
    void afterPasswordChange_newCredentialsWork() throws Exception {
        ChangePasswordRequest changeReq = new ChangePasswordRequest();
        changeReq.setCurrentPassword("Temp123!");
        changeReq.setNewPassword("NewStrong1!");

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", "Bearer " + forcedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changeReq)))
                .andExpect(status().isOk());

        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("forced@example.com");
        loginReq.setPassword("NewStrong1!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mustChangePassword").value(false));
    }

    @Test
    @DisplayName("IT-MCP-08: Wrong current password on change-password returns 401")
    void changePassword_wrongCurrentPassword_returns401() throws Exception {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("WrongOld!");
        req.setNewPassword("NewStrong1!");

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", "Bearer " + forcedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Invalid email or password"));
    }

    @Test
    @DisplayName("IT-MCP-09: Same new password as current returns 400")
    void changePassword_sameAsCurrentPassword_returns400() throws Exception {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("Temp123!");
        req.setNewPassword("Temp123!");

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", "Bearer " + forcedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("IT-MCP-10: change-password without JWT returns 401")
    void changePassword_noJwt_returns401() throws Exception {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("Temp123!");
        req.setNewPassword("NewStrong1!");

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
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
