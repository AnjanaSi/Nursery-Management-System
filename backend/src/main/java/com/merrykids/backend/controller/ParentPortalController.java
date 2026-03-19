package com.merrykids.backend.controller;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.ContentType;
import com.merrykids.backend.service.ParentPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/parent")
@PreAuthorize("hasRole('PARENT')")
@RequiredArgsConstructor
public class ParentPortalController {

    private final ParentPortalService service;

    private String email(Authentication auth) {
        return auth.getName();
    }

    // ─── Children ────────────────────────────────────────────────────────────

    @GetMapping("/children")
    public ResponseEntity<ApiResponse<List<ParentChildSummaryResponse>>> getChildren(
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(service.getActiveChildren(email(auth))));
    }

    @GetMapping("/children/{studentId}/profile")
    public ResponseEntity<ApiResponse<ParentChildProfileResponse>> getChildProfile(
            @PathVariable Long studentId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(service.getChildProfile(email(auth), studentId)));
    }

    // ─── Announcements ───────────────────────────────────────────────────────

    @GetMapping("/children/{studentId}/announcements")
    public ResponseEntity<ApiResponse<Page<ParentContentListItemResponse>>> listAnnouncements(
            @PathVariable Long studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                service.listAnnouncements(email(auth), studentId, page, size)));
    }

    @GetMapping("/announcements/{contentId}")
    public ResponseEntity<ApiResponse<ParentContentDetailResponse>> getAnnouncement(
            @PathVariable Long contentId,
            @RequestParam Long studentId,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                service.getAnnouncementDetail(email(auth), contentId, studentId)));
    }

    @PostMapping("/children/{studentId}/announcements/{contentId}/view")
    public ResponseEntity<ApiResponse<MessageResponse>> markAnnouncementViewed(
            @PathVariable Long studentId,
            @PathVariable Long contentId,
            Authentication auth) {
        service.markViewed(email(auth), studentId, contentId, ContentType.ANNOUNCEMENT);
        return ResponseEntity.ok(ApiResponse.success(new MessageResponse("Marked as viewed")));
    }

    // ─── Homework ────────────────────────────────────────────────────────────

    @GetMapping("/children/{studentId}/homework")
    public ResponseEntity<ApiResponse<Page<ParentContentListItemResponse>>> listHomework(
            @PathVariable Long studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                service.listHomework(email(auth), studentId, page, size)));
    }

    @GetMapping("/homework/{contentId}")
    public ResponseEntity<ApiResponse<ParentContentDetailResponse>> getHomework(
            @PathVariable Long contentId,
            @RequestParam Long studentId,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                service.getHomeworkDetail(email(auth), contentId, studentId)));
    }

    @PostMapping("/children/{studentId}/homework/{contentId}/view")
    public ResponseEntity<ApiResponse<MessageResponse>> markHomeworkViewed(
            @PathVariable Long studentId,
            @PathVariable Long contentId,
            Authentication auth) {
        service.markViewed(email(auth), studentId, contentId, ContentType.HOMEWORK);
        return ResponseEntity.ok(ApiResponse.success(new MessageResponse("Marked as viewed")));
    }

    // ─── Attachments ─────────────────────────────────────────────────────────

    @GetMapping("/content-attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long attachmentId,
            @RequestParam Long studentId,
            Authentication auth) {
        return service.downloadAttachment(email(auth), attachmentId, studentId);
    }
}
