package com.merrykids.backend.controller;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.service.GallerySectionService;
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
@RequestMapping("/api/v1/admin/gallery")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminGalleryController {

    private final GallerySectionService gallerySectionService;

    // ── Config ───────────────────────────────────────────────────────────────

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<GallerySectionConfigResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(gallerySectionService.getConfig()));
    }

    @PutMapping("/config")
    public ResponseEntity<ApiResponse<GallerySectionConfigResponse>> updateConfig(
            @RequestBody @Valid GallerySectionConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success(gallerySectionService.updateConfig(request)));
    }

    // ── Photos ────────────────────────────────────────────────────────────────

    @GetMapping("/photos")
    public ResponseEntity<ApiResponse<List<GalleryPhotoResponse>>> listPhotos() {
        return ResponseEntity.ok(ApiResponse.success(gallerySectionService.listPhotos()));
    }

    @PostMapping(value = "/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<GalleryPhotoResponse>> uploadPhoto(
            @RequestPart("image") MultipartFile image) {
        GalleryPhotoResponse resp = gallerySectionService.uploadPhoto(image);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(resp));
    }

    @PostMapping(value = "/photos/batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<GalleryPhotoResponse>>> uploadPhotos(
            @RequestPart("images") List<MultipartFile> images) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(gallerySectionService.uploadPhotos(images)));
    }

    @DeleteMapping("/photos/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(@PathVariable Long id) {
        gallerySectionService.deletePhoto(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/photos/bulk-delete")
    public ResponseEntity<ApiResponse<Void>> bulkDeletePhotos(@RequestBody List<Long> ids) {
        gallerySectionService.deletePhotos(ids);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/photos/{id}/move-up")
    public ResponseEntity<ApiResponse<GalleryPhotoResponse>> moveUp(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(gallerySectionService.movePhotoUp(id)));
    }

    @PutMapping("/photos/{id}/move-down")
    public ResponseEntity<ApiResponse<GalleryPhotoResponse>> moveDown(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(gallerySectionService.movePhotoDown(id)));
    }
}
