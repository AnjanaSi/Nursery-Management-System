package com.merrykids.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventPhotoResponse {

    private Long id;
    private String originalFileName;
    private String imageUrl;
    private int displayOrder;
}
