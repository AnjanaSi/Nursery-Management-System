package com.merrykids.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CreateUserResponse {
    private Long id;
    private String email;
    private String role;
    private boolean active;
    private boolean mustChangePassword;
}
