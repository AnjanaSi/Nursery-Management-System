package com.merrykids.backend.controller;

import com.merrykids.backend.dto.ApiResponse;
import com.merrykids.backend.dto.PublicContactResponse;
import com.merrykids.backend.service.ContactSectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/contact")
@RequiredArgsConstructor
public class PublicContactController {

    private final ContactSectionService contactSectionService;

    @GetMapping
    public ResponseEntity<ApiResponse<PublicContactResponse>> getContactSection() {
        return ResponseEntity.ok(ApiResponse.success(contactSectionService.getPublicContact()));
    }
}
