package com.merrykids.backend.controller;

import com.merrykids.backend.dto.ApiResponse;
import com.merrykids.backend.dto.PublicProgramResponse;
import com.merrykids.backend.service.ProgramSectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/programs")
@RequiredArgsConstructor
public class PublicProgramController {

    private final ProgramSectionService programSectionService;

    @GetMapping
    public ResponseEntity<ApiResponse<PublicProgramResponse>> getPrograms() {
        return ResponseEntity.ok(ApiResponse.success(programSectionService.getPublicPrograms()));
    }

    @GetMapping("/cards/{id}/image")
    public ResponseEntity<Resource> serveCardImage(@PathVariable Long id) {
        ProgramSectionService.ImageResource ir = programSectionService.getCardImageResource(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(ir.contentType()))
                .body(ir.resource());
    }
}
