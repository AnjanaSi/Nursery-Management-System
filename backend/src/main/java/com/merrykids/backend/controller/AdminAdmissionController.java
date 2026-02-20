package com.merrykids.backend.controller;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.ApplyingLevel;
import com.merrykids.backend.entity.SubmissionStatus;
import com.merrykids.backend.service.AdmissionAnnouncementService;
import com.merrykids.backend.service.AdmissionSubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/admin/admissions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAdmissionController {

    private final AdmissionAnnouncementService announcementService;
    private final AdmissionSubmissionService submissionService;

    @GetMapping("/announcement")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> getAnnouncement() {
        AnnouncementResponse response = announcementService.getPublicAnnouncement();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping(value = "/announcement", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AnnouncementResponse>> createOrUpdateAnnouncement(
            @RequestParam("message") String message,
            @RequestParam("openDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate openDate,
            @RequestParam("closeDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate closeDate,
            @RequestParam(value = "applicationPdf", required = false) MultipartFile applicationPdf) {

        AnnouncementResponse response = announcementService.createOrUpdateAnnouncement(
                message, openDate, closeDate, applicationPdf);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/submissions")
    public ResponseEntity<ApiResponse<Page<SubmissionResponse>>> getSubmissions(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) SubmissionStatus status,
            @RequestParam(required = false) ApplyingLevel level,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<SubmissionResponse> submissions = submissionService.getSubmissions(
                search, status, level, page, size);
        return ResponseEntity.ok(ApiResponse.success(submissions));
    }

    @GetMapping("/submissions/{id}")
    public ResponseEntity<ApiResponse<SubmissionDetailResponse>> getSubmission(
            @PathVariable Long id) {
        SubmissionDetailResponse response = submissionService.getSubmissionById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/submissions/{id}/status")
    public ResponseEntity<ApiResponse<SubmissionDetailResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {
        SubmissionDetailResponse response = submissionService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/submissions/{id}/note")
    public ResponseEntity<ApiResponse<SubmissionDetailResponse>> updateNote(
            @PathVariable Long id,
            @Valid @RequestBody UpdateNoteRequest request) {
        SubmissionDetailResponse response = submissionService.updateNote(id, request.getAdminNote());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/submissions/{id}/pdf")
    public ResponseEntity<Resource> downloadSubmissionPdf(@PathVariable Long id) {
        Resource resource = submissionService.getSubmissionPdf(id);
        String filename = submissionService.getSubmissionPdfOriginalName(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }
}
