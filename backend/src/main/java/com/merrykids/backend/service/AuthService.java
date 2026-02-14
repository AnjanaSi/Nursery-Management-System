package com.merrykids.backend.service;

import com.merrykids.backend.dto.LoginRequest;
import com.merrykids.backend.dto.LoginResponse;
import com.merrykids.backend.dto.UserInfoResponse;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.UserRepository;
import com.merrykids.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = jwtTokenProvider.generateToken(
                user.getEmail(), user.getRole().name());

        return new LoginResponse(token, user.getRole().name(), user.getEmail());
    }

    public UserInfoResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return new UserInfoResponse(user.getEmail(), user.getRole().name());
    }
}
