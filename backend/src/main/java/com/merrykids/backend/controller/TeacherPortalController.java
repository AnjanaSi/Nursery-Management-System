package com.merrykids.backend.controller;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.ContentType;
import com.merrykids.backend.service.TeacherPortalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teacher")
@PreAuthorize("hasRole('TEACHER')")
@RequiredArgsConstructor
public class TeacherPortalController {

    private final TeacherPortalService service;

    private String email(Authentication auth) {
        return auth.getName();
    }

    // ─── Profile ────────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<TeacherProfileResponse>> getProfile(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(service.getProfile(email(auth))));
    }

    // ─── Announcements ───────────────────────────────────────────────────────

    @GetMapping("/announcements")
    public ResponseEntity<ApiResponse<Page<PortalContentSummaryResponse>>> listAnnouncements(
            @RequestParam(defaultValue = "false") boolean archived,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                service.listContent(email(auth), ContentType.ANNOUNCEMENT, archived, page, size)));
    }

    @PostMapping(value = "/announcements", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<PortalContentDetailResponse>> createAnnouncement(
            @RequestPart("data") @Valid CreatePortalContentRequest req,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments,
            Authentication auth) {
        PortalContentDetailResponse created =
                service.createContent(email(auth), ContentType.ANNOUNCEMENT, req, attachments);
        return ResponseEntity.status(201).body(ApiResponse.success(created));
    }

    @GetMapping("/announcements/{id}")
    public ResponseEntity<ApiResponse<PortalContentDetailResponse>> getAnnouncement(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                service.getContentById(email(auth), ContentType.ANNOUNCEMENT, id)));
    }

    @PutMapping(value = "/announcements/{id}", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<PortalContentDetailResponse>> updateAnnouncement(
            @PathVariable Long id,
            @RequestPart("data") @Valid UpdatePortalContentRequest req,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                service.updateContent(email(auth), ContentType.ANNOUNCEMENT, id, req, attachments)));
    }

    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<ApiResponse<MessageResponse>> deleteAnnouncement(
            @PathVariable Long id, Authentication auth) {
        service.deleteContent(email(auth), ContentType.ANNOUNCEMENT, id);
        return ResponseEntity.ok(ApiResponse.success(new MessageResponse("Announcement deleted")));
    }

    @PostMapping("/announcements/archive-year")
    public ResponseEntity<ApiResponse<MessageResponse>> archiveAnnouncementYear(
            @RequestBody @Valid ArchiveYearRequest req, Authentication auth) {
        service.archiveByYear(email(auth), ContentType.ANNOUNCEMENT, req.getAcademicYear());
        return ResponseEntity.ok(ApiResponse.success(
                new MessageResponse("Announcements archived for " + req.getAcademicYear())));
    }

    // ─── Homework ────────────────────────────────────────────────────────────

    @GetMapping("/homework")
    public ResponseEntity<ApiResponse<Page<PortalContentSummaryResponse>>> listHomework(
            @RequestParam(defaultValue = "false") boolean archived,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                service.listContent(email(auth), ContentType.HOMEWORK, archived, page, size)));
    }

    @PostMapping(value = "/homework", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<PortalContentDetailResponse>> createHomework(
            @RequestPart("data") @Valid CreatePortalContentRequest req,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments,
            Authentication auth) {
        PortalContentDetailResponse created =
                service.createContent(email(auth), ContentType.HOMEWORK, req, attachments);
        return ResponseEntity.status(201).body(ApiResponse.success(created));
    }

    @GetMapping("/homework/{id}")
    public ResponseEntity<ApiResponse<PortalContentDetailResponse>> getHomework(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                service.getContentById(email(auth), ContentType.HOMEWORK, id)));
    }

    @PutMapping(value = "/homework/{id}", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<PortalContentDetailResponse>> updateHomework(
            @PathVariable Long id,
            @RequestPart("data") @Valid UpdatePortalContentRequest req,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                service.updateContent(email(auth), ContentType.HOMEWORK, id, req, attachments)));
    }

    @DeleteMapping("/homework/{id}")
    public ResponseEntity<ApiResponse<MessageResponse>> deleteHomework(
            @PathVariable Long id, Authentication auth) {
        service.deleteContent(email(auth), ContentType.HOMEWORK, id);
        return ResponseEntity.ok(ApiResponse.success(new MessageResponse("Homework deleted")));
    }

    @PostMapping("/homework/archive-year")
    public ResponseEntity<ApiResponse<MessageResponse>> archiveHomeworkYear(
            @RequestBody @Valid ArchiveYearRequest req, Authentication auth) {
        service.archiveByYear(email(auth), ContentType.HOMEWORK, req.getAcademicYear());
        return ResponseEntity.ok(ApiResponse.success(
                new MessageResponse("Homework archived for " + req.getAcademicYear())));
    }

    // ─── Attachment download ─────────────────────────────────────────────────

    @GetMapping("/content-attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long attachmentId, Authentication auth) {
        return service.downloadAttachment(email(auth), attachmentId);
    }
}
