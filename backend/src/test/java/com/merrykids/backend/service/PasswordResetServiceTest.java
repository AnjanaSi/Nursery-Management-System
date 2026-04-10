package com.merrykids.backend.service;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.*;
import com.merrykids.backend.exception.InvalidTokenException;
import com.merrykids.backend.repository.*;
import com.merrykids.backend.util.TokenGenerator;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * White Box unit tests for PasswordResetService.
 * Covers forgot-password flow, reset-password flow, token reuse, and expiry.
 */
@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordResetTokenRepository tokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock EmailService emailService;
    @Mock TokenGenerator tokenGenerator;

    @InjectMocks PasswordResetService passwordResetService;

    private User activeUser;
    private User inactiveUser;

    @BeforeEach
    void setUp() {
        activeUser = User.builder()
                .id(1L).email("user@example.com")
                .passwordHash("$2a$10$hash").role(Role.PARENT)
                .active(true).mustChangePassword(false).build();

        inactiveUser = User.builder()
                .id(2L).email("disabled@example.com")
                .passwordHash("$2a$10$hash").role(Role.PARENT)
                .active(false).mustChangePassword(false).build();
    }

    // ─── requestPasswordReset ────────────────────────────────────────────────

    @Test
    @DisplayName("WB-PRS-01: Active user gets token saved and email sent; generic message returned")
    void requestReset_activeUser_savesTokenAndSendsEmail() {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("user@example.com");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(activeUser));
        when(tokenGenerator.generateResetToken()).thenReturn("raw-token");
        when(tokenGenerator.hashToken("raw-token")).thenReturn("hashed-token");

        MessageResponse resp = passwordResetService.requestPasswordReset(req);

        assertThat(resp.getMessage()).contains("If an account with that email exists");
        verify(tokenRepository).deleteByUser(activeUser);
        verify(tokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail("user@example.com", "raw-token");
    }

    @Test
    @DisplayName("WB-PRS-02: Unknown email returns generic message; no token saved, no email sent")
    void requestReset_unknownEmail_genericMessageNoEmail() {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("nobody@example.com");

        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        MessageResponse resp = passwordResetService.requestPasswordReset(req);

        assertThat(resp.getMessage()).contains("If an account with that email exists");
        verify(tokenRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetEmail(any(), any());
    }

    @Test
    @DisplayName("WB-PRS-03: Inactive user returns generic message; no email sent")
    void requestReset_inactiveUser_genericMessageNoEmail() {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("disabled@example.com");

        when(userRepository.findByEmail("disabled@example.com")).thenReturn(Optional.of(inactiveUser));

        MessageResponse resp = passwordResetService.requestPasswordReset(req);

        assertThat(resp.getMessage()).contains("If an account with that email exists");
        verify(emailService, never()).sendPasswordResetEmail(any(), any());
    }

    @Test
    @DisplayName("WB-PRS-04: Old tokens deleted before new token is saved (order verified)")
    void requestReset_deletesOldTokensBeforeSavingNew() {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("user@example.com");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(activeUser));
        when(tokenGenerator.generateResetToken()).thenReturn("raw");
        when(tokenGenerator.hashToken("raw")).thenReturn("hashed");

        passwordResetService.requestPasswordReset(req);

        InOrder order = inOrder(tokenRepository);
        order.verify(tokenRepository).deleteByUser(activeUser);
        order.verify(tokenRepository).save(any());
    }

    // ─── resetPassword ───────────────────────────────────────────────────────

    @Test
    @DisplayName("WB-PRS-05: Valid token resets password, sets mustChangePassword=false, marks token used")
    void resetPassword_validToken_updatesPasswordAndMarksUsed() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("valid-raw");
        req.setNewPassword("NewSecure1!");

        PasswordResetToken token = PasswordResetToken.builder()
                .tokenHash("valid-hash").user(activeUser)
                .expiresAt(LocalDateTime.now().plusMinutes(20)).usedAt(null).build();

        when(tokenGenerator.hashToken("valid-raw")).thenReturn("valid-hash");
        when(tokenRepository.findByTokenHash("valid-hash")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("NewSecure1!")).thenReturn("$2a$10$newHash");

        MessageResponse resp = passwordResetService.resetPassword(req);

        assertThat(resp.getMessage()).isEqualTo("Password has been reset successfully");
        verify(userRepository).save(argThat(u ->
                !u.isMustChangePassword() && u.getPasswordChangedAt() != null));
        verify(tokenRepository).save(argThat(t -> t.getUsedAt() != null));
    }

    @Test
    @DisplayName("WB-PRS-06: Already-used token throws InvalidTokenException with 'already been used' message")
    void resetPassword_usedToken_throwsInvalidTokenException() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("used-raw");
        req.setNewPassword("NewPass1!");

        PasswordResetToken used = PasswordResetToken.builder()
                .tokenHash("used-hash").user(activeUser)
                .expiresAt(LocalDateTime.now().plusMinutes(20))
                .usedAt(LocalDateTime.now().minusMinutes(5)).build();

        when(tokenGenerator.hashToken("used-raw")).thenReturn("used-hash");
        when(tokenRepository.findByTokenHash("used-hash")).thenReturn(Optional.of(used));

        assertThatThrownBy(() -> passwordResetService.resetPassword(req))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("already been used");
    }

    @Test
    @DisplayName("WB-PRS-07: Expired token throws InvalidTokenException with 'expired' message")
    void resetPassword_expiredToken_throwsInvalidTokenException() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("expired-raw");
        req.setNewPassword("NewPass1!");

        PasswordResetToken expired = PasswordResetToken.builder()
                .tokenHash("exp-hash").user(activeUser)
                .expiresAt(LocalDateTime.now().minusMinutes(5)).usedAt(null).build();

        when(tokenGenerator.hashToken("expired-raw")).thenReturn("exp-hash");
        when(tokenRepository.findByTokenHash("exp-hash")).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> passwordResetService.resetPassword(req))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("expired");
    }

    @Test
    @DisplayName("WB-PRS-08: Non-existent token throws InvalidTokenException")
    void resetPassword_unknownToken_throwsInvalidTokenException() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("garbage");
        req.setNewPassword("NewPass1!");

        when(tokenGenerator.hashToken("garbage")).thenReturn("garbage-hash");
        when(tokenRepository.findByTokenHash("garbage-hash")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.resetPassword(req))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    @DisplayName("WB-PRS-09: Token for inactive user throws InvalidTokenException with 'not active' message")
    void resetPassword_inactiveUserToken_throwsInvalidTokenException() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("valid-for-inactive");
        req.setNewPassword("NewPass1!");

        PasswordResetToken token = PasswordResetToken.builder()
                .tokenHash("inactive-hash").user(inactiveUser)
                .expiresAt(LocalDateTime.now().plusMinutes(20)).usedAt(null).build();

        when(tokenGenerator.hashToken("valid-for-inactive")).thenReturn("inactive-hash");
        when(tokenRepository.findByTokenHash("inactive-hash")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.resetPassword(req))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("not active");
    }

    @Test
    @DisplayName("WB-PRS-10: Token cannot be reused — second use throws InvalidTokenException")
    void resetPassword_reuseToken_secondCallThrows() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setToken("one-time-raw");
        req.setNewPassword("NewPass1!");

        PasswordResetToken token = PasswordResetToken.builder()
                .tokenHash("one-time-hash").user(activeUser)
                .expiresAt(LocalDateTime.now().plusMinutes(20)).usedAt(null).build();

        when(tokenGenerator.hashToken("one-time-raw")).thenReturn("one-time-hash");
        when(tokenRepository.findByTokenHash("one-time-hash")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("NewPass1!")).thenReturn("$2a$10$newHash");

        // First use succeeds
        passwordResetService.resetPassword(req);

        // Simulate token now marked as used (as resetPassword does)
        token.setUsedAt(LocalDateTime.now());

        // Second use must fail
        assertThatThrownBy(() -> passwordResetService.resetPassword(req))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("already been used");
    }
}
