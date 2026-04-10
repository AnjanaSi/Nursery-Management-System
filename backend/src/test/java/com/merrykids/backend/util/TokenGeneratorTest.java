package com.merrykids.backend.util;

import org.junit.jupiter.api.*;

import static org.assertj.core.api.Assertions.*;

/**
 * White Box unit tests for TokenGenerator.
 * Verifies cryptographic token generation and SHA-256 hashing behaviour.
 */
class TokenGeneratorTest {

    private final TokenGenerator tokenGenerator = new TokenGenerator();

    @Test
    @DisplayName("WB-TKN-01: generateResetToken returns non-null, non-blank string")
    void generateResetToken_returnsNonBlank() {
        assertThat(tokenGenerator.generateResetToken()).isNotNull().isNotBlank();
    }

    @Test
    @DisplayName("WB-TKN-02: Two consecutive calls produce different tokens (randomness check)")
    void generateResetToken_consecutiveCalls_produceDifferentValues() {
        String t1 = tokenGenerator.generateResetToken();
        String t2 = tokenGenerator.generateResetToken();
        assertThat(t1).isNotEqualTo(t2);
    }

    @Test
    @DisplayName("WB-TKN-03: hashToken is deterministic — same input always produces same hash")
    void hashToken_sameInput_alwaysSameHash() {
        String h1 = tokenGenerator.hashToken("test-token");
        String h2 = tokenGenerator.hashToken("test-token");
        assertThat(h1).isEqualTo(h2);
    }

    @Test
    @DisplayName("WB-TKN-04: hashToken produces different output for different inputs (collision resistance)")
    void hashToken_differentInputs_differentHashes() {
        assertThat(tokenGenerator.hashToken("token-a"))
                .isNotEqualTo(tokenGenerator.hashToken("token-b"));
    }

    @Test
    @DisplayName("WB-TKN-05: hashToken output is exactly 64 hex characters (SHA-256 = 32 bytes)")
    void hashToken_outputIs64HexChars() {
        String hash = tokenGenerator.hashToken("any-token-value");
        assertThat(hash).hasSize(64).matches("[0-9a-f]+");
    }

    @Test
    @DisplayName("WB-TKN-06: Hash differs from the raw token (one-way function)")
    void hashToken_hashNotEqualToRaw() {
        String raw = tokenGenerator.generateResetToken();
        assertThat(tokenGenerator.hashToken(raw)).isNotEqualTo(raw);
    }

    @Test
    @DisplayName("WB-TKN-07: Generated token is URL-safe (no + or / characters from Base64URL)")
    void generateResetToken_isUrlSafe() {
        for (int i = 0; i < 20; i++) {
            String token = tokenGenerator.generateResetToken();
            assertThat(token).doesNotContain("+", "/", "=");
        }
    }
}
