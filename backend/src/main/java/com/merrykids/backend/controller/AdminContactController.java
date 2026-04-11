package com.merrykids.backend.controller;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.service.ContactSectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/contact")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminContactController {

    private final ContactSectionService contactSectionService;

    // ── Config ───────────────────────────────────────────────────────────────

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<ContactSectionConfigResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(contactSectionService.getConfig()));
    }

    @PutMapping("/config")
    public ResponseEntity<ApiResponse<ContactSectionConfigResponse>> updateConfig(
            @RequestBody @Valid ContactSectionConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success(contactSectionService.updateConfig(request)));
    }

    // ── Items ─────────────────────────────────────────────────────────────────

    @GetMapping("/items")
    public ResponseEntity<ApiResponse<List<ContactItemResponse>>> listItems() {
        return ResponseEntity.ok(ApiResponse.success(contactSectionService.listItems()));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<ApiResponse<ContactItemResponse>> updateItem(
            @PathVariable Long id,
            @RequestBody @Valid ContactItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success(contactSectionService.updateItem(id, request)));
    }
}
