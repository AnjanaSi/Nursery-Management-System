package com.merrykids.backend.repository;

import com.merrykids.backend.entity.PasswordResetToken;
import com.merrykids.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);
    void deleteByUser(User user);
    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}
