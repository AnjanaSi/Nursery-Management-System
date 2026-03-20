package com.merrykids.backend.controller;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.AdminType;
import com.merrykids.backend.service.AdminProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/admins")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminManagementController {

    private final AdminProfileService adminProfileService;

    @PostMapping
    public ResponseEntity<ApiResponse<AdminProfileResponse>> createAdminProfile(
            @RequestBody @Valid AdminProfileCreateRequest request) {
        AdminProfileResponse response = adminProfileService.createAdminProfile(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PostMapping("/with-account")
    public ResponseEntity<ApiResponse<AdminProfileResponse>> createAdminProfileWithAccount(
            @RequestBody @Valid AdminProfileCreateRequest request) {
        AdminProfileResponse response = adminProfileService.createAdminProfileWithAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminProfileListItemResponse>>> listAdminProfiles(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AdminType adminType,
            @RequestParam(required = false) String accountStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<AdminProfileListItemResponse> result = adminProfileService.listAdminProfiles(
                search, adminType, accountStatus, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminProfileResponse>> getAdminProfile(
            @PathVariable Long id) {
        AdminProfileResponse response = adminProfileService.getAdminProfileById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminProfileResponse>> updateAdminProfile(
            @PathVariable Long id,
            @RequestBody @Valid AdminProfileUpdateRequest request,
            Authentication authentication) {
        String currentUserEmail = authentication.getName();
        AdminProfileResponse response = adminProfileService.updateAdminProfile(id, request, currentUserEmail);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAdminProfile(
            @PathVariable Long id,
            Authentication authentication) {
        String currentUserEmail = authentication.getName();
        adminProfileService.softDeleteAdmin(id, currentUserEmail);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/account")
    public ResponseEntity<ApiResponse<AdminProfileResponse>> createAccount(
            @PathVariable Long id) {
        AdminProfileResponse response = adminProfileService.createAccountForAdmin(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}/account")
    public ResponseEntity<ApiResponse<AdminProfileResponse>> disableAccount(
            @PathVariable Long id,
            Authentication authentication) {
        String currentUserEmail = authentication.getName();
        AdminProfileResponse response = adminProfileService.disableAdminAccount(id, currentUserEmail);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
