package com.merrykids.backend.service;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.*;
import com.merrykids.backend.exception.DuplicateEmailException;
import com.merrykids.backend.exception.NotFoundException;
import com.merrykids.backend.repository.AdminProfileRepository;
import com.merrykids.backend.repository.UserRepository;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminProfileService {

    private final AdminProfileRepository adminProfileRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    // -----------------------------------------------------------------------
    // Create
    // -----------------------------------------------------------------------

    @Transactional
    public AdminProfileResponse createAdminProfile(AdminProfileCreateRequest request) {
        validateProfileEmailUniqueness(request.getEmail(), null);

        AdminProfile profile = AdminProfile.builder()
                .fullName(request.getFullName())
                .email(request.getEmail().trim())
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .nic(request.getNic())
                .dateOfBirth(request.getDateOfBirth())
                .adminType(request.getAdminType())
                .notes(request.getNotes())
                .build();

        AdminProfile saved = adminProfileRepository.save(profile);
        log.info("Admin profile created: {} ({})", saved.getFullName(), saved.getEmail());
        return toResponse(saved);
    }

    @Transactional
    public AdminProfileResponse createAdminProfileWithAccount(AdminProfileCreateRequest request) {
        AdminProfileResponse response = createAdminProfile(request);

        AdminProfile profile = findNonDeletedProfile(response.getId());

        User user = provisionAdminUser(profile.getEmail());
        profile.setUser(user);
        adminProfileRepository.save(profile);

        log.info("Admin profile + account created for: {}", profile.getEmail());
        return toResponse(profile);
    }

    // -----------------------------------------------------------------------
    // Read
    // -----------------------------------------------------------------------

    public AdminProfileResponse getAdminProfileById(Long id) {
        return toResponse(findNonDeletedProfile(id));
    }

    public Page<AdminProfileListItemResponse> listAdminProfiles(
            String search, AdminType adminType, String accountStatus, int page, int size) {

        Pageable pageable = PageRequest.of(page, size);
        Specification<AdminProfile> spec = buildSpecification(search, adminType, accountStatus);
        return adminProfileRepository.findAll(spec, pageable).map(this::toListItem);
    }

    // -----------------------------------------------------------------------
    // Update
    // -----------------------------------------------------------------------

    @Transactional
    public AdminProfileResponse updateAdminProfile(Long id, AdminProfileUpdateRequest request,
            String currentUserEmail) {
        AdminProfile profile = findNonDeletedProfile(id);

        // Handle email change
        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(profile.getEmail())) {
            String newEmail = request.getEmail().trim();

            // Check no other non-deleted admin profile uses this email
            validateProfileEmailUniqueness(newEmail, id);

            // If profile has linked user, check active user collision and update user.email
            if (profile.getUser() != null) {
                Long userId = profile.getUser().getId();
                if (userRepository.existsByEmailIgnoreCaseAndActiveTrueAndIdNot(newEmail, userId)) {
                    throw new IllegalArgumentException(
                            "This email is already used by another active user account: " + newEmail);
                }
                profile.getUser().setEmail(newEmail);
                userRepository.save(profile.getUser());
            }
        }

        applyUpdates(profile, request);
        adminProfileRepository.save(profile);
        log.info("Admin profile updated: {} ({})", profile.getFullName(), profile.getEmail());
        return toResponse(profile);
    }

    // -----------------------------------------------------------------------
    // Account management
    // -----------------------------------------------------------------------

    @Transactional
    public AdminProfileResponse createAccountForAdmin(Long id) {
        AdminProfile profile = findNonDeletedProfile(id);

        if (profile.getUser() != null && profile.getUser().isActive()) {
            throw new IllegalArgumentException("This admin already has an active login account");
        }

        // If disabled user row linked, reactivate it; if no link, create/reactivate via UserService
        User user = provisionAdminUser(profile.getEmail());
        profile.setUser(user);
        adminProfileRepository.save(profile);

        log.info("Admin account created/reactivated for: {}", profile.getEmail());
        return toResponse(profile);
    }

    @Transactional
    public AdminProfileResponse disableAdminAccount(Long id, String currentUserEmail) {
        AdminProfile profile = findNonDeletedProfile(id);

        // Self-lockout check
        checkNotSelf(id, currentUserEmail, "disable their own login account");

        if (profile.getUser() == null || !profile.getUser().isActive()) {
            throw new IllegalArgumentException("This admin does not have an active login account");
        }

        // Last-admin safety check
        long activeAdmins = adminProfileRepository.countActiveAdminAccounts(Role.ADMIN);
        if (activeAdmins <= 1) {
            throw new IllegalArgumentException(
                    "Cannot disable the last active admin account in the system");
        }

        profile.getUser().setActive(false);
        userRepository.save(profile.getUser());
        // Keep profile.user link intact so accountStatus shows DISABLED not NO_ACCOUNT
        adminProfileRepository.save(profile);

        log.info("Admin account disabled for: {}", profile.getEmail());
        return toResponse(profile);
    }

    // -----------------------------------------------------------------------
    // Delete
    // -----------------------------------------------------------------------

    @Transactional
    public void softDeleteAdmin(Long id, String currentUserEmail) {
        AdminProfile profile = findNonDeletedProfile(id);

        // Self-lockout check
        checkNotSelf(id, currentUserEmail, "delete their own admin profile");

        // Last-admin safety check — only applies when this profile has an active admin account
        if (profile.getUser() != null && profile.getUser().isActive()
                && profile.getUser().getRole() == Role.ADMIN) {
            long activeAdmins = adminProfileRepository.countActiveAdminAccounts(Role.ADMIN);
            if (activeAdmins <= 1) {
                throw new IllegalArgumentException(
                        "Cannot delete the last active admin profile in the system");
            }
        }

        // Disable linked account if active (keep link)
        if (profile.getUser() != null && profile.getUser().isActive()) {
            profile.getUser().setActive(false);
            userRepository.save(profile.getUser());
        }

        profile.setDeleted(true);
        adminProfileRepository.save(profile);
        log.info("Admin profile soft-deleted: {} ({})", profile.getFullName(), profile.getEmail());
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private User provisionAdminUser(String email) {
        CreateUserRequest userRequest = new CreateUserRequest();
        userRequest.setEmail(email);
        userRequest.setRole(Role.ADMIN);
        CreateUserResponse userResponse = userService.createUser(userRequest);
        return userRepository.findById(userResponse.getId())
                .orElseThrow(() -> new NotFoundException("User not found after provisioning"));
    }

    private void checkNotSelf(Long targetId, String currentUserEmail, String action) {
        userRepository.findByEmailIgnoreCase(currentUserEmail).ifPresent(currentUser -> {
            adminProfileRepository.findByUserId(currentUser.getId()).ifPresent(selfProfile -> {
                if (selfProfile.getId().equals(targetId)) {
                    throw new IllegalArgumentException(
                            "An admin cannot " + action);
                }
            });
        });
    }

    private void validateProfileEmailUniqueness(String email, Long excludeId) {
        boolean exists = excludeId == null
                ? adminProfileRepository.existsByEmailIgnoreCaseAndIsDeletedFalse(email)
                : adminProfileRepository.existsByEmailIgnoreCaseAndIsDeletedFalseAndIdNot(email, excludeId);

        if (exists) {
            throw new DuplicateEmailException(
                    "An admin profile with email '" + email + "' already exists");
        }
    }

    private AdminProfile findNonDeletedProfile(Long id) {
        return adminProfileRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Admin profile not found"));
    }

    private void applyUpdates(AdminProfile profile, AdminProfileUpdateRequest request) {
        if (request.getFullName() != null)
            profile.setFullName(request.getFullName());
        if (request.getEmail() != null)
            profile.setEmail(request.getEmail().trim());
        if (request.getPhoneNumber() != null)
            profile.setPhoneNumber(request.getPhoneNumber());
        if (request.getAddress() != null)
            profile.setAddress(request.getAddress());
        if (request.getNic() != null)
            profile.setNic(request.getNic());
        if (request.getDateOfBirth() != null)
            profile.setDateOfBirth(request.getDateOfBirth());
        if (request.getAdminType() != null)
            profile.setAdminType(request.getAdminType());
        if (request.getNotes() != null)
            profile.setNotes(request.getNotes());
    }

    private Specification<AdminProfile> buildSpecification(String search, AdminType adminType,
            String accountStatus) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("isDeleted"), false));

            if (adminType != null) {
                predicates.add(cb.equal(root.get("adminType"), adminType));
            }

            if (accountStatus != null && !accountStatus.isBlank()) {
                switch (accountStatus.toUpperCase()) {
                    case "NO_ACCOUNT" ->
                        predicates.add(cb.isNull(root.get("user")));
                    case "ACTIVE" -> {
                        predicates.add(cb.isNotNull(root.get("user")));
                        predicates.add(cb.equal(root.get("user").get("active"), true));
                    }
                    case "DISABLED" -> {
                        predicates.add(cb.isNotNull(root.get("user")));
                        predicates.add(cb.equal(root.get("user").get("active"), false));
                    }
                }
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("phoneNumber")), pattern)));
            }

            if (!Long.class.equals(query.getResultType()) && !long.class.equals(query.getResultType())) {
                // Active accounts first, then newest first
                Expression<Integer> activeRank = cb.<Integer>selectCase()
                        .when(cb.and(
                                cb.isNotNull(root.get("user")),
                                cb.equal(root.get("user").get("active"), true)),
                                1)
                        .otherwise(0);
                query.orderBy(
                        cb.desc(activeRank),
                        cb.desc(root.get("createdAt")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private String deriveAccountStatus(AdminProfile profile) {
        if (profile.getUser() == null) return "NO_ACCOUNT";
        return profile.getUser().isActive() ? "ACTIVE" : "DISABLED";
    }

    private AdminProfileResponse toResponse(AdminProfile profile) {
        return AdminProfileResponse.builder()
                .id(profile.getId())
                .fullName(profile.getFullName())
                .email(profile.getEmail())
                .phoneNumber(profile.getPhoneNumber())
                .address(profile.getAddress())
                .nic(profile.getNic())
                .dateOfBirth(profile.getDateOfBirth())
                .adminType(profile.getAdminType() != null ? profile.getAdminType().name() : null)
                .notes(profile.getNotes())
                .accountStatus(deriveAccountStatus(profile))
                .accountEmail(profile.getUser() != null ? profile.getUser().getEmail() : null)
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    private AdminProfileListItemResponse toListItem(AdminProfile profile) {
        return AdminProfileListItemResponse.builder()
                .id(profile.getId())
                .fullName(profile.getFullName())
                .email(profile.getEmail())
                .phoneNumber(profile.getPhoneNumber())
                .adminType(profile.getAdminType() != null ? profile.getAdminType().name() : null)
                .accountStatus(deriveAccountStatus(profile))
                .createdAt(profile.getCreatedAt())
                .build();
    }
}
