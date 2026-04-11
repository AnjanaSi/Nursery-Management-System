package com.merrykids.backend.dto;

import com.merrykids.backend.entity.ContactItemType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactItemResponse {

    private Long id;
    private ContactItemType itemType;
    private String title;
    private String content;
    private int displayOrder;
    private LocalDateTime updatedAt;
}
