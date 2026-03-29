package com.merrykids.backend.controller;

import com.merrykids.backend.dto.ApiResponse;
import com.merrykids.backend.dto.PublicAboutResponse;
import com.merrykids.backend.service.AboutSectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/about")
@RequiredArgsConstructor
public class PublicAboutController {

    private final AboutSectionService aboutSectionService;

    @GetMapping
    public ResponseEntity<ApiResponse<PublicAboutResponse>> getAboutSection() {
        return ResponseEntity.ok(ApiResponse.success(aboutSectionService.getPublicAbout()));
    }

    @GetMapping("/cards/{id}/image")
    public ResponseEntity<Resource> serveCardImage(@PathVariable Long id) {
        AboutSectionService.ImageResource ir = aboutSectionService.getCardImageResource(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(ir.contentType()))
                .body(ir.resource());
    }
}
