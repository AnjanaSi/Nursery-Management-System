package com.merrykids.backend.controller;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.Designation;
import com.merrykids.backend.entity.EmploymentStatus;
import com.merrykids.backend.entity.LevelAssigned;
import com.merrykids.backend.exception.NotFoundException;
import com.merrykids.backend.service.FileStorageService;
import com.merrykids.backend.service.TeacherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/staff")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStaffController {

    private final TeacherService teacherService;
    private final FileStorageService fileStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TeacherResponse>> createTeacher(
            @RequestPart("data") @Valid TeacherCreateRequest request,
            @RequestPart(value = "profilePhoto", required = false) MultipartFile photo) {
        TeacherResponse response = teacherService.createTeacher(request, photo);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PostMapping(value = "/with-account", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TeacherResponse>> createTeacherWithAccount(
            @RequestPart("data") @Valid TeacherCreateRequest request,
            @RequestPart(value = "profilePhoto", required = false) MultipartFile photo) {
        TeacherResponse response = teacherService.createTeacherWithAccount(request, photo);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TeacherListItemResponse>>> listTeachers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) EmploymentStatus status,
            @RequestParam(required = false) LevelAssigned level,
            @RequestParam(required = false) Designation designation,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<TeacherListItemResponse> teachers = teacherService.listTeachers(
                search, status, level, designation, page, size);
        return ResponseEntity.ok(ApiResponse.success(teachers));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeacherResponse>> getTeacher(@PathVariable Long id) {
        TeacherResponse response = teacherService.getTeacherById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TeacherResponse>> updateTeacher(
            @PathVariable Long id,
            @RequestPart("data") @Valid TeacherUpdateRequest request,
            @RequestPart(value = "profilePhoto", required = false) MultipartFile photo) {
        TeacherResponse response = teacherService.updateTeacher(id, request, photo);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTeacher(@PathVariable Long id) {
        teacherService.softDeleteTeacher(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{teacherId}/account")
    public ResponseEntity<ApiResponse<TeacherResponse>> createAccount(
            @PathVariable Long teacherId) {
        TeacherResponse response = teacherService.createAccountForTeacher(teacherId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @DeleteMapping("/{teacherId}/account")
    public ResponseEntity<ApiResponse<TeacherResponse>> revokeAccount(
            @PathVariable Long teacherId) {
        TeacherResponse response = teacherService.revokeAccountForTeacher(teacherId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<Resource> getPhoto(@PathVariable Long id) {
        TeacherResponse teacher = teacherService.getTeacherById(id);
        if (!teacher.isHasPhoto()) {
            throw new NotFoundException("No photo available for this teacher");
        }

        Resource resource = fileStorageService.loadFileAsResource(
                getPhotoPath(id));

        String contentType = determineContentType(resource.getFilename());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    private String getPhotoPath(Long id) {
        return teacherService.getTeacherPhotoPath(id);
    }

    private String determineContentType(String filename) {
        if (filename == null) return "application/octet-stream";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }
}
