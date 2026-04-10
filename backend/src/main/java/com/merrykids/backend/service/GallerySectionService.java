package com.merrykids.backend.service;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.GalleryPhoto;
import com.merrykids.backend.entity.GallerySectionConfig;
import com.merrykids.backend.exception.FileStorageException;
import com.merrykids.backend.exception.NotFoundException;
import com.merrykids.backend.repository.GalleryPhotoRepository;
import com.merrykids.backend.repository.GallerySectionConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GallerySectionService {

    private final GallerySectionConfigRepository configRepository;
    private final GalleryPhotoRepository photoRepository;
    private final FileStorageService fileStorageService;

    private static final Long CONFIG_ID = 1L;
    private static final String IMAGE_DIR = "gallery/photos";
    private static final String IMAGE_URL_PREFIX = "/api/v1/public/gallery/photos/";
    private static final String IMAGE_URL_SUFFIX = "/image";
    private static final int MAX_PHOTOS = 100;

    public record ImageResource(Resource resource, String contentType) {}

    // ── Config ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public GallerySectionConfigResponse getConfig() {
        return toConfigResponse(getOrInitConfig());
    }

    @Transactional
    public GallerySectionConfigResponse updateConfig(GallerySectionConfigRequest request) {
        GallerySectionConfig config = getOrInitConfig();
        config.setSectionTitle(request.getSectionTitle().trim());
        config.setSubtitle(request.getSubtitle().trim());
        GallerySectionConfig saved = configRepository.save(config);
        log.info("Gallery section config updated.");
        return toConfigResponse(saved);
    }

    // ── Photos — Admin ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<GalleryPhotoResponse> listPhotos() {
        return photoRepository.findByIsDeletedFalseOrderByDisplayOrderAsc()
                .stream()
                .map(this::toPhotoResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public GalleryPhotoResponse uploadPhoto(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("An image file is required.");
        }

        if (photoRepository.countByIsDeletedFalse() >= MAX_PHOTOS) {
            throw new FileStorageException(
                    "Gallery is full. Maximum " + MAX_PHOTOS + " photos allowed.");
        }

        List<GalleryPhoto> existing = photoRepository.findByIsDeletedFalseOrderByDisplayOrderAsc();
        int nextOrder = existing.isEmpty() ? 0 : existing.get(existing.size() - 1).getDisplayOrder() + 1;

        FileStorageService.StoredFile stored = fileStorageService.storeImage(image, IMAGE_DIR);

        GalleryPhoto photo = GalleryPhoto.builder()
                .imageStoredName(stored.storedName())
                .imageOriginalName(stored.originalName())
                .imageFilePath(stored.path())
                .imageContentType(image.getContentType())
                .displayOrder(nextOrder)
                .build();

        GalleryPhoto saved = photoRepository.save(photo);
        log.info("Gallery photo uploaded: id={}, file={}", saved.getId(), stored.storedName());
        return toPhotoResponse(saved);
    }

    @Transactional
    public List<GalleryPhotoResponse> uploadPhotos(List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            throw new IllegalArgumentException("At least one image file is required.");
        }

        int currentCount = photoRepository.countByIsDeletedFalse();
        if (currentCount + images.size() > MAX_PHOTOS) {
            throw new FileStorageException(
                    "Upload would exceed the gallery limit. Current: " + currentCount +
                    ", uploading: " + images.size() + ", max: " + MAX_PHOTOS + ".");
        }

        List<GalleryPhoto> existing = photoRepository.findByIsDeletedFalseOrderByDisplayOrderAsc();
        int nextOrder = existing.isEmpty() ? 0 : existing.get(existing.size() - 1).getDisplayOrder() + 1;

        List<GalleryPhotoResponse> results = new ArrayList<>();
        for (MultipartFile image : images) {
            if (image == null || image.isEmpty()) continue;
            FileStorageService.StoredFile stored = fileStorageService.storeImage(image, IMAGE_DIR);
            GalleryPhoto photo = GalleryPhoto.builder()
                    .imageStoredName(stored.storedName())
                    .imageOriginalName(stored.originalName())
                    .imageFilePath(stored.path())
                    .imageContentType(image.getContentType())
                    .displayOrder(nextOrder++)
                    .build();
            GalleryPhoto saved = photoRepository.save(photo);
            log.info("Gallery photo uploaded (batch): id={}, file={}", saved.getId(), stored.storedName());
            results.add(toPhotoResponse(saved));
        }
        return results;
    }

    @Transactional
    public void deletePhotos(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return;
        ids.forEach(id -> photoRepository.findByIdAndIsDeletedFalse(id).ifPresent(photo -> {
            photo.setDeleted(true);
            photoRepository.save(photo);
        }));
        log.info("Gallery bulk delete: {} photos soft-deleted", ids.size());
    }

    @Transactional
    public void deletePhoto(Long id) {
        GalleryPhoto photo = findNonDeleted(id);
        photo.setDeleted(true);
        photoRepository.save(photo);
        log.info("Gallery photo soft-deleted: id={}", id);
    }

    @Transactional
    public GalleryPhotoResponse movePhotoUp(Long id) {
        GalleryPhoto photo = findNonDeleted(id);
        photoRepository.findTopByIsDeletedFalseAndDisplayOrderLessThanOrderByDisplayOrderDesc(photo.getDisplayOrder())
                .ifPresent(predecessor -> {
                    int tmp = photo.getDisplayOrder();
                    photo.setDisplayOrder(predecessor.getDisplayOrder());
                    predecessor.setDisplayOrder(tmp);
                    photoRepository.save(predecessor);
                    photoRepository.save(photo);
                    log.info("Gallery photo {} moved up (swapped order with {})", id, predecessor.getId());
                });
        return toPhotoResponse(photoRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Gallery photo not found")));
    }

    @Transactional
    public GalleryPhotoResponse movePhotoDown(Long id) {
        GalleryPhoto photo = findNonDeleted(id);
        photoRepository.findTopByIsDeletedFalseAndDisplayOrderGreaterThanOrderByDisplayOrderAsc(photo.getDisplayOrder())
                .ifPresent(successor -> {
                    int tmp = photo.getDisplayOrder();
                    photo.setDisplayOrder(successor.getDisplayOrder());
                    successor.setDisplayOrder(tmp);
                    photoRepository.save(successor);
                    photoRepository.save(photo);
                    log.info("Gallery photo {} moved down (swapped order with {})", id, successor.getId());
                });
        return toPhotoResponse(photoRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Gallery photo not found")));
    }

    // ── Public ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PublicGalleryResponse getPublicGallery() {
        GallerySectionConfigResponse config = toConfigResponse(getOrInitConfig());
        List<PublicGalleryPhotoResponse> photos = photoRepository.findByIsDeletedFalseOrderByDisplayOrderAsc()
                .stream()
                .map(this::toPublicPhotoResponse)
                .collect(Collectors.toList());
        return PublicGalleryResponse.builder()
                .config(config)
                .photos(photos)
                .build();
    }

    @Transactional(readOnly = true)
    public ImageResource getPhotoImageResource(Long id) {
        GalleryPhoto photo = findNonDeleted(id);
        if (photo.getImageFilePath() == null) {
            throw new NotFoundException("No image for this gallery photo");
        }
        Resource resource = fileStorageService.loadFileAsResource(photo.getImageFilePath());
        return new ImageResource(resource, photo.getImageContentType());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private GallerySectionConfig getOrInitConfig() {
        return configRepository.findById(CONFIG_ID).orElseGet(() -> {
            GallerySectionConfig defaultConfig = GallerySectionConfig.builder()
                    .id(CONFIG_ID)
                    .sectionTitle("Gallery")
                    .subtitle("A glimpse into our vibrant nursery life — moments of joy, learning, and friendship.")
                    .build();
            return configRepository.save(defaultConfig);
        });
    }

    private GalleryPhoto findNonDeleted(Long id) {
        return photoRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Gallery photo not found with id: " + id));
    }

    private GallerySectionConfigResponse toConfigResponse(GallerySectionConfig config) {
        return GallerySectionConfigResponse.builder()
                .id(config.getId())
                .sectionTitle(config.getSectionTitle())
                .subtitle(config.getSubtitle())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    private GalleryPhotoResponse toPhotoResponse(GalleryPhoto photo) {
        boolean hasImage = photo.getImageFilePath() != null;
        return GalleryPhotoResponse.builder()
                .id(photo.getId())
                .displayOrder(photo.getDisplayOrder())
                .hasImage(hasImage)
                .imageUrl(hasImage ? IMAGE_URL_PREFIX + photo.getId() + IMAGE_URL_SUFFIX : null)
                .createdAt(photo.getCreatedAt())
                .updatedAt(photo.getUpdatedAt())
                .build();
    }

    private PublicGalleryPhotoResponse toPublicPhotoResponse(GalleryPhoto photo) {
        boolean hasImage = photo.getImageFilePath() != null;
        return PublicGalleryPhotoResponse.builder()
                .id(photo.getId())
                .displayOrder(photo.getDisplayOrder())
                .imageUrl(hasImage ? IMAGE_URL_PREFIX + photo.getId() + IMAGE_URL_SUFFIX : null)
                .build();
    }
}
