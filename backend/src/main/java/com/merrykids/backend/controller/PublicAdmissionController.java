package com.merrykids.backend.controller;

import com.merrykids.backend.dto.AnnouncementResponse;
import com.merrykids.backend.dto.ApiResponse;
import com.merrykids.backend.dto.SubmissionConfirmationResponse;
import com.merrykids.backend.entity.ApplyingLevel;
import com.merrykids.backend.service.AdmissionAnnouncementService;
import com.merrykids.backend.service.AdmissionSubmissionService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/public/admissions")
@RequiredArgsConstructor
public class PublicAdmissionController {

    private final AdmissionAnnouncementService announcementService;
    private final AdmissionSubmissionService submissionService;

    @GetMapping("/announcement")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> getAnnouncement() {
        AnnouncementResponse response = announcementService.getPublicAnnouncement();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/announcement/pdf")
    public ResponseEntity<Resource> downloadAnnouncementPdf() {
        Resource resource = announcementService.getAnnouncementPdf();
        String filename = announcementService.getAnnouncementPdfOriginalName();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }

    @PostMapping(value = "/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<SubmissionConfirmationResponse>> submitApplication(
            @RequestParam("childFullName") @NotBlank String childFullName,
            @RequestParam("dateOfBirth") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateOfBirth,
            @RequestParam("levelApplyingFor") ApplyingLevel levelApplyingFor,
            @RequestParam("guardianFullName") @NotBlank String guardianFullName,
            @RequestParam("email") @Email @NotBlank String email,
            @RequestParam("phone") @NotBlank String phone,
            @RequestParam("address") @NotBlank String address,
            @RequestParam("filledApplicationPdf") MultipartFile filledApplicationPdf) {

        SubmissionConfirmationResponse response = submissionService.submitApplication(
                childFullName, dateOfBirth, levelApplyingFor,
                guardianFullName, email, phone, address, filledApplicationPdf);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }
}
