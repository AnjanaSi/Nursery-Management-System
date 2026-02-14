package com.merrykids.backend.service;

import com.merrykids.backend.dto.CreateUserRequest;
import com.merrykids.backend.dto.CreateUserResponse;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public CreateUserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .active(true)
                .build();

        User saved = userRepository.save(user);

        return new CreateUserResponse(
                saved.getId(),
                saved.getEmail(),
                saved.getRole().name(),
                saved.isActive());
    }
}
