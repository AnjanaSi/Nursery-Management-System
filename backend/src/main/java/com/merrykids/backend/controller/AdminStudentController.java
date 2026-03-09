package com.merrykids.backend.controller;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.LevelAssigned;
import com.merrykids.backend.entity.StudentStatus;
import com.merrykids.backend.service.BulkTransitionService;
import com.merrykids.backend.service.FileStorageService;
import com.merrykids.backend.service.StudentService;
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
@RequestMapping("/api/v1/admin/students")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStudentController {

    private final StudentService studentService;
    private final BulkTransitionService bulkTransitionService;
    private final FileStorageService fileStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<StudentDetailResponse>> createStudent(
            @RequestPart("data") @Valid CreateStudentRequest request,
            @RequestPart(value = "profilePhoto", required = false) MultipartFile photo,
            @RequestParam(defaultValue = "false") boolean createAccounts) {
        StudentDetailResponse response = studentService.createStudent(request, photo, createAccounts);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<StudentSummaryResponse>>> listStudents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LevelAssigned level,
            @RequestParam(required = false) StudentStatus status,
            @RequestParam(required = false) String batchCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<StudentSummaryResponse> students = studentService.listStudents(
                search, level, status, batchCode, page, size);
        return ResponseEntity.ok(ApiResponse.success(students));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudentDetailResponse>> getStudent(@PathVariable Long id) {
        StudentDetailResponse response = studentService.getStudentById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<StudentDetailResponse>> updateStudent(
            @PathVariable Long id,
            @RequestPart("data") @Valid UpdateStudentRequest request,
            @RequestPart(value = "profilePhoto", required = false) MultipartFile photo,
            @RequestParam(defaultValue = "false") boolean createAccounts) {
        StudentDetailResponse response = studentService.updateStudent(id, request, photo, createAccounts);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable Long id) {
        studentService.softDeleteStudent(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<StudentDetailResponse>> changeStatus(
            @PathVariable Long id,
            @RequestBody @Valid StatusChangeRequest request) {
        StudentDetailResponse response = studentService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{studentId}/guardians/{guardianId}/account")
    public ResponseEntity<ApiResponse<GuardianResponse>> createGuardianAccount(
            @PathVariable Long studentId,
            @PathVariable Long guardianId) {
        GuardianResponse response = studentService.createGuardianAccount(studentId, guardianId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @DeleteMapping("/{studentId}/guardians/{guardianId}/account")
    public ResponseEntity<ApiResponse<GuardianResponse>> revokeGuardianAccount(
            @PathVariable Long studentId,
            @PathVariable Long guardianId) {
        GuardianResponse response = studentService.revokeGuardianAccount(studentId, guardianId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<Resource> getPhoto(@PathVariable Long id) {
        String photoPath = studentService.getStudentPhotoPath(id);
        Resource resource = fileStorageService.loadFileAsResource(photoPath);

        String contentType = determineContentType(resource.getFilename());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    @PostMapping("/bulk/promote")
    public ResponseEntity<ApiResponse<?>> bulkPromote(@RequestBody BulkPromoteRequest request) {
        if (request.isPreview()) {
            BulkPreviewResponse preview = bulkTransitionService.promotePreview();
            return ResponseEntity.ok(ApiResponse.success(preview));
        } else {
            BulkResultResponse result = bulkTransitionService.promoteExecute(request.getStudentIds());
            return ResponseEntity.ok(ApiResponse.success(result));
        }
    }

    @PostMapping("/bulk/exit")
    public ResponseEntity<ApiResponse<?>> bulkExit(@RequestBody BulkExitRequest request) {
        if (request.isPreview()) {
            BulkPreviewResponse preview = bulkTransitionService.exitPreview(request.getLevel());
            return ResponseEntity.ok(ApiResponse.success(preview));
        } else {
            BulkResultResponse result = bulkTransitionService.exitExecute(
                    request.getStudentIds(), request.getLeaveDate());
            return ResponseEntity.ok(ApiResponse.success(result));
        }
    }

    private String determineContentType(String filename) {
        if (filename == null) return "application/octet-stream";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }
}
