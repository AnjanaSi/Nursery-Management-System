package com.merrykids.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicAboutCardResponse {

    private Long id;
    private String title;
    private String description;
    private int displayOrder;
    private String imageUrl; // null when no image stored
}
