package com.merrykids.backend.service;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.AboutCard;
import com.merrykids.backend.entity.AboutSectionConfig;
import com.merrykids.backend.exception.NotFoundException;
import com.merrykids.backend.repository.AboutCardRepository;
import com.merrykids.backend.repository.AboutSectionConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AboutSectionService {

    private final AboutSectionConfigRepository configRepository;
    private final AboutCardRepository cardRepository;
    private final FileStorageService fileStorageService;

    private static final Long CONFIG_ID = 1L;
    private static final String IMAGE_DIR = "about/images";
    private static final String IMAGE_URL_PREFIX = "/api/v1/public/about/cards/";
    private static final String IMAGE_URL_SUFFIX = "/image";

    public record ImageResource(Resource resource, String contentType) {}

    // ── Config ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AboutSectionConfigResponse getConfig() {
        return toConfigResponse(getOrInitConfig());
    }

    @Transactional
    public AboutSectionConfigResponse updateConfig(AboutSectionConfigRequest request) {
        AboutSectionConfig config = getOrInitConfig();
        config.setSectionTitle(request.getSectionTitle().trim());
        config.setSubtitle(request.getSubtitle().trim());
        AboutSectionConfig saved = configRepository.save(config);
        log.info("About section config updated.");
        return toConfigResponse(saved);
    }

    // ── Cards — Admin ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AboutCardResponse> listCards() {
        return cardRepository.findByIsDeletedFalseOrderByDisplayOrderAsc()
                .stream()
                .map(this::toCardResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AboutCardResponse getCard(Long id) {
        return toCardResponse(findNonDeleted(id));
    }

    @Transactional
    public AboutCardResponse createCard(AboutCardRequest request, MultipartFile image) {
        List<AboutCard> existing = cardRepository.findByIsDeletedFalseOrderByDisplayOrderAsc();
        int nextOrder = existing.isEmpty() ? 0 : existing.get(existing.size() - 1).getDisplayOrder() + 1;

        AboutCard.AboutCardBuilder builder = AboutCard.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .displayOrder(nextOrder);

        if (image != null && !image.isEmpty()) {
            FileStorageService.StoredFile stored = fileStorageService.storeImage(image, IMAGE_DIR);
            builder.imageStoredName(stored.storedName())
                    .imageOriginalName(stored.originalName())
                    .imageFilePath(stored.path())
                    .imageContentType(image.getContentType());
        }

        AboutCard saved = cardRepository.save(builder.build());
        log.info("About card created: '{}' (id={})", saved.getTitle(), saved.getId());
        return toCardResponse(saved);
    }

    @Transactional
    public AboutCardResponse updateCard(Long id, AboutCardRequest request, MultipartFile image) {
        AboutCard card = findNonDeleted(id);
        card.setTitle(request.getTitle().trim());
        card.setDescription(request.getDescription().trim());

        if (image != null && !image.isEmpty()) {
            // Delete old image file if present
            if (card.getImageFilePath() != null) {
                fileStorageService.deleteFile(card.getImageFilePath());
            }
            FileStorageService.StoredFile stored = fileStorageService.storeImage(image, IMAGE_DIR);
            card.setImageStoredName(stored.storedName());
            card.setImageOriginalName(stored.originalName());
            card.setImageFilePath(stored.path());
            card.setImageContentType(image.getContentType());
        }

        AboutCard saved = cardRepository.save(card);
        log.info("About card updated: id={}", id);
        return toCardResponse(saved);
    }

    @Transactional
    public void deleteCard(Long id) {
        AboutCard card = findNonDeleted(id);
        card.setDeleted(true);
        cardRepository.save(card);
        log.info("About card soft-deleted: id={}", id);
    }

    @Transactional
    public AboutCardResponse moveCardUp(Long id) {
        AboutCard card = findNonDeleted(id);
        cardRepository.findTopByIsDeletedFalseAndDisplayOrderLessThanOrderByDisplayOrderDesc(card.getDisplayOrder())
                .ifPresent(predecessor -> {
                    int tmp = card.getDisplayOrder();
                    card.setDisplayOrder(predecessor.getDisplayOrder());
                    predecessor.setDisplayOrder(tmp);
                    cardRepository.save(predecessor);
                    cardRepository.save(card);
                    log.info("About card {} moved up (swapped order with {})", id, predecessor.getId());
                });
        return toCardResponse(cardRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Card not found")));
    }

    @Transactional
    public AboutCardResponse moveCardDown(Long id) {
        AboutCard card = findNonDeleted(id);
        cardRepository.findTopByIsDeletedFalseAndDisplayOrderGreaterThanOrderByDisplayOrderAsc(card.getDisplayOrder())
                .ifPresent(successor -> {
                    int tmp = card.getDisplayOrder();
                    card.setDisplayOrder(successor.getDisplayOrder());
                    successor.setDisplayOrder(tmp);
                    cardRepository.save(successor);
                    cardRepository.save(card);
                    log.info("About card {} moved down (swapped order with {})", id, successor.getId());
                });
        return toCardResponse(cardRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Card not found")));
    }

    // ── Public ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PublicAboutResponse getPublicAbout() {
        AboutSectionConfigResponse config = toConfigResponse(getOrInitConfig());
        List<PublicAboutCardResponse> cards = cardRepository.findByIsDeletedFalseOrderByDisplayOrderAsc()
                .stream()
                .map(this::toPublicCardResponse)
                .collect(Collectors.toList());
        return PublicAboutResponse.builder()
                .config(config)
                .cards(cards)
                .build();
    }

    @Transactional(readOnly = true)
    public ImageResource getCardImageResource(Long id) {
        AboutCard card = findNonDeleted(id);
        if (card.getImageFilePath() == null) {
            throw new NotFoundException("No image for this card");
        }
        Resource resource = fileStorageService.loadFileAsResource(card.getImageFilePath());
        return new ImageResource(resource, card.getImageContentType());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AboutSectionConfig getOrInitConfig() {
        return configRepository.findById(CONFIG_ID).orElseGet(() -> {
            AboutSectionConfig defaultConfig = AboutSectionConfig.builder()
                    .id(CONFIG_ID)
                    .sectionTitle("About MerryKids")
                    .subtitle("Since 2010, we have been a trusted home-away-from-home for children " +
                              "aged 6 months to 5 years, right in the heart of our community.")
                    .build();
            return configRepository.save(defaultConfig);
        });
    }

    private AboutCard findNonDeleted(Long id) {
        return cardRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("About card not found with id: " + id));
    }

    private AboutSectionConfigResponse toConfigResponse(AboutSectionConfig config) {
        return AboutSectionConfigResponse.builder()
                .id(config.getId())
                .sectionTitle(config.getSectionTitle())
                .subtitle(config.getSubtitle())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    private AboutCardResponse toCardResponse(AboutCard card) {
        boolean hasImage = card.getImageFilePath() != null;
        return AboutCardResponse.builder()
                .id(card.getId())
                .title(card.getTitle())
                .description(card.getDescription())
                .displayOrder(card.getDisplayOrder())
                .hasImage(hasImage)
                .imageUrl(hasImage ? IMAGE_URL_PREFIX + card.getId() + IMAGE_URL_SUFFIX : null)
                .createdAt(card.getCreatedAt())
                .updatedAt(card.getUpdatedAt())
                .build();
    }

    private PublicAboutCardResponse toPublicCardResponse(AboutCard card) {
        boolean hasImage = card.getImageFilePath() != null;
        return PublicAboutCardResponse.builder()
                .id(card.getId())
                .title(card.getTitle())
                .description(card.getDescription())
                .displayOrder(card.getDisplayOrder())
                .imageUrl(hasImage ? IMAGE_URL_PREFIX + card.getId() + IMAGE_URL_SUFFIX : null)
                .build();
    }
}
