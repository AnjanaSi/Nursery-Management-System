package com.merrykids.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherListItemResponse {

    private Long id;
    private String employmentId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String levelAssigned;
    private String designation;
    private String employmentStatus;
    private String accountStatus;
}
