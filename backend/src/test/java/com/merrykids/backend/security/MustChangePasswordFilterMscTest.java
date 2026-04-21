package com.merrykids.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * MSc Unit Test — MustChangePasswordFilter
 * Approved test ID: AUTH-U05
 *
 * Verifies that a user with mustChangePassword=true is blocked (HTTP 403)
 * when accessing non-auth endpoints, even when they hold a valid JWT.
 */
@ExtendWith(MockitoExtension.class)
class MustChangePasswordFilterMscTest {

    @Mock UserRepository userRepository;
    @Mock ObjectMapper objectMapper;
    @Mock HttpServletRequest request;
    @Mock HttpServletResponse response;
    @Mock FilterChain filterChain;
    @Mock ServletOutputStream outputStream;

    @InjectMocks MustChangePasswordFilter filter;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        when(response.getOutputStream()).thenReturn(outputStream);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ── AUTH-U05 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("AUTH-U05: User with mustChangePassword=true is blocked on non-auth endpoints — HTTP 403, chain not called")
    void mustChangePasswordUser_accessingProtectedEndpoint_isBlocked_with403() throws Exception {
        // Arrange: user has mustChangePassword=true (e.g. first-login temp password user)
        User forcedUser = User.builder()
                .id(1L)
                .email("newstaff@merrykids.lk")
                .passwordHash("$2a$10$temporaryHash")
                .role(Role.TEACHER)
                .active(true)
                .mustChangePassword(true)
                .build();

        // Simulate a valid JWT having been accepted — user IS authenticated in SecurityContext
        UserDetails ud = new org.springframework.security.core.userdetails.User(
                "newstaff@merrykids.lk", "pw",
                List.of(new SimpleGrantedAuthority("ROLE_TEACHER")));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities()));

        // Request is for a protected staff endpoint (not change-password or /me)
        when(request.getRequestURI()).thenReturn("/api/v1/admin/staff");
        when(userRepository.findByEmail("newstaff@merrykids.lk")).thenReturn(Optional.of(forcedUser));

        // Act
        filter.doFilterInternal(request, response, filterChain);

        // Assert: filter writes 403 and does NOT pass request further down the chain
        verify(response).setStatus(403);
        verify(filterChain, never()).doFilter(any(), any());
    }
}
