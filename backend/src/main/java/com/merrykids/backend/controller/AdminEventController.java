package com.merrykids.backend.controller;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/events")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminEventController {

    private final EventService eventService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<EventDetailResponse>> createEvent(
            @RequestPart("data") @Valid CreateEventRequest request,
            @RequestPart(value = "photos", required = false) List<MultipartFile> photos,
            Authentication authentication) {
        List<MultipartFile> safePhotos = photos != null ? photos : List.of();
        EventDetailResponse resp = eventService.createEvent(request, safePhotos, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(resp));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<EventSummaryResponse>>> listEvents(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<EventSummaryResponse> result = eventService.listEventsAdmin(search, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventDetailResponse>> getEvent(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(eventService.getEventDetail(id)));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<EventDetailResponse>> updateEvent(
            @PathVariable Long id,
            @RequestPart("data") @Valid UpdateEventRequest request,
            @RequestPart(value = "photos", required = false) List<MultipartFile> photos,
            Authentication authentication) {
        List<MultipartFile> safePhotos = photos != null ? photos : List.of();
        EventDetailResponse resp = eventService.updateEvent(id, request, safePhotos, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable Long id) {
        eventService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<ApiResponse<Void>> bulkDelete(
            @RequestBody @Valid BulkDeleteRequest request) {
        eventService.bulkSoftDelete(request.getIds());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
