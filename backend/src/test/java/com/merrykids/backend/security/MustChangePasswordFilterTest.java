package com.merrykids.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * White Box unit tests for MustChangePasswordFilter.
 * Verifies that authenticated users with mustChangePassword=true are blocked
 * on protected paths but allowed through on the permitted paths.
 */
@ExtendWith(MockitoExtension.class)
class MustChangePasswordFilterTest {

    @Mock UserRepository userRepository;
    @Mock ObjectMapper objectMapper;
    @Mock HttpServletRequest request;
    @Mock HttpServletResponse response;
    @Mock FilterChain filterChain;
    @Mock ServletOutputStream outputStream;

    @InjectMocks MustChangePasswordFilter filter;

    private User mustChangeUser;
    private User normalUser;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();

        mustChangeUser = User.builder()
                .id(1L).email("new@example.com")
                .passwordHash("$2a$10$h").role(Role.TEACHER)
                .active(true).mustChangePassword(true).build();

        normalUser = User.builder()
                .id(2L).email("admin@example.com")
                .passwordHash("$2a$10$h").role(Role.ADMIN)
                .active(true).mustChangePassword(false).build();

        lenient().when(response.getOutputStream()).thenReturn(outputStream);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(String email, String role) {
        UserDetails ud = new org.springframework.security.core.userdetails.User(
                email, "pw", List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities()));
    }

    // ─── mustChangePassword=true cases ──────────────────────────────────────

    @Test
    @DisplayName("WB-MCPF-01: mustChangePassword=true blocked on protected endpoint → 403 written, chain not called")
    void doFilter_mustChangeTrue_protectedPath_returns403() throws Exception {
        authenticateAs("new@example.com", "TEACHER");
        when(request.getRequestURI()).thenReturn("/api/v1/teacher/announcements");
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.of(mustChangeUser));

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(403);
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("WB-MCPF-02: mustChangePassword=true allowed through on /api/v1/auth/change-password")
    void doFilter_mustChangeTrue_changePasswordPath_chainCalled() throws Exception {
        authenticateAs("new@example.com", "TEACHER");
        when(request.getRequestURI()).thenReturn("/api/v1/auth/change-password");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(403);
    }

    @Test
    @DisplayName("WB-MCPF-03: mustChangePassword=true allowed through on /api/v1/auth/me")
    void doFilter_mustChangeTrue_mePath_chainCalled() throws Exception {
        authenticateAs("new@example.com", "TEACHER");
        when(request.getRequestURI()).thenReturn("/api/v1/auth/me");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(403);
    }

    // ─── mustChangePassword=false cases ─────────────────────────────────────

    @Test
    @DisplayName("WB-MCPF-04: mustChangePassword=false passes through any endpoint without blocking")
    void doFilter_mustChangeFalse_anyPath_chainCalled() throws Exception {
        authenticateAs("admin@example.com", "ADMIN");
        when(request.getRequestURI()).thenReturn("/api/v1/admin/admins");
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(normalUser));

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(403);
    }

    // ─── unauthenticated case ────────────────────────────────────────────────

    @Test
    @DisplayName("WB-MCPF-05: No SecurityContext authentication → filter passes through (not authenticated users)")
    void doFilter_noAuthentication_chainCalled() throws Exception {
        // SecurityContext left empty by setUp — no authentication, no URI check needed

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(403);
    }
}
