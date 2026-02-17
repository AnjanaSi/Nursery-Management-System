package com.merrykids.backend.service;

import com.merrykids.backend.dto.ForgotPasswordRequest;
import com.merrykids.backend.dto.MessageResponse;
import com.merrykids.backend.dto.ResetPasswordRequest;
import com.merrykids.backend.entity.PasswordResetToken;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.exception.InvalidTokenException;
import com.merrykids.backend.repository.PasswordResetTokenRepository;
import com.merrykids.backend.repository.UserRepository;
import com.merrykids.backend.util.TokenGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final TokenGenerator tokenGenerator;

    private static final int TOKEN_EXPIRY_MINUTES = 30;

    @Transactional
    public MessageResponse requestPasswordReset(ForgotPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isPresent()) {
            User user = userOpt.get();

            if (user.isActive()) {
                tokenRepository.deleteByUser(user);

                String rawToken = tokenGenerator.generateResetToken();
                String tokenHash = tokenGenerator.hashToken(rawToken);

                PasswordResetToken resetToken = PasswordResetToken.builder()
                        .tokenHash(tokenHash)
                        .user(user)
                        .expiresAt(LocalDateTime.now().plusMinutes(TOKEN_EXPIRY_MINUTES))
                        .build();
                tokenRepository.save(resetToken);

                emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
            }
        }

        return new MessageResponse(
                "If an account with that email exists, a password reset link has been sent");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        String tokenHash = tokenGenerator.hashToken(request.getToken());

        PasswordResetToken resetToken = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired reset token"));

        if (resetToken.getUsedAt() != null) {
            throw new InvalidTokenException("This reset token has already been used");
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Reset token has expired");
        }

        User user = resetToken.getUser();
        if (!user.isActive()) {
            throw new InvalidTokenException("Account is not active");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);

        resetToken.setUsedAt(LocalDateTime.now());
        tokenRepository.save(resetToken);

        return new MessageResponse("Password has been reset successfully");
    }
}
