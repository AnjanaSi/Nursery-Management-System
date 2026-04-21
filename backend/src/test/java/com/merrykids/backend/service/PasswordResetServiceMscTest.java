package com.merrykids.backend.service;

import com.merrykids.backend.dto.ResetPasswordRequest;
import com.merrykids.backend.entity.PasswordResetToken;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.exception.InvalidTokenException;
import com.merrykids.backend.repository.PasswordResetTokenRepository;
import com.merrykids.backend.repository.UserRepository;
import com.merrykids.backend.util.TokenGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * MSc Unit Tests — Password Reset Service
 * Approved test IDs: AUTH-U03, AUTH-U04
 */
@ExtendWith(MockitoExtension.class)
class PasswordResetServiceMscTest {

    @Mock UserRepository userRepository;
    @Mock PasswordResetTokenRepository tokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock EmailService emailService;
    @Mock TokenGenerator tokenGenerator;

    @InjectMocks PasswordResetService passwordResetService;

    private User activeUser;

    @BeforeEach
    void setUp() {
        activeUser = User.builder()
                .id(1L)
                .email("priya.fernando@example.com")
                .passwordHash("$2a$10$hash")
                .role(Role.TEACHER)
                .active(true)
                .mustChangePassword(false)
                .build();
    }

    // ── AUTH-U03 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("AUTH-U03: Expired reset token (>30 min) throws InvalidTokenException; password unchanged")
    void resetPassword_expiredToken_throwsInvalidTokenException() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("expired-raw-token");
        req.setNewPassword("NewPassword1!");

        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .tokenHash("expired-hash")
                .user(activeUser)
                // Token expired 31 minutes ago — beyond the 30-minute window
                .expiresAt(LocalDateTime.now().minusMinutes(31))
                .usedAt(null)
                .build();

        org.mockito.Mockito.when(tokenGenerator.hashToken("expired-raw-token")).thenReturn("expired-hash");
        org.mockito.Mockito.when(tokenRepository.findByTokenHash("expired-hash"))
                .thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> passwordResetService.resetPassword(req))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("expired");

        // Password must not have been updated
        org.mockito.Mockito.verify(userRepository, org.mockito.Mockito.never()).save(any());
    }

    // ── AUTH-U04 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("AUTH-U04: Already-used reset token throws InvalidTokenException; password unchanged")
    void resetPassword_alreadyUsedToken_throwsInvalidTokenException() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("used-raw-token");
        req.setNewPassword("NewPassword1!");

        PasswordResetToken usedToken = PasswordResetToken.builder()
                .tokenHash("used-hash")
                .user(activeUser)
                .expiresAt(LocalDateTime.now().plusMinutes(20))
                // usedAt already set — token has been consumed
                .usedAt(LocalDateTime.now().minusMinutes(5))
                .build();

        org.mockito.Mockito.when(tokenGenerator.hashToken("used-raw-token")).thenReturn("used-hash");
        org.mockito.Mockito.when(tokenRepository.findByTokenHash("used-hash"))
                .thenReturn(Optional.of(usedToken));

        assertThatThrownBy(() -> passwordResetService.resetPassword(req))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("already been used");

        // Password must not have been updated
        org.mockito.Mockito.verify(userRepository, org.mockito.Mockito.never()).save(any());
    }

    // ── helper ───────────────────────────────────────────────────────────────

    private static <T> T any() {
        return org.mockito.ArgumentMatchers.any();
    }
}
