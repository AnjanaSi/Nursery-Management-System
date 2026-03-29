package com.merrykids.backend.controller;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.service.ProgramSectionService;
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
@RequestMapping("/api/v1/admin/programs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProgramController {

    private final ProgramSectionService programSectionService;

    // ── Config ───────────────────────────────────────────────────────────────

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<ProgramSectionConfigResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(programSectionService.getConfig()));
    }

    @PutMapping("/config")
    public ResponseEntity<ApiResponse<ProgramSectionConfigResponse>> updateConfig(
            @RequestBody @Valid ProgramSectionConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success(programSectionService.updateConfig(request)));
    }

    // ── Cards ─────────────────────────────────────────────────────────────────

    @GetMapping("/cards")
    public ResponseEntity<ApiResponse<List<ProgramCardResponse>>> listCards() {
        return ResponseEntity.ok(ApiResponse.success(programSectionService.listCards()));
    }

    @PostMapping(value = "/cards", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ProgramCardResponse>> createCard(
            @RequestPart("data") @Valid ProgramCardRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        ProgramCardResponse resp = programSectionService.createCard(request, image);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(resp));
    }

    @GetMapping("/cards/{id}")
    public ResponseEntity<ApiResponse<ProgramCardResponse>> getCard(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(programSectionService.getCard(id)));
    }

    @PutMapping(value = "/cards/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ProgramCardResponse>> updateCard(
            @PathVariable Long id,
            @RequestPart("data") @Valid ProgramCardRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.ok(ApiResponse.success(programSectionService.updateCard(id, request, image)));
    }

    @DeleteMapping("/cards/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCard(@PathVariable Long id) {
        programSectionService.deleteCard(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/cards/{id}/move-up")
    public ResponseEntity<ApiResponse<ProgramCardResponse>> moveUp(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(programSectionService.moveCardUp(id)));
    }

    @PutMapping("/cards/{id}/move-down")
    public ResponseEntity<ApiResponse<ProgramCardResponse>> moveDown(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(programSectionService.moveCardDown(id)));
    }
}
