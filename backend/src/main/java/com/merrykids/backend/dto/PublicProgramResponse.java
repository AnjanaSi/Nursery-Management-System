package com.merrykids.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PublicProgramResponse {
    private ProgramSectionConfigResponse config;
    private List<PublicProgramCardResponse> cards;
}
