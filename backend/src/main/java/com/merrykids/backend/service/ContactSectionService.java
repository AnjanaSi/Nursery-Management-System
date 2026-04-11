package com.merrykids.backend.service;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.ContactItem;
import com.merrykids.backend.entity.ContactItemType;
import com.merrykids.backend.entity.ContactSectionConfig;
import com.merrykids.backend.exception.NotFoundException;
import com.merrykids.backend.repository.ContactItemRepository;
import com.merrykids.backend.repository.ContactSectionConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactSectionService {

    private final ContactSectionConfigRepository configRepository;
    private final ContactItemRepository itemRepository;

    private static final Long CONFIG_ID = 1L;

    private static final String DEFAULT_MAP_URL =
            "https://www.google.com/maps?q=6.234331,80.195276&z=16&output=embed";

    // ── Config ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ContactSectionConfigResponse getConfig() {
        return toConfigResponse(getOrInitConfig());
    }

    @Transactional
    public ContactSectionConfigResponse updateConfig(ContactSectionConfigRequest request) {
        ContactSectionConfig config = getOrInitConfig();
        config.setSectionTitle(request.getSectionTitle().trim());
        config.setSubtitle(request.getSubtitle().trim());
        config.setMapEmbedUrl(request.getMapEmbedUrl().trim());
        ContactSectionConfig saved = configRepository.save(config);
        log.info("Contact section config updated.");
        return toConfigResponse(saved);
    }

    // ── Items — Admin ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ContactItemResponse> listItems() {
        getOrInitItems(); // ensure items exist
        return itemRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::toItemResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ContactItemResponse updateItem(Long id, ContactItemRequest request) {
        ContactItem item = itemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Contact item not found with id: " + id));
        item.setTitle(request.getTitle().trim());
        item.setContent(request.getContent().trim());
        ContactItem saved = itemRepository.save(item);
        log.info("Contact item updated: id={}, type={}", id, saved.getItemType());
        return toItemResponse(saved);
    }

    // ── Public ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PublicContactResponse getPublicContact() {
        ContactSectionConfigResponse config = toConfigResponse(getOrInitConfig());
        getOrInitItems(); // ensure items exist
        List<ContactItemResponse> items = itemRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::toItemResponse)
                .collect(Collectors.toList());
        return PublicContactResponse.builder()
                .config(config)
                .items(items)
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ContactSectionConfig getOrInitConfig() {
        return configRepository.findById(CONFIG_ID).orElseGet(() -> {
            ContactSectionConfig defaultConfig = ContactSectionConfig.builder()
                    .id(CONFIG_ID)
                    .sectionTitle("Get in Touch")
                    .subtitle("We\u2019d love to hear from you. Visit us or reach out any time.")
                    .mapEmbedUrl(DEFAULT_MAP_URL)
                    .build();
            return configRepository.save(defaultConfig);
        });
    }

    @Transactional
    public void getOrInitItems() {
        if (itemRepository.count() == 0) {
            itemRepository.save(ContactItem.builder()
                    .itemType(ContactItemType.ADDRESS)
                    .title("Address")
                    .content("123 Nursery Lane,\nSunshine District,\nColombo, Sri Lanka")
                    .displayOrder(0)
                    .build());
            itemRepository.save(ContactItem.builder()
                    .itemType(ContactItemType.PHONE)
                    .title("Phone")
                    .content("+94 914 387 117")
                    .displayOrder(1)
                    .build());
            itemRepository.save(ContactItem.builder()
                    .itemType(ContactItemType.EMAIL)
                    .title("Email")
                    .content("hello@merrykids.lk")
                    .displayOrder(2)
                    .build());
            itemRepository.save(ContactItem.builder()
                    .itemType(ContactItemType.OPENING_HOURS)
                    .title("Opening Hours")
                    .content("Mon \u2013 Fri: 7:30 AM \u2013 6:00 PM\nSaturday: 8:00 AM \u2013 1:00 PM")
                    .displayOrder(3)
                    .build());
            log.info("Contact items initialised with default values.");
        }
    }

    private ContactSectionConfigResponse toConfigResponse(ContactSectionConfig config) {
        return ContactSectionConfigResponse.builder()
                .id(config.getId())
                .sectionTitle(config.getSectionTitle())
                .subtitle(config.getSubtitle())
                .mapEmbedUrl(config.getMapEmbedUrl())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    private ContactItemResponse toItemResponse(ContactItem item) {
        return ContactItemResponse.builder()
                .id(item.getId())
                .itemType(item.getItemType())
                .title(item.getTitle())
                .content(item.getContent())
                .displayOrder(item.getDisplayOrder())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
