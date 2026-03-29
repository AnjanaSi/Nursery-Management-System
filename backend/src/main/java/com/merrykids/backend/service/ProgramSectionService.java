package com.merrykids.backend.service;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.ProgramCard;
import com.merrykids.backend.entity.ProgramSectionConfig;
import com.merrykids.backend.exception.NotFoundException;
import com.merrykids.backend.repository.ProgramCardRepository;
import com.merrykids.backend.repository.ProgramSectionConfigRepository;
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
public class ProgramSectionService {

    private final ProgramSectionConfigRepository configRepository;
    private final ProgramCardRepository cardRepository;
    private final FileStorageService fileStorageService;

    private static final Long CONFIG_ID = 1L;
    private static final String IMAGE_DIR = "programs/images";
    private static final String IMAGE_URL_PREFIX = "/api/v1/public/programs/cards/";
    private static final String IMAGE_URL_SUFFIX = "/image";

    public record ImageResource(Resource resource, String contentType) {}

    // ── Config ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ProgramSectionConfigResponse getConfig() {
        return toConfigResponse(getOrInitConfig());
    }

    @Transactional
    public ProgramSectionConfigResponse updateConfig(ProgramSectionConfigRequest request) {
        ProgramSectionConfig config = getOrInitConfig();
        config.setSectionTitle(request.getSectionTitle().trim());
        config.setSubtitle(request.getSubtitle().trim());
        ProgramSectionConfig saved = configRepository.save(config);
        log.info("Program section config updated.");
        return toConfigResponse(saved);
    }

    // ── Cards — Admin ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProgramCardResponse> listCards() {
        return cardRepository.findByIsDeletedFalseOrderByDisplayOrderAsc()
                .stream()
                .map(this::toCardResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProgramCardResponse getCard(Long id) {
        return toCardResponse(findNonDeleted(id));
    }

    @Transactional
    public ProgramCardResponse createCard(ProgramCardRequest request, MultipartFile image) {
        List<ProgramCard> existing = cardRepository.findByIsDeletedFalseOrderByDisplayOrderAsc();
        int nextOrder = existing.isEmpty() ? 0 : existing.get(existing.size() - 1).getDisplayOrder() + 1;

        ProgramCard.ProgramCardBuilder builder = ProgramCard.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .ageRange(request.getAgeRange().trim())
                .displayOrder(nextOrder);

        if (image != null && !image.isEmpty()) {
            FileStorageService.StoredFile stored = fileStorageService.storeImage(image, IMAGE_DIR);
            builder.imageStoredName(stored.storedName())
                    .imageOriginalName(stored.originalName())
                    .imageFilePath(stored.path())
                    .imageContentType(image.getContentType());
        }

        ProgramCard saved = cardRepository.save(builder.build());
        log.info("Program card created: '{}' (id={})", saved.getTitle(), saved.getId());
        return toCardResponse(saved);
    }

    @Transactional
    public ProgramCardResponse updateCard(Long id, ProgramCardRequest request, MultipartFile image) {
        ProgramCard card = findNonDeleted(id);
        card.setTitle(request.getTitle().trim());
        card.setDescription(request.getDescription().trim());
        card.setAgeRange(request.getAgeRange().trim());

        if (image != null && !image.isEmpty()) {
            if (card.getImageFilePath() != null) {
                fileStorageService.deleteFile(card.getImageFilePath());
            }
            FileStorageService.StoredFile stored = fileStorageService.storeImage(image, IMAGE_DIR);
            card.setImageStoredName(stored.storedName());
            card.setImageOriginalName(stored.originalName());
            card.setImageFilePath(stored.path());
            card.setImageContentType(image.getContentType());
        }

        ProgramCard saved = cardRepository.save(card);
        log.info("Program card updated: id={}", id);
        return toCardResponse(saved);
    }

    @Transactional
    public void deleteCard(Long id) {
        ProgramCard card = findNonDeleted(id);
        card.setDeleted(true);
        cardRepository.save(card);
        log.info("Program card soft-deleted: id={}", id);
    }

    @Transactional
    public ProgramCardResponse moveCardUp(Long id) {
        ProgramCard card = findNonDeleted(id);
        cardRepository.findTopByIsDeletedFalseAndDisplayOrderLessThanOrderByDisplayOrderDesc(card.getDisplayOrder())
                .ifPresent(predecessor -> {
                    int tmp = card.getDisplayOrder();
                    card.setDisplayOrder(predecessor.getDisplayOrder());
                    predecessor.setDisplayOrder(tmp);
                    cardRepository.save(predecessor);
                    cardRepository.save(card);
                    log.info("Program card {} moved up (swapped order with {})", id, predecessor.getId());
                });
        return toCardResponse(cardRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Card not found")));
    }

    @Transactional
    public ProgramCardResponse moveCardDown(Long id) {
        ProgramCard card = findNonDeleted(id);
        cardRepository.findTopByIsDeletedFalseAndDisplayOrderGreaterThanOrderByDisplayOrderAsc(card.getDisplayOrder())
                .ifPresent(successor -> {
                    int tmp = card.getDisplayOrder();
                    card.setDisplayOrder(successor.getDisplayOrder());
                    successor.setDisplayOrder(tmp);
                    cardRepository.save(successor);
                    cardRepository.save(card);
                    log.info("Program card {} moved down (swapped order with {})", id, successor.getId());
                });
        return toCardResponse(cardRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Card not found")));
    }

    // ── Public ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PublicProgramResponse getPublicPrograms() {
        ProgramSectionConfigResponse config = toConfigResponse(getOrInitConfig());
        List<PublicProgramCardResponse> cards = cardRepository.findByIsDeletedFalseOrderByDisplayOrderAsc()
                .stream()
                .map(this::toPublicCardResponse)
                .collect(Collectors.toList());
        return PublicProgramResponse.builder()
                .config(config)
                .cards(cards)
                .build();
    }

    @Transactional(readOnly = true)
    public ImageResource getCardImageResource(Long id) {
        ProgramCard card = findNonDeleted(id);
        if (card.getImageFilePath() == null) {
            throw new NotFoundException("No image for this card");
        }
        Resource resource = fileStorageService.loadFileAsResource(card.getImageFilePath());
        return new ImageResource(resource, card.getImageContentType());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ProgramSectionConfig getOrInitConfig() {
        return configRepository.findById(CONFIG_ID).orElseGet(() -> {
            ProgramSectionConfig defaultConfig = ProgramSectionConfig.builder()
                    .id(CONFIG_ID)
                    .sectionTitle("Our Programs")
                    .subtitle("Thoughtfully designed programs that grow with your child at every stage.")
                    .build();
            return configRepository.save(defaultConfig);
        });
    }

    private ProgramCard findNonDeleted(Long id) {
        return cardRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Program card not found with id: " + id));
    }

    private ProgramSectionConfigResponse toConfigResponse(ProgramSectionConfig config) {
        return ProgramSectionConfigResponse.builder()
                .id(config.getId())
                .sectionTitle(config.getSectionTitle())
                .subtitle(config.getSubtitle())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    private ProgramCardResponse toCardResponse(ProgramCard card) {
        boolean hasImage = card.getImageFilePath() != null;
        return ProgramCardResponse.builder()
                .id(card.getId())
                .title(card.getTitle())
                .description(card.getDescription())
                .ageRange(card.getAgeRange())
                .displayOrder(card.getDisplayOrder())
                .hasImage(hasImage)
                .imageUrl(hasImage ? IMAGE_URL_PREFIX + card.getId() + IMAGE_URL_SUFFIX : null)
                .createdAt(card.getCreatedAt())
                .updatedAt(card.getUpdatedAt())
                .build();
    }

    private PublicProgramCardResponse toPublicCardResponse(ProgramCard card) {
        boolean hasImage = card.getImageFilePath() != null;
        return PublicProgramCardResponse.builder()
                .id(card.getId())
                .title(card.getTitle())
                .description(card.getDescription())
                .ageRange(card.getAgeRange())
                .displayOrder(card.getDisplayOrder())
                .imageUrl(hasImage ? IMAGE_URL_PREFIX + card.getId() + IMAGE_URL_SUFFIX : null)
                .build();
    }
}
