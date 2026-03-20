package com.merrykids.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminProfileResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private String nic;
    private LocalDate dateOfBirth;
    private String adminType;
    private String notes;

    // Derived account info
    private String accountStatus;  // NO_ACCOUNT | ACTIVE | DISABLED
    private String accountEmail;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
