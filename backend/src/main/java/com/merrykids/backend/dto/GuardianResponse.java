package com.merrykids.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardianResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String nic;
    private String address;
    private String relationshipType;
    private String accountStatus;
    private String accountEmail;
}
