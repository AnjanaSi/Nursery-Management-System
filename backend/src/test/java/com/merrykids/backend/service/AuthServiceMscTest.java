package com.merrykids.backend.service;

import com.merrykids.backend.dto.ChangePasswordRequest;
import com.merrykids.backend.dto.LoginRequest;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.UserRepository;
import com.merrykids.backend.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * MSc Unit Tests — Authentication Service
 * Approved test IDs: AUTH-U01, AUTH-U02
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceMscTest {

    @Mock AuthenticationManager authenticationManager;
    @Mock JwtTokenProvider jwtTokenProvider;
    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks AuthService authService;

    private User activeUser;

    @BeforeEach
    void setUp() {
        activeUser = User.builder()
                .id(1L)
                .email("teacher@example.com")
                .passwordHash("$2a$10$hashedPassword")
                .role(Role.TEACHER)
                .active(true)
                .mustChangePassword(false)
                .build();
    }

    // ── AUTH-U01 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("AUTH-U01: Login with incorrect password throws BadCredentialsException; no JWT generated")
    void login_incorrectPassword_throwsBadCredentials_noTokenGenerated() {
        LoginRequest req = new LoginRequest();
        req.setEmail("teacher@example.com");
        req.setPassword("WrongPass!99");

        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class);

        // No JWT must be generated when credentials fail
        verify(jwtTokenProvider, never()).generateToken(any(), any());
    }

    // ── AUTH-U02 ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("AUTH-U02: New password identical to current password is rejected with IllegalArgumentException")
    void changePassword_newPasswordSameAsCurrent_throwsIllegalArgument() {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("Same@Pass1");
        req.setNewPassword("Same@Pass1");

        when(userRepository.findByEmail("teacher@example.com")).thenReturn(Optional.of(activeUser));
        // Both currentPassword and newPassword match the stored hash
        when(passwordEncoder.matches("Same@Pass1", activeUser.getPasswordHash())).thenReturn(true);

        assertThatThrownBy(() -> authService.changePassword("teacher@example.com", req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("New password must be different");
    }
}
