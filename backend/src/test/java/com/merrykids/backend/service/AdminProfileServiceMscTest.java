package com.merrykids.backend.service;

import com.merrykids.backend.entity.AdminProfile;
import com.merrykids.backend.entity.AdminType;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.AdminProfileRepository;
import com.merrykids.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * MSc Unit Tests — AdminProfileService
 * Approved test IDs: ADMG-U01, ADMG-U02
 */
@ExtendWith(MockitoExtension.class)
class AdminProfileServiceMscTest {

    @Mock AdminProfileRepository adminProfileRepository;
    @Mock UserRepository userRepository;
    @Mock UserService userService;

    @InjectMocks AdminProfileService adminProfileService;

    private User adminUser;
    private AdminProfile adminProfile;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L)
                .email("admin@merrykids.lk")
                .role(Role.ADMIN)
                .active(true)
                .mustChangePassword(false)
                .build();

        adminProfile = AdminProfile.builder()
                .id(10L)
                .fullName("Main Admin")
                .email("admin@merrykids.lk")
                .adminType(AdminType.OWNER)
                .user(adminUser)
                .isDeleted(false)
                .build();
    }

    // ── ADMG-U01 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("ADMG-U01: Admin cannot disable their own account — self-lockout throws IllegalArgumentException")
    void disableAdminAccount_selfLockout_throwsIllegalArgument() {
        when(adminProfileRepository.findByIdAndIsDeletedFalse(10L))
                .thenReturn(Optional.of(adminProfile));

        // checkNotSelf: resolves currentUserEmail → User → AdminProfile, compares id
        when(userRepository.findByEmailIgnoreCase("admin@merrykids.lk"))
                .thenReturn(Optional.of(adminUser));
        when(adminProfileRepository.findByUserId(1L))
                .thenReturn(Optional.of(adminProfile));

        // currentUserEmail matches the target profile's own email
        assertThatThrownBy(() -> adminProfileService.disableAdminAccount(10L, "admin@merrykids.lk"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot");
    }

    // ── ADMG-U02 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("ADMG-U02: Cannot disable the last active admin account — last-admin protection throws IllegalArgumentException")
    void disableAdminAccount_lastAdmin_throwsIllegalArgument() {
        // A second admin profile used as the "current user" (not self)
        User secondAdminUser = User.builder()
                .id(2L)
                .email("owner@merrykids.lk")
                .role(Role.ADMIN)
                .active(true)
                .build();
        AdminProfile secondProfile = AdminProfile.builder()
                .id(99L)
                .email("owner@merrykids.lk")
                .user(secondAdminUser)
                .isDeleted(false)
                .build();

        when(adminProfileRepository.findByIdAndIsDeletedFalse(10L))
                .thenReturn(Optional.of(adminProfile));

        // checkNotSelf: current user is a different admin (owner@merrykids.lk)
        when(userRepository.findByEmailIgnoreCase("owner@merrykids.lk"))
                .thenReturn(Optional.of(secondAdminUser));
        when(adminProfileRepository.findByUserId(2L))
                .thenReturn(Optional.of(secondProfile));

        // Only 1 active admin account remains — disabling would leave zero
        when(adminProfileRepository.countActiveAdminAccounts(Role.ADMIN)).thenReturn(1L);

        assertThatThrownBy(() -> adminProfileService.disableAdminAccount(10L, "owner@merrykids.lk"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("last active admin");
    }
}
