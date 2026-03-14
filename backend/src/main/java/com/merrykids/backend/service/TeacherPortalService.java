package com.merrykids.backend.service;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.*;
import com.merrykids.backend.exception.NotFoundException;
import com.merrykids.backend.repository.PortalContentAttachmentRepository;
import com.merrykids.backend.repository.PortalContentRepository;
import com.merrykids.backend.repository.TeacherRepository;
import com.merrykids.backend.util.AcademicYearUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherPortalService {

    private final TeacherRepository teacherRepository;
    private final PortalContentRepository contentRepository;
    private final PortalContentAttachmentRepository attachmentRepository;
    private final FileStorageService fileStorageService;

    private static final String ATTACHMENT_DIR = "teacher-content/attachments";

    // ─── Profile ────────────────────────────────────────────────────────────

    public TeacherProfileResponse getProfile(String email) {
        Teacher teacher = getTeacherByEmail(email);
        return TeacherProfileResponse.builder()
                .id(teacher.getId())
                .fullName(teacher.getFullName())
                .email(teacher.getEmail())
                .employmentId(teacher.getEmploymentId())
                .designation(teacher.getDesignation())
                .levelAssigned(teacher.getLevelAssigned())
                .employmentStatus(teacher.getEmploymentStatus())
                .build();
    }

    // ─── List ────────────────────────────────────────────────────────────────

    public Page<PortalContentSummaryResponse> listContent(
            String email, ContentType type, boolean archived, int page, int size) {
        Teacher teacher = getTeacherByEmail(email);

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("pinned"), Sort.Order.desc("createdAt")));

        return contentRepository
                .findByTargetLevelAndTypeAndArchived(teacher.getLevelAssigned(), type, archived, pageable)
                .map(this::toSummary);
    }

    // ─── Create ──────────────────────────────────────────────────────────────

    @Transactional
    public PortalContentDetailResponse createContent(
            String email, ContentType type,
            CreatePortalContentRequest req,
            List<MultipartFile> attachmentFiles) {

        Teacher teacher = getTeacherByEmail(email);

        PortalContent content = PortalContent.builder()
                .type(type)
                .title(req.getTitle())
                .body(req.getBody())
                .targetLevel(teacher.getLevelAssigned())
                .academicYear(AcademicYearUtil.getCurrent())
                .createdByTeacher(teacher)
                .pinned(req.isPinned())
                .urgent(req.isUrgent())
                .dueDate(req.getDueDate())
                .category(req.getCategory())
                .build();

        content = contentRepository.save(content);

        // Store attachments
        if (attachmentFiles != null) {
            for (MultipartFile file : attachmentFiles) {
                if (file != null && !file.isEmpty()) {
                    FileStorageService.StoredFile stored =
                            fileStorageService.storeContentAttachment(file, ATTACHMENT_DIR);
                    PortalContentAttachment att = PortalContentAttachment.builder()
                            .content(content)
                            .originalFileName(stored.originalName())
                            .storedName(stored.storedName())
                            .storedPath(stored.path())
                            .contentType(file.getContentType())
                            .sizeBytes(file.getSize())
                            .build();
                    content.getAttachments().add(att);
                }
            }
            content = contentRepository.save(content);
        }

        return toDetail(content);
    }

    // ─── Get by ID ───────────────────────────────────────────────────────────

    public PortalContentDetailResponse getContentById(String email, ContentType type, Long id) {
        Teacher teacher = getTeacherByEmail(email);
        PortalContent content = findAndVerify(id, type, teacher.getLevelAssigned());
        return toDetail(content);
    }

    // ─── Update ──────────────────────────────────────────────────────────────

    @Transactional
    public PortalContentDetailResponse updateContent(
            String email, ContentType type, Long id,
            UpdatePortalContentRequest req,
            List<MultipartFile> newAttachmentFiles) {

        Teacher teacher = getTeacherByEmail(email);
        PortalContent content = findAndVerify(id, type, teacher.getLevelAssigned());

        boolean archiveChanging = req.getArchived() != null && req.getArchived() != content.isArchived();
        boolean unarchiving = archiveChanging && Boolean.FALSE.equals(req.getArchived());
        boolean contentChanged = !content.getTitle().equals(req.getTitle())
                || !content.getBody().equals(req.getBody())
                || content.isPinned() != req.isPinned()
                || content.isUrgent() != req.isUrgent()
                || (req.getDueDate() != null && !req.getDueDate().equals(content.getDueDate()))
                || (req.getDueDate() == null && content.getDueDate() != null)
                || (req.getCategory() != null && !req.getCategory().equals(content.getCategory()))
                || (req.getCategory() == null && content.getCategory() != null)
                || (newAttachmentFiles != null && newAttachmentFiles.stream().anyMatch(f -> f != null && !f.isEmpty()));

        // Update content fields
        content.setTitle(req.getTitle());
        content.setBody(req.getBody());
        content.setPinned(req.isPinned());
        content.setUrgent(req.isUrgent());
        content.setDueDate(req.getDueDate());
        content.setCategory(req.getCategory());
        content.setLastEditedByTeacher(teacher);

        // Handle archive state change
        if (archiveChanging) {
            content.setArchived(req.getArchived());
        }

        // Update updatedAt: only when content changes or unarchiving; NOT when only archiving
        if (contentChanged || unarchiving) {
            content.setUpdatedAt(LocalDateTime.now());
        }

        // Handle attachment removals
        if (req.getKeepAttachmentIds() != null) {
            Set<Long> keepIds = Set.copyOf(req.getKeepAttachmentIds());
            List<PortalContentAttachment> toRemove = content.getAttachments().stream()
                    .filter(a -> !keepIds.contains(a.getId()))
                    .collect(Collectors.toList());
            for (PortalContentAttachment att : toRemove) {
                fileStorageService.deleteFile(att.getStoredPath());
            }
            content.getAttachments().removeAll(toRemove);
        }

        // Add new attachments
        if (newAttachmentFiles != null) {
            for (MultipartFile file : newAttachmentFiles) {
                if (file != null && !file.isEmpty()) {
                    FileStorageService.StoredFile stored =
                            fileStorageService.storeContentAttachment(file, ATTACHMENT_DIR);
                    PortalContentAttachment att = PortalContentAttachment.builder()
                            .content(content)
                            .originalFileName(stored.originalName())
                            .storedName(stored.storedName())
                            .storedPath(stored.path())
                            .contentType(file.getContentType())
                            .sizeBytes(file.getSize())
                            .build();
                    content.getAttachments().add(att);
                }
            }
        }

        content = contentRepository.save(content);
        return toDetail(content);
    }

    // ─── Delete ──────────────────────────────────────────────────────────────

    @Transactional
    public void deleteContent(String email, ContentType type, Long id) {
        Teacher teacher = getTeacherByEmail(email);
        PortalContent content = findAndVerify(id, type, teacher.getLevelAssigned());

        // Delete physical files
        for (PortalContentAttachment att : content.getAttachments()) {
            fileStorageService.deleteFile(att.getStoredPath());
        }

        contentRepository.delete(content);
    }

    // ─── Archive by year ─────────────────────────────────────────────────────

    @Transactional
    public void archiveByYear(String email, ContentType type, String academicYear) {
        Teacher teacher = getTeacherByEmail(email);

        List<PortalContent> toArchive = contentRepository
                .findByTargetLevelAndTypeAndAcademicYearAndArchived(
                        teacher.getLevelAssigned(), type, academicYear, false);

        for (PortalContent c : toArchive) {
            c.setArchived(true);
            // Do NOT update updatedAt — archiving should not signal "content changed" to parents
        }

        contentRepository.saveAll(toArchive);
        log.info("Archived {} {} posts for level {} year {}",
                toArchive.size(), type, teacher.getLevelAssigned(), academicYear);
    }

    // ─── Download attachment ─────────────────────────────────────────────────

    public ResponseEntity<Resource> downloadAttachment(String email, Long attachmentId) {
        Teacher teacher = getTeacherByEmail(email);

        PortalContentAttachment att = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new NotFoundException("Attachment not found"));

        // Verify the attachment's content belongs to teacher's level
        if (!att.getContent().getTargetLevel().equals(teacher.getLevelAssigned())) {
            throw new AccessDeniedException("Access denied");
        }

        Resource resource = fileStorageService.loadFileAsResource(att.getStoredPath());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(att.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + att.getOriginalFileName() + "\"")
                .body(resource);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Teacher getTeacherByEmail(String email) {
        return teacherRepository.findByUser_EmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new NotFoundException("Teacher profile not found for account"));
    }

    private PortalContent findAndVerify(Long id, ContentType type, LevelAssigned level) {
        PortalContent content = contentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Content not found"));

        if (content.getType() != type) {
            throw new NotFoundException("Content not found");
        }

        if (!content.getTargetLevel().equals(level)) {
            throw new AccessDeniedException("Access denied");
        }

        return content;
    }

    private PortalContentSummaryResponse toSummary(PortalContent c) {
        String body = c.getBody();
        String excerpt = body.length() > 200 ? body.substring(0, 200) + "…" : body;
        return PortalContentSummaryResponse.builder()
                .id(c.getId())
                .type(c.getType())
                .title(c.getTitle())
                .bodyExcerpt(excerpt)
                .academicYear(c.getAcademicYear())
                .targetLevel(c.getTargetLevel())
                .pinned(c.isPinned())
                .urgent(c.isUrgent())
                .dueDate(c.getDueDate())
                .category(c.getCategory())
                .archived(c.isArchived())
                .attachmentCount(c.getAttachments().size())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private PortalContentDetailResponse toDetail(PortalContent c) {
        List<PortalContentAttachmentResponse> attResponses = c.getAttachments().stream()
                .map(a -> PortalContentAttachmentResponse.builder()
                        .id(a.getId())
                        .originalFileName(a.getOriginalFileName())
                        .contentType(a.getContentType())
                        .sizeBytes(a.getSizeBytes())
                        .createdAt(a.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return PortalContentDetailResponse.builder()
                .id(c.getId())
                .type(c.getType())
                .title(c.getTitle())
                .body(c.getBody())
                .academicYear(c.getAcademicYear())
                .targetLevel(c.getTargetLevel())
                .pinned(c.isPinned())
                .urgent(c.isUrgent())
                .dueDate(c.getDueDate())
                .category(c.getCategory())
                .archived(c.isArchived())
                .createdByTeacherName(c.getCreatedByTeacher().getFullName())
                .lastEditedByTeacherName(
                        c.getLastEditedByTeacher() != null ? c.getLastEditedByTeacher().getFullName() : null)
                .attachments(attResponses)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
