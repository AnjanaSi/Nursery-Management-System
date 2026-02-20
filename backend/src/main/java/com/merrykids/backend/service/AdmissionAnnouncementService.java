package com.merrykids.backend.service;

import com.merrykids.backend.dto.AnnouncementResponse;
import com.merrykids.backend.entity.AdmissionAnnouncement;
import com.merrykids.backend.exception.NotFoundException;
import com.merrykids.backend.repository.AdmissionAnnouncementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdmissionAnnouncementService {

    private final AdmissionAnnouncementRepository announcementRepository;
    private final FileStorageService fileStorageService;

    public AnnouncementResponse getPublicAnnouncement() {
        return announcementRepository.findTopByOrderByCreatedAtDesc()
                .map(this::toResponse)
                .orElse(null);
    }

    public AnnouncementResponse getAdminAnnouncement() {
        AdmissionAnnouncement announcement = announcementRepository.findTopByOrderByCreatedAtDesc()
                .orElseThrow(() -> new NotFoundException("No announcement found"));
        return toResponse(announcement);
    }

    @Transactional
    public AnnouncementResponse createOrUpdateAnnouncement(String message, LocalDate openDate,
                                                            LocalDate closeDate, MultipartFile applicationPdf) {
        if (openDate.isAfter(closeDate)) {
            throw new IllegalArgumentException("Open date must be before or equal to close date");
        }

        AdmissionAnnouncement announcement = announcementRepository.findTopByOrderByCreatedAtDesc()
                .orElse(new AdmissionAnnouncement());

        announcement.setMessage(message);
        announcement.setOpenDate(openDate);
        announcement.setCloseDate(closeDate);

        if (applicationPdf != null && !applicationPdf.isEmpty()) {
            // Delete old PDF if exists
            fileStorageService.deleteFile(announcement.getApplicationPdfPath());

            FileStorageService.StoredFile stored = fileStorageService.storeFile(
                    applicationPdf, "admissions/announcements");
            announcement.setApplicationPdfOriginalName(stored.originalName());
            announcement.setApplicationPdfStoredName(stored.storedName());
            announcement.setApplicationPdfPath(stored.path());
        }

        AdmissionAnnouncement saved = announcementRepository.save(announcement);
        log.info("Announcement created/updated: id={}", saved.getId());
        return toResponse(saved);
    }

    public Resource getAnnouncementPdf() {
        AdmissionAnnouncement announcement = announcementRepository.findTopByOrderByCreatedAtDesc()
                .orElseThrow(() -> new NotFoundException("No announcement found"));

        if (announcement.getApplicationPdfPath() == null) {
            throw new NotFoundException("No application PDF available");
        }

        return fileStorageService.loadFileAsResource(announcement.getApplicationPdfPath());
    }

    public String getAnnouncementPdfOriginalName() {
        return announcementRepository.findTopByOrderByCreatedAtDesc()
                .map(AdmissionAnnouncement::getApplicationPdfOriginalName)
                .orElse("application.pdf");
    }

    private AnnouncementResponse toResponse(AdmissionAnnouncement a) {
        LocalDate today = LocalDate.now();
        boolean isOpen = !today.isBefore(a.getOpenDate()) && !today.isAfter(a.getCloseDate());
        boolean hasPdf = a.getApplicationPdfPath() != null;

        return new AnnouncementResponse(
                a.getId(),
                a.getMessage(),
                a.getOpenDate(),
                a.getCloseDate(),
                isOpen,
                hasPdf,
                a.getApplicationPdfOriginalName()
        );
    }
}
