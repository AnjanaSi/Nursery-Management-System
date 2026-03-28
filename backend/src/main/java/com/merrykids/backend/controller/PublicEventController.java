package com.merrykids.backend.controller;

import com.merrykids.backend.dto.ApiResponse;
import com.merrykids.backend.dto.EventDetailResponse;
import com.merrykids.backend.dto.EventSummaryResponse;
import com.merrykids.backend.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/events")
@RequiredArgsConstructor
public class PublicEventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<EventSummaryResponse>>> listEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {
        return ResponseEntity.ok(ApiResponse.success(eventService.listEventsPublic(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventDetailResponse>> getEvent(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(eventService.getEventDetail(id)));
    }

    @GetMapping("/photos/{photoId}/image")
    public ResponseEntity<Resource> servePhoto(@PathVariable Long photoId) {
        EventService.PhotoResource pr = eventService.getPhotoResource(photoId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(pr.contentType()))
                .body(pr.resource());
    }
}
