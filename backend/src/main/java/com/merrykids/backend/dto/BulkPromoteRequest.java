package com.merrykids.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class BulkPromoteRequest {
    private boolean preview;
    private List<Long> studentIds;
}
