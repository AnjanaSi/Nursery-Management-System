package com.merrykids.backend.service;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.EventPhoto;
import com.merrykids.backend.entity.NurseryEvent;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.exception.NotFoundException;
import com.merrykids.backend.repository.EventPhotoRepository;
import com.merrykids.backend.repository.NurseryEventRepository;
import com.merrykids.backend.repository.UserRepository;
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

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final NurseryEventRepository eventRepository;
    private final EventPhotoRepository photoRepository;
    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;

    private static final String PHOTO_DIR = "events/photos";
    private static final int MAX_PHOTOS = 10;
    private static final String PHOTO_URL_PREFIX = "/api/v1/public/events/photos/";

    public record PhotoResource(Resource resource, String contentType) {}

    // ── Create ──────────────────────────────────────────────────────────────

    @Transactional
    public EventDetailResponse createEvent(CreateEventRequest request,
                                           List<MultipartFile> photos,
                                           String createdByEmail) {
        if (photos.size() > MAX_PHOTOS) {
            throw new IllegalArgumentException(
                    "Maximum " + MAX_PHOTOS + " photos allowed per event.");
        }

        User creator = userRepository.findByEmail(createdByEmail).orElse(null);

        NurseryEvent event = NurseryEvent.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .eventDate(request.getEventDate())
                .createdBy(creator)
                .build();

        NurseryEvent saved = eventRepository.save(event);

        storePhotos(saved, photos, 0);

        log.info("Event created: '{}' (id={})", saved.getTitle(), saved.getId());
        return toDetailResponse(saved);
    }

    // ── Update ──────────────────────────────────────────────────────────────

    @Transactional
    public EventDetailResponse updateEvent(Long id,
                                           UpdateEventRequest request,
                                           List<MultipartFile> newPhotos,
                                           String editorEmail) {
        NurseryEvent event = findNonDeleted(id);

        event.setTitle(request.getTitle().trim());
        event.setDescription(request.getDescription().trim());
        event.setEventDate(request.getEventDate());

        // Remove explicitly requested photos and delete their files
        List<Long> removeIds = request.getRemovePhotoIds();
        if (removeIds != null && !removeIds.isEmpty()) {
            List<EventPhoto> toRemove = photoRepository.findByIdInAndEvent_Id(removeIds, id);
            for (EventPhoto photo : toRemove) {
                fileStorageService.deleteFile(photo.getFilePath());
                photoRepository.delete(photo);
            }
            photoRepository.flush();
        }

        // Reassign displayOrder on remaining photos
        List<EventPhoto> remaining = photoRepository.findByEventIdOrderByDisplayOrderAsc(id);
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setDisplayOrder(i);
        }
        photoRepository.saveAll(remaining);

        // Validate total photo count
        int totalAfter = remaining.size() + newPhotos.size();
        if (totalAfter > MAX_PHOTOS) {
            throw new IllegalArgumentException(
                    "Maximum " + MAX_PHOTOS + " photos allowed per event. "
                            + "Current: " + remaining.size() + ", adding: " + newPhotos.size() + ".");
        }

        storePhotos(event, newPhotos, remaining.size());

        eventRepository.save(event);
        log.info("Event updated: '{}' (id={})", event.getTitle(), event.getId());

        // Reload fresh to return consistent state
        NurseryEvent reloaded = findNonDeleted(id);
        return toDetailResponse(reloaded);
    }

    // ── Soft Delete ──────────────────────────────────────────────────────────

    @Transactional
    public void softDelete(Long id) {
        NurseryEvent event = findNonDeleted(id);
        event.setDeleted(true);
        eventRepository.save(event);
        log.info("Event soft-deleted: '{}' (id={})", event.getTitle(), id);
    }

    @Transactional
    public void bulkSoftDelete(List<Long> ids) {
        List<NurseryEvent> events = eventRepository.findAllById(ids);
        events.stream()
                .filter(e -> !e.isDeleted())
                .forEach(e -> e.setDeleted(true));
        eventRepository.saveAll(events);
        log.info("Bulk soft-deleted {} events", ids.size());
    }

    // ── Read ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public EventDetailResponse getEventDetail(Long id) {
        NurseryEvent event = findNonDeleted(id);
        return toDetailResponse(event);
    }

    @Transactional(readOnly = true)
    public Page<EventSummaryResponse> listEventsAdmin(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        Specification<NurseryEvent> spec = buildAdminSpec(search);
        return eventRepository.findAll(spec, pageable).map(this::toSummaryResponse);
    }

    @Transactional(readOnly = true)
    public Page<EventSummaryResponse> listEventsPublic(int page, int size) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("eventDate"), Sort.Order.desc("createdAt")));
        Specification<NurseryEvent> spec = (root, query, cb) ->
                cb.isFalse(root.get("isDeleted"));
        return eventRepository.findAll(spec, pageable).map(this::toSummaryResponse);
    }

    @Transactional(readOnly = true)
    public PhotoResource getPhotoResource(Long photoId) {
        EventPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new NotFoundException("Photo not found"));

        // Verify parent event is not deleted
        eventRepository.findByIdAndIsDeletedFalse(photo.getEvent().getId())
                .orElseThrow(() -> new NotFoundException("Event not found or has been removed"));

        Resource resource = fileStorageService.loadFileAsResource(photo.getFilePath());
        return new PhotoResource(resource, photo.getContentType());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private NurseryEvent findNonDeleted(Long id) {
        return eventRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Event not found"));
    }

    private void storePhotos(NurseryEvent event, List<MultipartFile> photos, int startOrder) {
        for (int i = 0; i < photos.size(); i++) {
            MultipartFile file = photos.get(i);
            if (file == null || file.isEmpty()) continue;

            FileStorageService.StoredFile stored = fileStorageService.storeImage(file, PHOTO_DIR);

            EventPhoto photo = EventPhoto.builder()
                    .event(event)
                    .storedFileName(stored.storedName())
                    .originalFileName(stored.originalName())
                    .filePath(stored.path())
                    .contentType(file.getContentType())
                    .fileSize(file.getSize())
                    .displayOrder(startOrder + i)
                    .build();

            photoRepository.save(photo);
        }
    }

    private Specification<NurseryEvent> buildAdminSpec(String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("isDeleted")));

            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("description")), like)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private EventSummaryResponse toSummaryResponse(NurseryEvent event) {
        Long coverPhotoId = photoRepository
                .findFirstByEvent_IdOrderByDisplayOrderAsc(event.getId())
                .map(EventPhoto::getId)
                .orElse(null);

        int photoCount = photoRepository.findByEventIdOrderByDisplayOrderAsc(event.getId()).size();

        return EventSummaryResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .eventDate(event.getEventDate())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .photoCount(photoCount)
                .coverPhotoId(coverPhotoId)
                .build();
    }

    private EventDetailResponse toDetailResponse(NurseryEvent event) {
        List<EventPhoto> photos = photoRepository.findByEventIdOrderByDisplayOrderAsc(event.getId());
        List<EventPhotoResponse> photoResponses = photos.stream()
                .map(this::toPhotoResponse)
                .collect(Collectors.toList());

        return EventDetailResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .eventDate(event.getEventDate())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .photos(photoResponses)
                .build();
    }

    private EventPhotoResponse toPhotoResponse(EventPhoto photo) {
        return EventPhotoResponse.builder()
                .id(photo.getId())
                .originalFileName(photo.getOriginalFileName())
                .imageUrl(PHOTO_URL_PREFIX + photo.getId() + "/image")
                .displayOrder(photo.getDisplayOrder())
                .build();
    }
}
