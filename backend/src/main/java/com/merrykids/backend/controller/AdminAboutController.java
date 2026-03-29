package com.merrykids.backend.controller;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.service.AboutSectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/about")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAboutController {

    private final AboutSectionService aboutSectionService;

    // ── Config ───────────────────────────────────────────────────────────────

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<AboutSectionConfigResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(aboutSectionService.getConfig()));
    }

    @PutMapping("/config")
    public ResponseEntity<ApiResponse<AboutSectionConfigResponse>> updateConfig(
            @RequestBody @Valid AboutSectionConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success(aboutSectionService.updateConfig(request)));
    }

    // ── Cards ─────────────────────────────────────────────────────────────────

    @GetMapping("/cards")
    public ResponseEntity<ApiResponse<List<AboutCardResponse>>> listCards() {
        return ResponseEntity.ok(ApiResponse.success(aboutSectionService.listCards()));
    }

    @PostMapping(value = "/cards", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AboutCardResponse>> createCard(
            @RequestPart("data") @Valid AboutCardRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        AboutCardResponse resp = aboutSectionService.createCard(request, image);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(resp));
    }

    @GetMapping("/cards/{id}")
    public ResponseEntity<ApiResponse<AboutCardResponse>> getCard(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(aboutSectionService.getCard(id)));
    }

    @PutMapping(value = "/cards/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AboutCardResponse>> updateCard(
            @PathVariable Long id,
            @RequestPart("data") @Valid AboutCardRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.ok(ApiResponse.success(aboutSectionService.updateCard(id, request, image)));
    }

    @DeleteMapping("/cards/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCard(@PathVariable Long id) {
        aboutSectionService.deleteCard(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/cards/{id}/move-up")
    public ResponseEntity<ApiResponse<AboutCardResponse>> moveUp(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(aboutSectionService.moveCardUp(id)));
    }

    @PutMapping("/cards/{id}/move-down")
    public ResponseEntity<ApiResponse<AboutCardResponse>> moveDown(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(aboutSectionService.moveCardDown(id)));
    }
}
