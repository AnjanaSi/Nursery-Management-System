package com.merrykids.backend.service;

import com.merrykids.backend.dto.*;
import com.merrykids.backend.entity.*;
import com.merrykids.backend.exception.DuplicateEmailException;
import com.merrykids.backend.exception.NotFoundException;
import com.merrykids.backend.repository.TeacherRepository;
import com.merrykids.backend.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import jakarta.persistence.criteria.Expression;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final FileStorageService fileStorageService;

    @Transactional
    public TeacherResponse createTeacher(TeacherCreateRequest request, MultipartFile photo) {
        validateEmailUniqueness(request.getEmail(), null);

        String employmentId = generateEmploymentId();

        Teacher teacher = Teacher.builder()
                .employmentId(employmentId)
                .fullName(request.getFullName())
                .dateOfBirth(request.getDateOfBirth())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .permanentAddress(request.getPermanentAddress())
                .currentAddress(request.getCurrentAddress())
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactNumber(request.getEmergencyContactNumber())
                .maritalStatus(request.getMaritalStatus())
                .dateOfJoining(request.getDateOfJoining())
                .levelAssigned(request.getLevelAssigned())
                .designation(request.getDesignation())
                .employmentStatus(request.getEmploymentStatus() != null
                        ? request.getEmploymentStatus()
                        : EmploymentStatus.ACTIVE)
                .notes(request.getNotes())
                .build();

        storePhoto(teacher, photo);

        Teacher saved = saveWithRetry(teacher);
        log.info("Teacher created: {} ({})", saved.getFullName(), saved.getEmploymentId());
        return toResponse(saved);
    }

    @Transactional
    public TeacherResponse createTeacherWithAccount(TeacherCreateRequest request, MultipartFile photo) {
        TeacherResponse response = createTeacher(request, photo);

        Teacher teacher = teacherRepository.findByIdAndIsDeletedFalse(response.getId())
                .orElseThrow(() -> new NotFoundException("Teacher not found"));

        CreateUserRequest userRequest = new CreateUserRequest();
        userRequest.setEmail(teacher.getEmail());
        userRequest.setRole(Role.TEACHER);
        CreateUserResponse userResponse = userService.createUser(userRequest);

        User user = userRepository.findById(userResponse.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));
        teacher.setUser(user);
        teacherRepository.save(teacher);

        log.info("Teacher account created for: {} ({})", teacher.getFullName(), teacher.getEmail());
        return toResponse(teacher);
    }

    // @Transactional
    // public TeacherResponse updateTeacher(Long id, TeacherUpdateRequest request,
    // MultipartFile photo) {
    // Teacher teacher = findNonDeletedTeacher(id);

    // if (request.getEmail() != null &&
    // !request.getEmail().equals(teacher.getEmail())) {
    // validateEmailUniqueness(request.getEmail(), id);
    // }

    // applyUpdates(teacher, request);

    // if (photo != null && !photo.isEmpty()) {
    // fileStorageService.deleteFile(teacher.getProfilePhotoPath());
    // storePhoto(teacher, photo);
    // }

    // if (request.getEmploymentStatus() != null &&
    // isTerminalStatus(request.getEmploymentStatus())) {
    // revokeAccess(teacher);
    // }

    // teacherRepository.save(teacher);
    // log.info("Teacher updated: {} ({})", teacher.getFullName(),
    // teacher.getEmploymentId());
    // return toResponse(teacher);
    // }

    @Transactional
    public TeacherResponse updateTeacher(Long id, TeacherUpdateRequest request, MultipartFile photo) {
        Teacher teacher = findNonDeletedTeacher(id);

        // handle email change explicitly
        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(teacher.getEmail())) {

            // 1) teacher email must be unique among NON-deleted teachers
            validateEmailUniqueness(request.getEmail(), id);

            // 2) if teacher has a linked user account -> also update the user.email
            if (teacher.getUser() != null) {
                Long userId = teacher.getUser().getId();

                // prevent collision with another user account
                if (userRepository.existsByEmailAndIdNot(request.getEmail(), userId)) {
                    throw new IllegalArgumentException(
                            "This email is already used by another user account: " + request.getEmail());
                }

                teacher.getUser().setEmail(request.getEmail());
                userRepository.save(teacher.getUser()); // optional but safe
            }
        }

        applyUpdates(teacher, request);

        // photo update logic remains same
        if (photo != null && !photo.isEmpty()) {
            fileStorageService.deleteFile(teacher.getProfilePhotoPath());
            storePhoto(teacher, photo);
        }

        // terminal status -> revoke
        if (request.getEmploymentStatus() != null && isTerminalStatus(request.getEmploymentStatus())) {
            revokeAccess(teacher);
        }

        teacherRepository.save(teacher);
        log.info("Teacher updated: {} ({})", teacher.getFullName(), teacher.getEmploymentId());
        return toResponse(teacher);
    }

    @Transactional
    public void softDeleteTeacher(Long id) {
        Teacher teacher = findNonDeletedTeacher(id);
        revokeAccess(teacher);
        teacher.setDeleted(true);
        teacherRepository.save(teacher);
        log.info("Teacher soft-deleted: {} ({})", teacher.getFullName(), teacher.getEmploymentId());
    }

    public TeacherResponse getTeacherById(Long id) {
        Teacher teacher = findNonDeletedTeacher(id);
        return toResponse(teacher);
    }

    public String getTeacherPhotoPath(Long id) {
        Teacher teacher = findNonDeletedTeacher(id);
        if (teacher.getProfilePhotoPath() == null) {
            throw new NotFoundException("No photo available for this teacher");
        }
        return teacher.getProfilePhotoPath();
    }

    public Page<TeacherListItemResponse> listTeachers(String search, EmploymentStatus status,
            LevelAssigned level, Designation designation,
            int page, int size) {

        Pageable pageable = PageRequest.of(page, size);
        Specification<Teacher> spec = buildSpecification(search, status, level, designation);
        return teacherRepository.findAll(spec, pageable).map(this::toListItem);
    }

    @Transactional
    public TeacherResponse createAccountForTeacher(Long teacherId) {
        Teacher teacher = findNonDeletedTeacher(teacherId);

        if (teacher.getUser() != null) {
            throw new IllegalArgumentException("Teacher already has a login account");
        }
        if (teacher.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot create account for non-active teacher");
        }

        CreateUserRequest userRequest = new CreateUserRequest();
        userRequest.setEmail(teacher.getEmail());
        userRequest.setRole(Role.TEACHER);
        CreateUserResponse userResponse = userService.createUser(userRequest);

        User user = userRepository.findById(userResponse.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));
        teacher.setUser(user);
        teacherRepository.save(teacher);

        log.info("Login account created for teacher: {} ({})", teacher.getFullName(), teacher.getEmail());
        return toResponse(teacher);
    }

    @Transactional
    public TeacherResponse revokeAccountForTeacher(Long teacherId) {
        Teacher teacher = findNonDeletedTeacher(teacherId);

        if (teacher.getUser() == null) {
            throw new IllegalArgumentException("Teacher does not have a login account");
        }

        revokeAccess(teacher);
        teacherRepository.save(teacher);

        log.info("Login access revoked for teacher: {} ({})", teacher.getFullName(), teacher.getEmail());
        return toResponse(teacher);
    }

    private void revokeAccess(Teacher teacher) {
        if (teacher.getUser() == null)
            return;

        User user = teacher.getUser();
        user.setActive(false);
        userRepository.save(user);
        teacher.setUser(null);
        log.info("Access revoked: user {} disabled and unlinked from teacher {}",
                user.getEmail(), teacher.getEmploymentId());
    }

    private boolean isTerminalStatus(EmploymentStatus status) {
        return status == EmploymentStatus.RESIGNED
                || status == EmploymentStatus.RETIRED
                || status == EmploymentStatus.TERMINATED;
    }

    private String generateEmploymentId() {
        int year = LocalDate.now().getYear();
        long count = teacherRepository.countByYear(year);
        return String.format("MK-STF-%d-%04d", year, count + 1);
    }

    private Teacher saveWithRetry(Teacher teacher) {
        int maxRetries = 3;
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return teacherRepository.save(teacher);
            } catch (DataIntegrityViolationException e) {
                if (e.getMessage() != null && e.getMessage().contains("employment_id")) {
                    int year = LocalDate.now().getYear();
                    long count = teacherRepository.countByYear(year);
                    teacher.setEmploymentId(String.format("MK-STF-%d-%04d", year, count + 1 + attempt + 1));
                } else {
                    throw e;
                }
            }
        }
        return teacherRepository.save(teacher);
    }

    private void validateEmailUniqueness(String email, Long excludeId) {
        boolean exists = excludeId == null
                ? teacherRepository.existsByEmailAndIsDeletedFalse(email)
                : teacherRepository.existsByEmailAndIsDeletedFalseAndIdNot(email, excludeId);

        if (exists) {
            throw new DuplicateEmailException(
                    "A teacher with email '" + email + "' already exists");
        }
    }

    private void storePhoto(Teacher teacher, MultipartFile photo) {
        if (photo != null && !photo.isEmpty()) {
            FileStorageService.StoredFile stored = fileStorageService.storeImage(photo, "staff/photos");
            teacher.setProfilePhotoOriginalName(stored.originalName());
            teacher.setProfilePhotoStoredName(stored.storedName());
            teacher.setProfilePhotoPath(stored.path());
        }
    }

    private void applyUpdates(Teacher teacher, TeacherUpdateRequest request) {
        if (request.getFullName() != null)
            teacher.setFullName(request.getFullName());
        if (request.getDateOfBirth() != null)
            teacher.setDateOfBirth(request.getDateOfBirth());
        if (request.getEmail() != null)
            teacher.setEmail(request.getEmail());
        if (request.getPhoneNumber() != null)
            teacher.setPhoneNumber(request.getPhoneNumber());
        if (request.getPermanentAddress() != null)
            teacher.setPermanentAddress(request.getPermanentAddress());
        if (request.getCurrentAddress() != null)
            teacher.setCurrentAddress(request.getCurrentAddress());
        if (request.getEmergencyContactName() != null)
            teacher.setEmergencyContactName(request.getEmergencyContactName());
        if (request.getEmergencyContactNumber() != null)
            teacher.setEmergencyContactNumber(request.getEmergencyContactNumber());
        if (request.getMaritalStatus() != null)
            teacher.setMaritalStatus(request.getMaritalStatus());
        if (request.getDateOfJoining() != null)
            teacher.setDateOfJoining(request.getDateOfJoining());
        if (request.getLevelAssigned() != null)
            teacher.setLevelAssigned(request.getLevelAssigned());
        if (request.getDesignation() != null)
            teacher.setDesignation(request.getDesignation());
        if (request.getEmploymentStatus() != null)
            teacher.setEmploymentStatus(request.getEmploymentStatus());
        if (request.getNotes() != null)
            teacher.setNotes(request.getNotes());
    }

    private Teacher findNonDeletedTeacher(Long id) {
        return teacherRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Teacher not found"));
    }

    private Specification<Teacher> buildSpecification(String search, EmploymentStatus status,
            LevelAssigned level, Designation designation) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("isDeleted"), false));

            if (status != null) {
                predicates.add(cb.equal(root.get("employmentStatus"), status));
            }
            if (level != null) {
                predicates.add(cb.equal(root.get("levelAssigned"), level));
            }
            if (designation != null) {
                predicates.add(cb.equal(root.get("designation"), designation));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                Predicate searchPredicate = cb.or(
                        cb.like(cb.lower(root.get("fullName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern));
                predicates.add(searchPredicate);
            }

            if (!Long.class.equals(query.getResultType()) && !long.class.equals(query.getResultType())) {

                Expression<Integer> activeRank = cb.<Integer>selectCase()
                        .when(cb.equal(root.get("employmentStatus"), EmploymentStatus.ACTIVE), 1)
                        .otherwise(0);
                query.orderBy(
                        cb.desc(activeRank), // ACTIVE first
                        cb.desc(root.get("createdAt")) // newest first
                );
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private TeacherResponse toResponse(Teacher teacher) {
        return TeacherResponse.builder()
                .id(teacher.getId())
                .employmentId(teacher.getEmploymentId())
                .fullName(teacher.getFullName())
                .dateOfBirth(teacher.getDateOfBirth())
                .email(teacher.getEmail())
                .phoneNumber(teacher.getPhoneNumber())
                .permanentAddress(teacher.getPermanentAddress())
                .currentAddress(teacher.getCurrentAddress())
                .emergencyContactName(teacher.getEmergencyContactName())
                .emergencyContactNumber(teacher.getEmergencyContactNumber())
                .maritalStatus(teacher.getMaritalStatus() != null
                        ? teacher.getMaritalStatus().name()
                        : null)
                .dateOfJoining(teacher.getDateOfJoining())
                .levelAssigned(teacher.getLevelAssigned().name())
                .designation(teacher.getDesignation().name())
                .employmentStatus(teacher.getEmploymentStatus().name())
                .notes(teacher.getNotes())
                .hasPhoto(teacher.getProfilePhotoPath() != null)
                .accountStatus(deriveAccountStatus(teacher))
                .accountEmail(teacher.getUser() != null ? teacher.getUser().getEmail() : null)
                .createdAt(teacher.getCreatedAt())
                .updatedAt(teacher.getUpdatedAt())
                .build();
    }

    private TeacherListItemResponse toListItem(Teacher teacher) {
        return TeacherListItemResponse.builder()
                .id(teacher.getId())
                .employmentId(teacher.getEmploymentId())
                .fullName(teacher.getFullName())
                .email(teacher.getEmail())
                .phoneNumber(teacher.getPhoneNumber())
                .levelAssigned(teacher.getLevelAssigned().name())
                .designation(teacher.getDesignation().name())
                .employmentStatus(teacher.getEmploymentStatus().name())
                .accountStatus(deriveAccountStatus(teacher))
                .build();
    }

    private String deriveAccountStatus(Teacher teacher) {
        if (teacher.getUser() == null) {
            return "NO_ACCOUNT";
        }
        return teacher.getUser().isActive() ? "ACTIVE" : "DISABLED";
    }
}
