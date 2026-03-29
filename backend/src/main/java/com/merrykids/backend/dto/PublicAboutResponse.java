package com.merrykids.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicAboutResponse {

    private AboutSectionConfigResponse config;
    private List<PublicAboutCardResponse> cards;
}
