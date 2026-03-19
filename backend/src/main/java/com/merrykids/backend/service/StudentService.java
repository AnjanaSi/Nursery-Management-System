package com.merrykids.backend.service;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.*;
import com.merrykids.backend.exception.NotFoundException;
import com.merrykids.backend.repository.*;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentService {

    private final StudentRepository studentRepository;
    private final GuardianRepository guardianRepository;
    private final StudentGuardianRepository studentGuardianRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final FileStorageService fileStorageService;

    @Transactional
    public StudentDetailResponse createStudent(CreateStudentRequest request, MultipartFile photo,
            boolean createAccounts) {
        validateEntryLevel(request.getEntryLevel());
        validateGuardianComposition(request.getGuardians());

        int entryYear = request.getEnrollmentDate().getYear();
        String batchCode = String.format("%02d%s", entryYear % 100, request.getEntryLevel().name());
        String admissionNo = generateAdmissionNo(batchCode);

        Student student = Student.builder()
                .admissionNo(admissionNo)
                .fullName(request.getFullName())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .entryYear(entryYear)
                .entryLevel(request.getEntryLevel())
                .currentLevel(request.getEntryLevel())
                .batchCode(batchCode)
                .status(StudentStatus.ACTIVE)
                .enrollmentDate(request.getEnrollmentDate())
                .notes(request.getNotes())
                .build();

        storePhoto(student, photo);
        Student saved = saveStudentWithRetry(student, batchCode);

        List<StudentGuardian> links = linkGuardians(saved, request.getGuardians());

        if (createAccounts) {
            createGuardianAccounts(links);
        }

        log.info("Student created: {} ({})", saved.getFullName(), saved.getAdmissionNo());
        return toDetail(saved, links);
    }

    @Transactional
    public StudentDetailResponse updateStudent(Long id, UpdateStudentRequest request, MultipartFile photo,
            boolean createAccounts) {
        Student student = findNonDeletedStudent(id);

        applyUpdates(student, request);

        if (photo != null && !photo.isEmpty()) {
            fileStorageService.deleteFile(student.getProfilePhotoPath());
            storePhoto(student, photo);
        }

        studentRepository.save(student);

        List<StudentGuardian> links;
        if (request.getGuardians() != null && !request.getGuardians().isEmpty()) {
            validateGuardianComposition(request.getGuardians());
            links = reconcileGuardians(student, request.getGuardians());
        } else {
            links = studentGuardianRepository.findByStudentId(student.getId());
        }

        if (createAccounts) {
            createGuardianAccounts(links);
        }

        log.info("Student updated: {} ({})", student.getFullName(), student.getAdmissionNo());
        return toDetail(student, links);
    }

    public StudentDetailResponse getStudentById(Long id) {
        Student student = findNonDeletedStudent(id);
        List<StudentGuardian> links = studentGuardianRepository.findByStudentId(student.getId());
        return toDetail(student, links);
    }

    public String getStudentPhotoPath(Long id) {
        Student student = findNonDeletedStudent(id);
        if (student.getProfilePhotoPath() == null) {
            throw new NotFoundException("No photo available for this student");
        }
        return student.getProfilePhotoPath();
    }

    public Page<StudentSummaryResponse> listStudents(String search, LevelAssigned level,
            StudentStatus status, String batchCode,
            int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Specification<Student> spec = buildSpecification(search, level, status, batchCode);
        return studentRepository.findAll(spec, pageable).map(this::toSummary);
    }

    @Transactional
    public void softDeleteStudent(Long id) {
        Student student = findNonDeletedStudent(id);
        student.setDeleted(true);
        studentRepository.save(student);
        checkAndDisableGuardians(student.getId());
        log.info("Student soft-deleted: {} ({})", student.getFullName(), student.getAdmissionNo());
    }

    @Transactional
    public StudentDetailResponse changeStatus(Long id, StatusChangeRequest request) {
        Student student = findNonDeletedStudent(id);

        if (request.getStatus() == StudentStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot change status back to ACTIVE");
        }

        student.setStatus(request.getStatus());
        student.setLeaveDate(request.getLeaveDate());
        studentRepository.save(student);

        checkAndDisableGuardians(student.getId());

        log.info("Student status changed to {}: {} ({})", request.getStatus(),
                student.getFullName(), student.getAdmissionNo());

        List<StudentGuardian> links = studentGuardianRepository.findByStudentId(student.getId());
        return toDetail(student, links);
    }

    @Transactional
    public GuardianResponse createGuardianAccount(Long studentId, Long guardianId) {
        Student student = findNonDeletedStudent(studentId);
        List<StudentGuardian> links = studentGuardianRepository.findByStudentId(student.getId());

        StudentGuardian link = links.stream()
                .filter(sg -> sg.getGuardian().getId().equals(guardianId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Guardian not linked to this student"));

        Guardian guardian = link.getGuardian();

        if (guardian.getEmail() == null || guardian.getEmail().isBlank()) {
            throw new IllegalArgumentException("Guardian has no email address. Cannot create account.");
        }

        if (guardian.getUser() != null && guardian.getUser().isActive()) {
            throw new IllegalArgumentException("Guardian already has an active portal account");
        }

        // Always provision via UserService using guardian's current contact email.
        // UserService enforces the email reuse rule: active users block, disabled users are reactivated
        // (and their role updated if needed). This avoids bypassing role/active checks.
        CreateUserRequest userRequest = new CreateUserRequest();
        userRequest.setEmail(guardian.getEmail());
        userRequest.setRole(Role.PARENT);
        CreateUserResponse userResponse = userService.createUser(userRequest);

        User user = userRepository.findById(userResponse.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));
        guardian.setUser(user);
        guardianRepository.save(guardian);

        log.info("Portal account created/reused for guardian: {} ({})", guardian.getFullName(), guardian.getEmail());
        return toGuardianResponse(link);
    }

    @Transactional
    public GuardianResponse revokeGuardianAccount(Long studentId, Long guardianId) {
        Student student = findNonDeletedStudent(studentId);
        List<StudentGuardian> links = studentGuardianRepository.findByStudentId(student.getId());

        StudentGuardian link = links.stream()
                .filter(sg -> sg.getGuardian().getId().equals(guardianId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Guardian not linked to this student"));

        Guardian guardian = link.getGuardian();

        if (guardian.getUser() == null) {
            throw new IllegalArgumentException("Guardian does not have a portal account");
        }

        // Disable user but do NOT unlink guardian.userId
        guardian.getUser().setActive(false);
        userRepository.save(guardian.getUser());

        log.info("Portal access revoked for guardian: {} ({})", guardian.getFullName(), guardian.getEmail());
        return toGuardianResponse(link);
    }

    // ---- Private Helpers ----

    private void validateEntryLevel(LevelAssigned level) {
        if (level != LevelAssigned.LKG1 && level != LevelAssigned.UKG1) {
            throw new IllegalArgumentException("Entry level must be LKG1 or UKG1");
        }
    }

    private void validateGuardianComposition(List<GuardianDto> guardians) {
        if (guardians.size() < 2 || guardians.size() > 3) {
            throw new IllegalArgumentException("Must provide 2-3 guardians");
        }

        boolean hasFather = guardians.stream()
                .anyMatch(g -> g.getRelationshipType() == GuardianRelationshipType.FATHER);
        boolean hasMother = guardians.stream()
                .anyMatch(g -> g.getRelationshipType() == GuardianRelationshipType.MOTHER);

        if (!hasFather || !hasMother) {
            throw new IllegalArgumentException("Father and Mother guardians are required");
        }

        long distinctTypes = guardians.stream()
                .map(GuardianDto::getRelationshipType)
                .distinct().count();
        if (distinctTypes != guardians.size()) {
            throw new IllegalArgumentException("Duplicate relationship types not allowed");
        }
    }

    private String generateAdmissionNo(String batchCode) {
        long count = studentRepository.countByBatchCode(batchCode);
        return String.format("MK-%s-%04d", batchCode, count + 1);
    }

    private Student saveStudentWithRetry(Student student, String batchCode) {
        int maxRetries = 3;
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return studentRepository.save(student);
            } catch (DataIntegrityViolationException e) {
                if (e.getMessage() != null && e.getMessage().contains("admission_no")) {
                    long count = studentRepository.countByBatchCode(batchCode);
                    student.setAdmissionNo(
                            String.format("MK-%s-%04d", batchCode, count + 1 + attempt + 1));
                } else {
                    throw e;
                }
            }
        }
        return studentRepository.save(student);
    }

    private List<StudentGuardian> linkGuardians(Student student, List<GuardianDto> guardianDtos) {
        List<StudentGuardian> links = new ArrayList<>();

        for (GuardianDto dto : guardianDtos) {
            Guardian guardian = findOrCreateGuardian(dto);

            StudentGuardian link = StudentGuardian.builder()
                    .student(student)
                    .guardian(guardian)
                    .relationshipType(dto.getRelationshipType())
                    .build();
            links.add(studentGuardianRepository.save(link));
        }

        return links;
    }

    private Guardian findOrCreateGuardian(GuardianDto dto) {
        // Try match by email (case-insensitive) first
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            Guardian existing = guardianRepository
                    .findByEmailIgnoreCaseAndIsDeletedFalse(dto.getEmail())
                    .orElse(null);
            if (existing != null) {
                // Update fields from dto
                existing.setFullName(dto.getFullName());
                existing.setPhone(dto.getPhone());
                if (dto.getNic() != null)
                    existing.setNic(dto.getNic());
                if (dto.getAddress() != null)
                    existing.setAddress(dto.getAddress());
                return guardianRepository.save(existing);
            }
        }

        // Try match by NIC if provided
        if (dto.getNic() != null && !dto.getNic().isBlank()) {
            Guardian existing = guardianRepository
                    .findByNicAndIsDeletedFalse(dto.getNic())
                    .orElse(null);
            if (existing != null) {
                existing.setFullName(dto.getFullName());
                existing.setPhone(dto.getPhone());
                if (dto.getEmail() != null)
                    existing.setEmail(dto.getEmail());
                if (dto.getAddress() != null)
                    existing.setAddress(dto.getAddress());
                return guardianRepository.save(existing);
            }
        }

        // Create new guardian
        Guardian guardian = Guardian.builder()
                .fullName(dto.getFullName())
                .email(dto.getEmail() != null && !dto.getEmail().isBlank() ? dto.getEmail() : null)
                .phone(dto.getPhone())
                .nic(dto.getNic())
                .address(dto.getAddress())
                .build();
        return guardianRepository.save(guardian);
    }

    @Transactional
    List<StudentGuardian> reconcileGuardians(Student student, List<GuardianDto> guardianDtos) {
        // Remove existing links
        studentGuardianRepository.deleteByStudentId(student.getId());
        studentGuardianRepository.flush();

        List<StudentGuardian> newLinks = new ArrayList<>();
        for (GuardianDto dto : guardianDtos) {
            Guardian guardian;

            if (dto.getId() != null) {
                // Update existing guardian
                guardian = guardianRepository.findByIdAndIsDeletedFalse(dto.getId())
                        .orElseThrow(() -> new NotFoundException("Guardian not found: " + dto.getId()));

                // Handle email change with login update
                if (dto.getEmail() != null && !dto.getEmail().equalsIgnoreCase(guardian.getEmail())) {
                    if (guardian.getUser() != null && Boolean.TRUE.equals(dto.getUpdateLoginEmail())) {
                        // Only active users reserve an email — disabled users do not block email updates
                        if (userRepository.existsByEmailIgnoreCaseAndActiveTrueAndIdNot(dto.getEmail(), guardian.getUser().getId())) {
                            throw new IllegalArgumentException(
                                    "Email '" + dto.getEmail()
                                            + "' is already used by another active user account");
                        }
                        guardian.getUser().setEmail(dto.getEmail());
                        userRepository.save(guardian.getUser());
                    }
                    guardian.setEmail(dto.getEmail());
                }

                guardian.setFullName(dto.getFullName());
                guardian.setPhone(dto.getPhone());
                if (dto.getNic() != null)
                    guardian.setNic(dto.getNic());
                if (dto.getAddress() != null)
                    guardian.setAddress(dto.getAddress());
                guardian = guardianRepository.save(guardian);
            } else {
                guardian = findOrCreateGuardian(dto);
            }

            StudentGuardian link = StudentGuardian.builder()
                    .student(student)
                    .guardian(guardian)
                    .relationshipType(dto.getRelationshipType())
                    .build();
            newLinks.add(studentGuardianRepository.save(link));
        }

        return newLinks;
    }

    private void createGuardianAccounts(List<StudentGuardian> links) {
        for (StudentGuardian link : links) {
            Guardian guardian = link.getGuardian();

            if (guardian.getEmail() == null || guardian.getEmail().isBlank()) {
                continue; // Skip guardians without email
            }

            if (guardian.getUser() != null && guardian.getUser().isActive()) {
                continue; // Already has active account
            }

            try {
                // Always provision via UserService using guardian's current contact email.
                // UserService enforces the email reuse rule: active users block, disabled users
                // are reactivated (role updated if needed). Guardian.user is always updated to
                // the provisioned user so the link stays accurate.
                CreateUserRequest userRequest = new CreateUserRequest();
                userRequest.setEmail(guardian.getEmail());
                userRequest.setRole(Role.PARENT);
                CreateUserResponse userResponse = userService.createUser(userRequest);

                User user = userRepository.findById(userResponse.getId())
                        .orElseThrow(() -> new NotFoundException("User not found"));
                guardian.setUser(user);
                guardianRepository.save(guardian);
                log.info("Account created/reused for guardian: {}", guardian.getEmail());
            } catch (Exception e) {
                log.warn("Failed to create account for guardian {}: {}", guardian.getEmail(), e.getMessage());
            }
        }
    }

    void checkAndDisableGuardians(Long studentId) {
        List<StudentGuardian> links = studentGuardianRepository.findByStudentId(studentId);
        for (StudentGuardian link : links) {
            Guardian guardian = link.getGuardian();
            if (guardian.getUser() == null)
                continue;

            long activeStudentCount = studentGuardianRepository
                    .countActiveStudentsByGuardianId(guardian.getId());

            if (activeStudentCount == 0) {
                guardian.getUser().setActive(false);
                userRepository.save(guardian.getUser());
                log.info("Disabled portal access for guardian {} — no active students remain",
                        guardian.getEmail());
            }
        }
    }

    private void storePhoto(Student student, MultipartFile photo) {
        if (photo != null && !photo.isEmpty()) {
            FileStorageService.StoredFile stored = fileStorageService.storeImage(photo, "students/photos");
            student.setProfilePhotoOriginalName(stored.originalName());
            student.setProfilePhotoStoredName(stored.storedName());
            student.setProfilePhotoPath(stored.path());
        }
    }

    private void applyUpdates(Student student, UpdateStudentRequest request) {
        if (request.getFullName() != null)
            student.setFullName(request.getFullName());
        if (request.getDateOfBirth() != null)
            student.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null)
            student.setGender(request.getGender());
        if (request.getCurrentLevel() != null)
            student.setCurrentLevel(request.getCurrentLevel());
        if (request.getEnrollmentDate() != null)
            student.setEnrollmentDate(request.getEnrollmentDate());
        if (request.getNotes() != null)
            student.setNotes(request.getNotes());
    }

    private Student findNonDeletedStudent(Long id) {
        return studentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Student not found"));
    }

    private Specification<Student> buildSpecification(String search, LevelAssigned level,
            StudentStatus status, String batchCode) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("isDeleted"), false));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (level != null) {
                predicates.add(cb.equal(root.get("currentLevel"), level));
            }
            if (batchCode != null && !batchCode.isBlank()) {
                predicates.add(cb.equal(root.get("batchCode"), batchCode));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";

                // Search by student name and admissionNo
                // Also search guardian name/email/phone via subquery
                jakarta.persistence.criteria.Subquery<Long> guardianSubquery = query.subquery(Long.class);
                jakarta.persistence.criteria.Root<StudentGuardian> sgRoot = guardianSubquery.from(StudentGuardian.class);
                Join<Object, Object> gJoin = sgRoot.join("guardian", JoinType.INNER);
                guardianSubquery.select(sgRoot.get("student").get("id"))
                        .where(cb.and(
                                cb.equal(sgRoot.get("student").get("id"), root.get("id")),
                                cb.or(
                                        cb.like(cb.lower(gJoin.get("fullName")), pattern),
                                        cb.like(cb.lower(gJoin.get("email")), pattern),
                                        cb.like(cb.lower(gJoin.get("phone")), pattern))));

                Predicate searchPredicate = cb.or(
                        cb.like(cb.lower(root.get("fullName")), pattern),
                        cb.like(cb.lower(root.get("admissionNo")), pattern),
                        cb.exists(guardianSubquery));
                predicates.add(searchPredicate);
            }

            if (!Long.class.equals(query.getResultType()) && !long.class.equals(query.getResultType())) {
                Expression<Integer> activeRank = cb.<Integer>selectCase()
                        .when(cb.equal(root.get("status"), StudentStatus.ACTIVE), 1)
                        .otherwise(0);
                query.orderBy(
                        cb.desc(activeRank),
                        cb.desc(root.get("createdAt")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private StudentSummaryResponse toSummary(Student student) {
        List<StudentGuardian> links = studentGuardianRepository.findByStudentId(student.getId());
        String guardianNames = links.stream()
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

    private StudentDetailResponse toDetail(Student student, List<StudentGuardian> links) {
        List<GuardianResponse> guardianResponses = links.stream()
                .map(this::toGuardianResponse)
                .collect(Collectors.toList());

        return StudentDetailResponse.builder()
                .id(student.getId())
                .admissionNo(student.getAdmissionNo())
                .fullName(student.getFullName())
                .dateOfBirth(student.getDateOfBirth())
                .gender(student.getGender().name())
                .entryYear(student.getEntryYear())
                .entryLevel(student.getEntryLevel().name())
                .currentLevel(student.getCurrentLevel().name())
                .batchCode(student.getBatchCode())
                .status(student.getStatus().name())
                .enrollmentDate(student.getEnrollmentDate())
                .leaveDate(student.getLeaveDate())
                .hasPhoto(student.getProfilePhotoPath() != null)
                .notes(student.getNotes())
                .guardians(guardianResponses)
                .createdAt(student.getCreatedAt())
                .updatedAt(student.getUpdatedAt())
                .build();
    }

    private GuardianResponse toGuardianResponse(StudentGuardian link) {
        Guardian guardian = link.getGuardian();
        return GuardianResponse.builder()
                .id(guardian.getId())
                .fullName(guardian.getFullName())
                .email(guardian.getEmail())
                .phone(guardian.getPhone())
                .nic(guardian.getNic())
                .address(guardian.getAddress())
                .relationshipType(link.getRelationshipType().name())
                .accountStatus(deriveAccountStatus(guardian))
                .accountEmail(guardian.getUser() != null ? guardian.getUser().getEmail() : null)
                .build();
    }

    private String deriveAccountStatus(Guardian guardian) {
        if (guardian.getUser() == null) {
            return "NO_ACCOUNT";
        }
        return guardian.getUser().isActive() ? "ACTIVE" : "DISABLED";
    }
}
