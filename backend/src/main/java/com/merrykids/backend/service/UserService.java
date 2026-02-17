package com.merrykids.backend.service;

import com.merrykids.backend.dto.CreateUserRequest;
import com.merrykids.backend.dto.CreateUserResponse;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.UserRepository;
import com.merrykids.backend.util.PasswordGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordGenerator passwordGenerator;
    private final EmailService emailService;

    public CreateUserResponse createUser(CreateUserRequest request) {
        if (request.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Cannot create users with ADMIN role");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        String tempPassword = passwordGenerator.generateTempPassword(12);

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(tempPassword))
                .role(request.getRole())
                .active(true)
                .mustChangePassword(true)
                .build();

        User saved = userRepository.save(user);

        emailService.sendWelcomeEmail(saved.getEmail(), tempPassword, saved.getRole().name());

        return new CreateUserResponse(
                saved.getId(),
                saved.getEmail(),
                saved.getRole().name(),
                saved.isActive(),
                saved.isMustChangePassword());
    }
}
