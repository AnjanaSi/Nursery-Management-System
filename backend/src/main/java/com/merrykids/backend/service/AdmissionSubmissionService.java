package com.merrykids.backend.service;

import com.merrykids.backend.dto.SubmissionConfirmationResponse;
import com.merrykids.backend.dto.SubmissionDetailResponse;
import com.merrykids.backend.dto.SubmissionResponse;
import com.merrykids.backend.entity.*;
import com.merrykids.backend.exception.NotFoundException;
import com.merrykids.backend.repository.AdmissionAnnouncementRepository;
import com.merrykids.backend.repository.AdmissionSubmissionRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdmissionSubmissionService {

    private final AdmissionSubmissionRepository submissionRepository;
    private final AdmissionAnnouncementRepository announcementRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public SubmissionConfirmationResponse submitApplication(
            String childFullName, LocalDate dateOfBirth, ApplyingLevel level,
            String guardianFullName, String email, String phone, String address,
            MultipartFile filledApplicationPdf) {

        // Validate admissions are open
        AdmissionAnnouncement announcement = announcementRepository.findTopByOrderByCreatedAtDesc()
                .orElseThrow(() -> new IllegalArgumentException("Admissions are currently closed"));

        LocalDate today = LocalDate.now();
        if (today.isBefore(announcement.getOpenDate()) || today.isAfter(announcement.getCloseDate())) {
            throw new IllegalArgumentException("Admissions are currently closed");
        }

        // Store PDF
        FileStorageService.StoredFile stored = fileStorageService.storeFile(
                filledApplicationPdf, "admissions/submissions");

        // Generate reference number
        String referenceNo = generateReferenceNo();

        AdmissionSubmission submission = AdmissionSubmission.builder()
                .referenceNo(referenceNo)
                .childFullName(childFullName)
                .dateOfBirth(dateOfBirth)
                .levelApplyingFor(level)
                .guardianFullName(guardianFullName)
                .email(email)
                .phone(phone)
                .address(address)
                .submittedPdfOriginalName(stored.originalName())
                .submittedPdfStoredName(stored.storedName())
                .submittedPdfPath(stored.path())
                .status(SubmissionStatus.RECEIVED)
                .build();

        submissionRepository.save(submission);
        log.info("Admission application submitted: ref={}", referenceNo);

        return new SubmissionConfirmationResponse(
                referenceNo,
                "Your application has been submitted successfully. Please save your reference number."
        );
    }

    public Page<SubmissionResponse> getSubmissions(String search, SubmissionStatus status,
                                                    ApplyingLevel level, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<AdmissionSubmission> spec = buildSpecification(search, status, level);

        return submissionRepository.findAll(spec, pageable).map(this::toResponse);
    }

    public SubmissionDetailResponse getSubmissionById(Long id) {
        AdmissionSubmission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Submission not found"));
        return toDetailResponse(submission);
    }

    @Transactional
    public SubmissionDetailResponse updateStatus(Long id, SubmissionStatus status) {
        AdmissionSubmission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Submission not found"));
        submission.setStatus(status);
        submissionRepository.save(submission);
        log.info("Submission {} status updated to {}", submission.getReferenceNo(), status);
        return toDetailResponse(submission);
    }

    @Transactional
    public SubmissionDetailResponse updateNote(Long id, String adminNote) {
        AdmissionSubmission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Submission not found"));
        submission.setAdminNote(adminNote);
        submissionRepository.save(submission);
        return toDetailResponse(submission);
    }

    public Resource getSubmissionPdf(Long id) {
        AdmissionSubmission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Submission not found"));

        if (submission.getSubmittedPdfPath() == null) {
            throw new NotFoundException("No PDF available for this submission");
        }

        return fileStorageService.loadFileAsResource(submission.getSubmittedPdfPath());
    }

    public String getSubmissionPdfOriginalName(Long id) {
        return submissionRepository.findById(id)
                .map(AdmissionSubmission::getSubmittedPdfOriginalName)
                .orElse("submission.pdf");
    }

    private String generateReferenceNo() {
        int year = LocalDate.now().getYear();
        long count = submissionRepository.countByYear(year);
        return String.format("MK-ADM-%d-%06d", year, count + 1);
    }

    private Specification<AdmissionSubmission> buildSpecification(String search,
                                                                   SubmissionStatus status,
                                                                   ApplyingLevel level) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (level != null) {
                predicates.add(cb.equal(root.get("levelApplyingFor"), level));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                Predicate searchPredicate = cb.or(
                        cb.like(cb.lower(root.get("guardianFullName")), pattern),
                        cb.like(cb.lower(root.get("childFullName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("phone")), pattern),
                        cb.like(cb.lower(root.get("referenceNo")), pattern)
                );
                predicates.add(searchPredicate);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private SubmissionResponse toResponse(AdmissionSubmission s) {
        return new SubmissionResponse(
                s.getId(),
                s.getReferenceNo(),
                s.getCreatedAt(),
                s.getChildFullName(),
                s.getLevelApplyingFor().name(),
                s.getGuardianFullName(),
                s.getEmail(),
                s.getPhone(),
                s.getStatus().name(),
                s.getAdminNote()
        );
    }

    private SubmissionDetailResponse toDetailResponse(AdmissionSubmission s) {
        return new SubmissionDetailResponse(
                s.getId(),
                s.getReferenceNo(),
                s.getChildFullName(),
                s.getDateOfBirth(),
                s.getLevelApplyingFor().name(),
                s.getGuardianFullName(),
                s.getEmail(),
                s.getPhone(),
                s.getAddress(),
                s.getSubmittedPdfOriginalName(),
                s.getStatus().name(),
                s.getAdminNote(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
