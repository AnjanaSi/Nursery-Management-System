package com.merrykids.backend.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MSc Integration Test — Public Website (Feature 3)
 * Approved test ID: INT-PUB-01
 *
 * Verifies that the public contact section endpoint is accessible without
 * authentication and returns the auto-initialised config + 4 contact items.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PublicWebsiteIntegrationMscTest {

    @Autowired MockMvc mockMvc;

    // ── INT-PUB-01 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("INT-PUB-01: GET /api/v1/public/contact without auth returns 200 with config and 4 contact items")
    void publicContact_noAuth_returns200WithConfigAndItems() throws Exception {
        // No Authorization header — endpoint must be publicly accessible
        mockMvc.perform(get("/api/v1/public/contact"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                // Config fields auto-initialised by ContactSectionService.getOrInitConfig()
                .andExpect(jsonPath("$.data.config.sectionTitle").isNotEmpty())
                .andExpect(jsonPath("$.data.config.subtitle").isNotEmpty())
                .andExpect(jsonPath("$.data.config.mapEmbedUrl").isNotEmpty())
                // 4 default items: ADDRESS, PHONE, EMAIL, OPENING_HOURS
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.items.length()").value(4));
    }
}
