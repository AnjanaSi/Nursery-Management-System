package com.merrykids.backend.dto;

import com.merrykids.backend.entity.Designation;
import com.merrykids.backend.entity.EmploymentStatus;
import com.merrykids.backend.entity.LevelAssigned;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TeacherProfileResponse {
    private Long id;
    private String fullName;
    private String email;
    private String employmentId;
    private Designation designation;
    private LevelAssigned levelAssigned;
    private EmploymentStatus employmentStatus;
}
