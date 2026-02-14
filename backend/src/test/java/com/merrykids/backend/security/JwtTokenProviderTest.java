package com.merrykids.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;

    // Base64-encoded 32-byte key for HS256
    private static final String TEST_SECRET =
            "dGVzdC1zZWNyZXQta2V5LXRoYXQtaXMtbG9uZy1lbm91Z2gtZm9yLWhzMjU2LWFsZ29yaXRobQ==";

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(TEST_SECRET, 3600000);
    }

    @Test
    void generateToken_returnsNonNullString() {
        String token = tokenProvider.generateToken("test@example.com", "ADMIN");
        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void getEmailFromToken_returnsCorrectEmail() {
        String token = tokenProvider.generateToken("test@example.com", "ADMIN");
        String email = tokenProvider.getEmailFromToken(token);
        assertEquals("test@example.com", email);
    }

    @Test
    void validateToken_validToken_returnsTrue() {
        String token = tokenProvider.generateToken("test@example.com", "ADMIN");
        assertTrue(tokenProvider.validateToken(token));
    }

    @Test
    void validateToken_expiredToken_returnsFalse() {
        JwtTokenProvider expiredProvider = new JwtTokenProvider(TEST_SECRET, 0);
        String token = expiredProvider.generateToken("test@example.com", "ADMIN");
        assertFalse(tokenProvider.validateToken(token));
    }

    @Test
    void validateToken_tamperedToken_returnsFalse() {
        String token = tokenProvider.generateToken("test@example.com", "ADMIN");
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";
        assertFalse(tokenProvider.validateToken(tampered));
    }

    @Test
    void validateToken_nullToken_returnsFalse() {
        assertFalse(tokenProvider.validateToken(null));
    }
}
