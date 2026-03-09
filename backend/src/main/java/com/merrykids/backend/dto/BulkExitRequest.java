package com.merrykids.backend.dto;

import com.merrykids.backend.entity.LevelAssigned;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class BulkExitRequest {
    private boolean preview;
    private LevelAssigned level;
    private List<Long> studentIds;
    private LocalDate leaveDate;
}
