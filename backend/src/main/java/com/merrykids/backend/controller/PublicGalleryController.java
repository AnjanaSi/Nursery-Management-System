package com.merrykids.backend.controller;

import com.merrykids.backend.dto.ApiResponse;
import com.merrykids.backend.dto.PublicGalleryResponse;
import com.merrykids.backend.service.GallerySectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/gallery")
@RequiredArgsConstructor
public class PublicGalleryController {

    private final GallerySectionService gallerySectionService;

    @GetMapping
    public ResponseEntity<ApiResponse<PublicGalleryResponse>> getGallery() {
        return ResponseEntity.ok(ApiResponse.success(gallerySectionService.getPublicGallery()));
    }

    @GetMapping("/photos/{id}/image")
    public ResponseEntity<Resource> servePhotoImage(@PathVariable Long id) {
        GallerySectionService.ImageResource ir = gallerySectionService.getPhotoImageResource(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(ir.contentType()))
                .body(ir.resource());
    }
}
