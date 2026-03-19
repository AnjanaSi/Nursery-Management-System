package com.merrykids.backend.service;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.*;
import com.merrykids.backend.exception.NotFoundException;
import com.merrykids.backend.repository.*;
import com.merrykids.backend.util.AcademicYearUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParentPortalService {

    private final GuardianRepository guardianRepository;
    private final StudentRepository studentRepository;
    private final StudentGuardianRepository studentGuardianRepository;
    private final PortalContentRepository contentRepository;
    private final PortalContentAttachmentRepository attachmentRepository;
    private final ParentContentViewRepository viewRepository;
    private final FileStorageService fileStorageService;

    // ─── Children ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ParentChildSummaryResponse> getActiveChildren(String email) {
        Guardian guardian = getGuardianByEmail(email);
        String currentYear = AcademicYearUtil.getCurrent();

        return studentGuardianRepository.findByGuardianId(guardian.getId()).stream()
                .map(sg -> sg.getStudent())
                .filter(s -> !s.isDeleted() && s.getStatus() == StudentStatus.ACTIVE)
                .map(s -> ParentChildSummaryResponse.builder()
                        .id(s.getId())
                        .admissionNo(s.getAdmissionNo())
                        .fullName(s.getFullName())
                        .currentLevel(s.getCurrentLevel())
                        .batchCode(s.getBatchCode())
                        .academicYear(currentYear)
                        .build())
                .collect(Collectors.toList());
    }

    // ─── Child Profile ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ParentChildProfileResponse getChildProfile(String email, Long studentId) {
        Guardian guardian = getGuardianByEmail(email);
        Student student = getActiveStudent(studentId);
        assertGuardianOwnsStudent(guardian, student);

        List<StudentGuardian> allLinks = studentGuardianRepository.findByStudentId(studentId);
        String myRelationship = allLinks.stream()
                .filter(sg -> sg.getGuardian().getId().equals(guardian.getId()))
                .map(sg -> sg.getRelationshipType().name())
                .findFirst().orElse("GUARDIAN");

        List<ParentChildProfileResponse.OtherGuardianSummary> others = allLinks.stream()
                .filter(sg -> !sg.getGuardian().getId().equals(guardian.getId()) && !sg.getGuardian().isDeleted())
                .map(sg -> ParentChildProfileResponse.OtherGuardianSummary.builder()
                        .fullName(sg.getGuardian().getFullName())
                        .relationshipType(sg.getRelationshipType().name())
                        .phone(sg.getGuardian().getPhone())
                        .build())
                .collect(Collectors.toList());

        return ParentChildProfileResponse.builder()
                .id(student.getId())
                .admissionNo(student.getAdmissionNo())
                .fullName(student.getFullName())
                .dateOfBirth(student.getDateOfBirth())
                .gender(student.getGender().name())
                .currentLevel(student.getCurrentLevel())
                .entryLevel(student.getEntryLevel())
                .entryYear(student.getEntryYear())
                .batchCode(student.getBatchCode())
                .status(student.getStatus().name())
                .enrollmentDate(student.getEnrollmentDate())
                .relationshipType(myRelationship)
                .otherGuardians(others)
                .build();
    }

    // ─── Announcements list ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ParentContentListItemResponse> listAnnouncements(
            String email, Long studentId, int page, int size) {
        return listContent(email, studentId, ContentType.ANNOUNCEMENT, page, size,
                Sort.by(Sort.Order.desc("pinned"), Sort.Order.desc("createdAt")));
    }

    // ─── Homework list ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ParentContentListItemResponse> listHomework(
            String email, Long studentId, int page, int size) {
        return listContent(email, studentId, ContentType.HOMEWORK, page, size,
                Sort.by(Sort.Order.desc("createdAt")));
    }

    // ─── Announcement detail ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ParentContentDetailResponse getAnnouncementDetail(
            String email, Long contentId, Long studentId) {
        return getContentDetail(email, contentId, studentId, ContentType.ANNOUNCEMENT);
    }

    // ─── Homework detail ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ParentContentDetailResponse getHomeworkDetail(
            String email, Long contentId, Long studentId) {
        return getContentDetail(email, contentId, studentId, ContentType.HOMEWORK);
    }

    // ─── Mark viewed ─────────────────────────────────────────────────────────

    @Transactional
    public void markViewed(String email, Long studentId, Long contentId, ContentType type) {
        Guardian guardian = getGuardianByEmail(email);
        Student student = getActiveStudent(studentId);
        assertGuardianOwnsStudent(guardian, student);

        PortalContent content = contentRepository.findById(contentId)
                .orElseThrow(() -> new NotFoundException("Content not found"));

        if (content.getType() != type) {
            throw new NotFoundException("Content not found");
        }
        assertContentAccessible(content, student);

        ParentContentView view = viewRepository
                .findByGuardianIdAndStudentIdAndContentId(guardian.getId(), student.getId(), contentId)
                .orElse(ParentContentView.builder()
                        .guardian(guardian)
                        .student(student)
                        .content(content)
                        .build());

        view.setLastViewedAt(LocalDateTime.now());
        viewRepository.save(view);
    }

    // ─── Download attachment ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> downloadAttachment(
            String email, Long attachmentId, Long studentId) {
        Guardian guardian = getGuardianByEmail(email);
        Student student = getActiveStudent(studentId);
        assertGuardianOwnsStudent(guardian, student);

        PortalContentAttachment att = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new NotFoundException("Attachment not found"));

        assertContentAccessible(att.getContent(), student);

        Resource resource = fileStorageService.loadFileAsResource(att.getStoredPath());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(att.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + att.getOriginalFileName() + "\"")
                .body(resource);
    }

    // ─── Shared list logic ────────────────────────────────────────────────────

    private Page<ParentContentListItemResponse> listContent(
            String email, Long studentId, ContentType type, int page, int size, Sort sort) {

        Guardian guardian = getGuardianByEmail(email);
        Student student = getActiveStudent(studentId);
        assertGuardianOwnsStudent(guardian, student);

        String currentYear = AcademicYearUtil.getCurrent();
        Page<PortalContent> contentPage = contentRepository
                .findByTargetLevelAndTypeAndAcademicYearAndArchived(
                        student.getCurrentLevel(), type, currentYear, false,
                        PageRequest.of(page, size, sort));

        List<Long> contentIds = contentPage.getContent().stream()
                .map(PortalContent::getId)
                .collect(Collectors.toList());

        Map<Long, ParentContentView> viewMap = contentIds.isEmpty()
                ? Map.of()
                : viewRepository.findByGuardianIdAndStudentIdAndContentIdIn(
                        guardian.getId(), student.getId(), contentIds)
                  .stream()
                  .collect(Collectors.toMap(v -> v.getContent().getId(), Function.identity()));

        return contentPage.map(c -> toListItem(c, viewMap.get(c.getId())));
    }

    private ParentContentDetailResponse getContentDetail(
            String email, Long contentId, Long studentId, ContentType type) {

        Guardian guardian = getGuardianByEmail(email);
        Student student = getActiveStudent(studentId);
        assertGuardianOwnsStudent(guardian, student);

        PortalContent content = contentRepository.findById(contentId)
                .orElseThrow(() -> new NotFoundException("Content not found"));

        if (content.getType() != type) {
            throw new NotFoundException("Content not found");
        }
        assertContentAccessible(content, student);

        ParentContentView view = viewRepository
                .findByGuardianIdAndStudentIdAndContentId(guardian.getId(), student.getId(), contentId)
                .orElse(null);

        return toDetail(content, view);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Guardian getGuardianByEmail(String email) {
        return guardianRepository.findByUser_EmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new NotFoundException("Guardian profile not found for account"));
    }

    private Student getActiveStudent(Long studentId) {
        Student student = studentRepository.findByIdAndIsDeletedFalse(studentId)
                .orElseThrow(() -> new NotFoundException("Student not found"));
        if (student.getStatus() != StudentStatus.ACTIVE) {
            throw new AccessDeniedException("Access denied: student is not active");
        }
        return student;
    }

    private void assertGuardianOwnsStudent(Guardian guardian, Student student) {
        boolean owns = studentGuardianRepository.findByGuardianId(guardian.getId())
                .stream()
                .anyMatch(sg -> sg.getStudent().getId().equals(student.getId()));
        if (!owns) {
            throw new AccessDeniedException("Access denied: student not linked to this guardian");
        }
    }

    private void assertContentAccessible(PortalContent content, Student student) {
        if (!content.getTargetLevel().equals(student.getCurrentLevel())) {
            throw new AccessDeniedException("Access denied: content not for this child's level");
        }
        if (!content.getAcademicYear().equals(AcademicYearUtil.getCurrent())) {
            throw new AccessDeniedException("Access denied: content is from a previous academic year");
        }
        if (content.isArchived()) {
            throw new AccessDeniedException("Access denied: content is archived");
        }
    }

    private boolean computeIsViewed(ParentContentView view, PortalContent content) {
        if (view == null || view.getLastViewedAt() == null) return false;
        return !view.getLastViewedAt().isBefore(content.getUpdatedAt());
    }

    private ParentContentListItemResponse toListItem(PortalContent c, ParentContentView view) {
        String body = c.getBody();
        String excerpt = body.length() > 200 ? body.substring(0, 200) + "…" : body;
        return ParentContentListItemResponse.builder()
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
                .attachmentCount(c.getAttachments().size())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .viewed(computeIsViewed(view, c))
                .build();
    }

    private ParentContentDetailResponse toDetail(PortalContent c, ParentContentView view) {
        List<PortalContentAttachmentResponse> attResponses = c.getAttachments().stream()
                .map(a -> PortalContentAttachmentResponse.builder()
                        .id(a.getId())
                        .originalFileName(a.getOriginalFileName())
                        .contentType(a.getContentType())
                        .sizeBytes(a.getSizeBytes())
                        .createdAt(a.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ParentContentDetailResponse.builder()
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
                .createdByTeacherName(c.getCreatedByTeacher().getFullName())
                .lastEditedByTeacherName(
                        c.getLastEditedByTeacher() != null ? c.getLastEditedByTeacher().getFullName() : null)
                .attachments(attResponses)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .viewed(computeIsViewed(view, c))
                .build();
    }
}
