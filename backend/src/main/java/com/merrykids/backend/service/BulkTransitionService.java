package com.merrykids.backend.service;

import com.merrykids.backend.dto.BulkPreviewResponse;
import com.merrykids.backend.dto.BulkResultResponse;
import com.merrykids.backend.dto.StudentSummaryResponse;
import com.merrykids.backend.entity.LevelAssigned;
import com.merrykids.backend.entity.Student;
import com.merrykids.backend.entity.StudentStatus;
import com.merrykids.backend.exception.NotFoundException;
import com.merrykids.backend.repository.StudentGuardianRepository;
import com.merrykids.backend.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BulkTransitionService {

    private final StudentRepository studentRepository;
    private final StudentGuardianRepository studentGuardianRepository;
    private final StudentService studentService;

    public BulkPreviewResponse promotePreview() {
        List<Student> eligible = studentRepository
                .findByStatusAndCurrentLevelAndIsDeletedFalse(StudentStatus.ACTIVE, LevelAssigned.LKG1);

        List<StudentSummaryResponse> summaries = eligible.stream()
                .map(this::toSummary)
                .collect(Collectors.toList());

        return BulkPreviewResponse.builder()
                .eligibleCount(summaries.size())
                .students(summaries)
                .build();
    }

    @Transactional
    public BulkResultResponse promoteExecute(List<Long> studentIds) {
        if (studentIds == null || studentIds.isEmpty()) {
            throw new IllegalArgumentException("No students selected for promotion");
        }

        int processed = 0;
        for (Long id : studentIds) {
            Student student = studentRepository.findByIdAndIsDeletedFalse(id)
                    .orElseThrow(() -> new NotFoundException("Student not found: " + id));

            if (student.getStatus() != StudentStatus.ACTIVE) {
                log.warn("Skipping non-ACTIVE student for promotion: {}", student.getAdmissionNo());
                continue;
            }
            if (student.getCurrentLevel() != LevelAssigned.LKG1) {
                log.warn("Skipping non-LKG1 student for promotion: {}", student.getAdmissionNo());
                continue;
            }

            student.setCurrentLevel(LevelAssigned.UKG2);
            studentRepository.save(student);
            processed++;
        }

        log.info("Bulk promotion completed: {} students promoted LKG1 -> UKG2", processed);
        return BulkResultResponse.builder()
                .processedCount(processed)
                .message(processed + " students promoted from LKG1 to UKG2")
                .build();
    }

    public BulkPreviewResponse exitPreview(LevelAssigned level) {
        if (level == null) {
            throw new IllegalArgumentException("Level is required for exit preview");
        }

        List<Student> eligible = studentRepository
                .findByStatusAndCurrentLevelAndIsDeletedFalse(StudentStatus.ACTIVE, level);

        List<StudentSummaryResponse> summaries = eligible.stream()
                .map(this::toSummary)
                .collect(Collectors.toList());

        return BulkPreviewResponse.builder()
                .eligibleCount(summaries.size())
                .students(summaries)
                .build();
    }

    @Transactional
    public BulkResultResponse exitExecute(List<Long> studentIds, LocalDate leaveDate) {
        if (studentIds == null || studentIds.isEmpty()) {
            throw new IllegalArgumentException("No students selected for exit");
        }
        if (leaveDate == null) {
            throw new IllegalArgumentException("Leave date is required");
        }

        int processed = 0;
        for (Long id : studentIds) {
            Student student = studentRepository.findByIdAndIsDeletedFalse(id)
                    .orElseThrow(() -> new NotFoundException("Student not found: " + id));

            if (student.getStatus() != StudentStatus.ACTIVE) {
                log.warn("Skipping non-ACTIVE student for exit: {}", student.getAdmissionNo());
                continue;
            }

            student.setStatus(StudentStatus.GRADUATED);
            student.setLeaveDate(leaveDate);
            studentRepository.save(student);
            processed++;

            studentService.checkAndDisableGuardians(student.getId());
        }

        log.info("Bulk exit completed: {} students graduated", processed);
        return BulkResultResponse.builder()
                .processedCount(processed)
                .message(processed + " students marked as GRADUATED")
                .build();
    }

    private StudentSummaryResponse toSummary(Student student) {
        String guardianNames = studentGuardianRepository.findByStudentId(student.getId()).stream()
                .map(sg -> sg.getGuardian().getFullName())
                .collect(Collectors.joining(", "));

        return StudentSummaryResponse.builder()
                .id(student.getId())
                .admissionNo(student.getAdmissionNo())
                .fullName(student.getFullName())
                .currentLevel(student.getCurrentLevel().name())
                .batchCode(student.getBatchCode())
                .status(student.getStatus().name())
                .hasPhoto(student.getProfilePhotoPath() != null)
                .guardianNames(guardianNames)
                .createdAt(student.getCreatedAt())
                .build();
    }
}
