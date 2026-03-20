package com.merrykids.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminProfileListItemResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String adminType;
    private String accountStatus;  // NO_ACCOUNT | ACTIVE | DISABLED
    private LocalDateTime createdAt;
}
