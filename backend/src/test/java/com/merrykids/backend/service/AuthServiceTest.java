package com.merrykids.backend.service;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.exception.NotFoundException;
import com.merrykids.backend.repository.UserRepository;
import com.merrykids.backend.security.JwtTokenProvider;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * White Box unit tests for AuthService.
 * Tests internal logic for login, getCurrentUser, and changePassword.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock AuthenticationManager authenticationManager;
    @Mock JwtTokenProvider jwtTokenProvider;
    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks AuthService authService;

    private User adminUser;
    private User mustChangeUser;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L).email("admin@example.com")
                .passwordHash("$2a$10$hash1")
                .role(Role.ADMIN).active(true).mustChangePassword(false).build();

        mustChangeUser = User.builder()
                .id(2L).email("newuser@example.com")
                .passwordHash("$2a$10$hash2")
                .role(Role.TEACHER).active(true).mustChangePassword(true).build();
    }

    // ─── Login ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("WB-AS-01: Valid credentials return JWT token, correct role, email, mustChangePassword=false")
    void login_validCredentials_returnsFullLoginResponse() {
        LoginRequest req = new LoginRequest();
        req.setEmail("admin@example.com");
        req.setPassword("Admin123!");

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(jwtTokenProvider.generateToken("admin@example.com", "ADMIN")).thenReturn("mock-jwt");

        LoginResponse resp = authService.login(req);

        assertThat(resp.getToken()).isEqualTo("mock-jwt");
        assertThat(resp.getRole()).isEqualTo("ADMIN");
        assertThat(resp.getEmail()).isEqualTo("admin@example.com");
        assertThat(resp.isMustChangePassword()).isFalse();
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("WB-AS-02: mustChangePassword user login returns mustChangePassword=true in response")
    void login_mustChangePasswordUser_returnsFlagTrue() {
        LoginRequest req = new LoginRequest();
        req.setEmail("newuser@example.com");
        req.setPassword("Temp123!");

        when(userRepository.findByEmail("newuser@example.com")).thenReturn(Optional.of(mustChangeUser));
        when(jwtTokenProvider.generateToken("newuser@example.com", "TEACHER")).thenReturn("jwt-temp");

        LoginResponse resp = authService.login(req);

        assertThat(resp.isMustChangePassword()).isTrue();
        assertThat(resp.getRole()).isEqualTo("TEACHER");
    }

    @Test
    @DisplayName("WB-AS-03: Invalid password throws BadCredentialsException; no token generated")
    void login_invalidPassword_throwsBadCredentials_noTokenGenerated() {
        LoginRequest req = new LoginRequest();
        req.setEmail("admin@example.com");
        req.setPassword("WrongPass!");

        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager).authenticate(any());

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class);
        verify(jwtTokenProvider, never()).generateToken(any(), any());
    }

    @Test
    @DisplayName("WB-AS-04: Unknown email causes BadCredentialsException from AuthenticationManager")
    void login_unknownEmail_throwsBadCredentials() {
        LoginRequest req = new LoginRequest();
        req.setEmail("ghost@example.com");
        req.setPassword("AnyPass1!");

        doThrow(new BadCredentialsException("User not found"))
                .when(authenticationManager).authenticate(any());

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class);
    }

    // ─── getCurrentUser ──────────────────────────────────────────────────────

    @Test
    @DisplayName("WB-AS-05: getCurrentUser returns email and role for existing user")
    void getCurrentUser_knownEmail_returnsUserInfo() {
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(adminUser));

        UserInfoResponse resp = authService.getCurrentUser("admin@example.com");

        assertThat(resp.getEmail()).isEqualTo("admin@example.com");
        assertThat(resp.getRole()).isEqualTo("ADMIN");
    }

    @Test
    @DisplayName("WB-AS-06: getCurrentUser throws NotFoundException for unknown email")
    void getCurrentUser_unknownEmail_throwsNotFoundException() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getCurrentUser("ghost@example.com"))
                .isInstanceOf(NotFoundException.class);
    }

    // ─── changePassword ──────────────────────────────────────────────────────

    @Test
    @DisplayName("WB-AS-07: Correct current password updates hash and clears mustChangePassword flag")
    void changePassword_correctCurrentPwd_updatesHashAndClearsFlag() {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("OldPass1!");
        req.setNewPassword("NewPass1!");

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(passwordEncoder.matches("OldPass1!", adminUser.getPasswordHash())).thenReturn(true);
        when(passwordEncoder.matches("NewPass1!", adminUser.getPasswordHash())).thenReturn(false);
        when(passwordEncoder.encode("NewPass1!")).thenReturn("$2a$10$newHash");

        MessageResponse resp = authService.changePassword("admin@example.com", req);

        assertThat(resp.getMessage()).isEqualTo("Password changed successfully");
        verify(userRepository).save(argThat(u ->
                !u.isMustChangePassword()
                && "$2a$10$newHash".equals(u.getPasswordHash())
                && u.getPasswordChangedAt() != null));
    }

    @Test
    @DisplayName("WB-AS-08: Wrong current password throws BadCredentialsException")
    void changePassword_wrongCurrentPwd_throwsBadCredentials() {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("WrongOld!");
        req.setNewPassword("NewPass1!");

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(passwordEncoder.matches("WrongOld!", adminUser.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> authService.changePassword("admin@example.com", req))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Current password is incorrect");
    }

    @Test
    @DisplayName("WB-AS-09: New password identical to current throws IllegalArgumentException")
    void changePassword_sameAsCurrentPwd_throwsIllegalArgument() {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("Same1!");
        req.setNewPassword("Same1!");

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(passwordEncoder.matches("Same1!", adminUser.getPasswordHash())).thenReturn(true);

        assertThatThrownBy(() -> authService.changePassword("admin@example.com", req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("New password must be different");
    }

    @Test
    @DisplayName("WB-AS-10: Successful change sets mustChangePassword=false and non-null passwordChangedAt")
    void changePassword_success_setsMustChangeFalseAndTimestamp() {
        mustChangeUser.setMustChangePassword(true);
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("Temp1!");
        req.setNewPassword("Secure1!");

        when(userRepository.findByEmail("newuser@example.com")).thenReturn(Optional.of(mustChangeUser));
        when(passwordEncoder.matches("Temp1!", mustChangeUser.getPasswordHash())).thenReturn(true);
        when(passwordEncoder.matches("Secure1!", mustChangeUser.getPasswordHash())).thenReturn(false);
        when(passwordEncoder.encode("Secure1!")).thenReturn("$2a$10$changedHash");

        authService.changePassword("newuser@example.com", req);

        verify(userRepository).save(argThat(u ->
                !u.isMustChangePassword() && u.getPasswordChangedAt() != null));
    }
}
