package com.merrykids.backend.config;

import com.merrykids.backend.entity.*;
import com.merrykids.backend.repository.AdmissionAnnouncementRepository;
import com.merrykids.backend.repository.AdmissionSubmissionRepository;
import com.merrykids.backend.repository.TeacherRepository;
import com.merrykids.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class DevDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdmissionAnnouncementRepository announcementRepository;
    private final AdmissionSubmissionRepository submissionRepository;
    private final TeacherRepository teacherRepository;

    @Override
    public void run(String... args) {
        seedUsers();
        seedAdmissions();
        seedTeachers();
    }

    private void seedUsers() {
        if (userRepository.count() > 0) {
            log.info("Users already seeded, skipping.");
            return;
        }

        log.info("Seeding user data...");

        userRepository.save(User.builder()
                .email("admin@example.com")
                .passwordHash(passwordEncoder.encode("Admin123!"))
                .role(Role.ADMIN)
                .active(true)
                .mustChangePassword(false)
                .build());

        userRepository.save(User.builder()
                .email("teacher@example.com")
                .passwordHash(passwordEncoder.encode("Teacher123!"))
                .role(Role.TEACHER)
                .active(true)
                .mustChangePassword(false)
                .build());

        userRepository.save(User.builder()
                .email("parent@example.com")
                .passwordHash(passwordEncoder.encode("Parent123!"))
                .role(Role.PARENT)
                .active(true)
                .mustChangePassword(false)
                .build());

        log.info("User seed data created: 3 users.");
    }

    private void seedAdmissions() {
        if (announcementRepository.count() > 0) {
            log.info("Admissions already seeded, skipping.");
            return;
        }

        log.info("Seeding admission data...");

        int year = LocalDate.now().getYear();

        announcementRepository.save(AdmissionAnnouncement.builder()
                .message("Admissions are now open for the " + year + "/" + (year + 1)
                        + " academic year! We welcome applications for LKG1, UKG1, and UKG2 programs. "
                        + "Please download the application form, fill it out, and submit it along with required documents.")
                .openDate(LocalDate.now().minusDays(5))
                .closeDate(LocalDate.now().plusDays(30))
                .build());

        submissionRepository.save(AdmissionSubmission.builder()
                .referenceNo("MK-ADM-" + year + "-000001")
                .childFullName("Emma Silva")
                .dateOfBirth(LocalDate.of(2021, 3, 15))
                .levelApplyingFor(ApplyingLevel.LKG1)
                .guardianFullName("Nimal Silva")
                .email("nimal.silva@example.com")
                .phone("+94771234567")
                .address("123 Galle Road, Colombo 03")
                .status(SubmissionStatus.RECEIVED)
                .build());

        submissionRepository.save(AdmissionSubmission.builder()
                .referenceNo("MK-ADM-" + year + "-000002")
                .childFullName("Aiden Perera")
                .dateOfBirth(LocalDate.of(2020, 7, 22))
                .levelApplyingFor(ApplyingLevel.UKG1)
                .guardianFullName("Kamal Perera")
                .email("kamal.perera@example.com")
                .phone("+94779876543")
                .address("456 Marine Drive, Colombo 06")
                .status(SubmissionStatus.UNDER_REVIEW)
                .adminNote("Documents look complete. Schedule interview.")
                .build());

        submissionRepository.save(AdmissionSubmission.builder()
                .referenceNo("MK-ADM-" + year + "-000003")
                .childFullName("Lily Fernando")
                .dateOfBirth(LocalDate.of(2020, 1, 10))
                .levelApplyingFor(ApplyingLevel.UKG2)
                .guardianFullName("Samantha Fernando")
                .email("samantha.f@example.com")
                .phone("+94771112233")
                .address("789 Temple Road, Nugegoda")
                .status(SubmissionStatus.ACCEPTED)
                .adminNote("Accepted. Create parent account.")
                .build());

        log.info("Admission seed data created: 1 announcement, 3 submissions.");
    }

    private void seedTeachers() {
        if (teacherRepository.count() > 0) {
            log.info("Teachers already seeded, skipping.");
            return;
        }

        log.info("Seeding teacher data...");

        int year = LocalDate.now().getYear();

        // Teacher 1 — ACTIVE, linked to existing teacher@example.com user account
        User teacherUser1 = userRepository.findByEmail("teacher@example.com").orElse(null);
        teacherRepository.save(Teacher.builder()
                .employmentId("MK-STF-" + year + "-0001")
                .fullName("Anoma Wijesinghe")
                .dateOfBirth(LocalDate.of(1988, 5, 12))
                .email("teacher@example.com")
                .phoneNumber("+94771234001")
                .permanentAddress("45 Temple Road, Kandy")
                .currentAddress("45 Temple Road, Kandy")
                .emergencyContactName("Sunil Wijesinghe")
                .emergencyContactNumber("+94771234002")
                .maritalStatus(MaritalStatus.MARRIED)
                .dateOfJoining(LocalDate.of(2023, 1, 15))
                .levelAssigned(LevelAssigned.UKG1)
                .designation(Designation.SENIOR_TEACHER)
                .employmentStatus(EmploymentStatus.ACTIVE)
                .user(teacherUser1)
                .notes("Experienced Montessori educator with 10+ years.")
                .build());

        // Teacher 2 — ACTIVE, with own user account
        User teacherUser2 = userRepository.save(User.builder()
                .email("priya.fernando@example.com")
                .passwordHash(passwordEncoder.encode("Teacher123!"))
                .role(Role.TEACHER)
                .active(true)
                .mustChangePassword(false)
                .build());

        teacherRepository.save(Teacher.builder()
                .employmentId("MK-STF-" + year + "-0002")
                .fullName("Priya Fernando")
                .dateOfBirth(LocalDate.of(1992, 8, 20))
                .email("priya.fernando@example.com")
                .phoneNumber("+94779876001")
                .permanentAddress("12 Lake Drive, Colombo 07")
                .currentAddress("12 Lake Drive, Colombo 07")
                .emergencyContactName("Ravi Fernando")
                .emergencyContactNumber("+94779876002")
                .maritalStatus(MaritalStatus.SINGLE)
                .dateOfJoining(LocalDate.of(2024, 3, 1))
                .levelAssigned(LevelAssigned.LKG1)
                .designation(Designation.TEACHER)
                .employmentStatus(EmploymentStatus.ACTIVE)
                .user(teacherUser2)
                .build());

        // Teacher 3 — ACTIVE, no user account
        teacherRepository.save(Teacher.builder()
                .employmentId("MK-STF-" + year + "-0003")
                .fullName("Kumari Jayawardena")
                .dateOfBirth(LocalDate.of(1995, 11, 3))
                .email("kumari.j@example.com")
                .phoneNumber("+94771112001")
                .permanentAddress("78 Hill Street, Galle")
                .currentAddress("22 Park Avenue, Colombo 05")
                .emergencyContactName("Nimal Jayawardena")
                .emergencyContactNumber("+94771112002")
                .dateOfJoining(LocalDate.of(2024, 9, 1))
                .levelAssigned(LevelAssigned.UKG2)
                .designation(Designation.ASSISTANT_TEACHER)
                .employmentStatus(EmploymentStatus.ACTIVE)
                .build());

        // Teacher 4 — RESIGNED, no account
        teacherRepository.save(Teacher.builder()
                .employmentId("MK-STF-" + year + "-0004")
                .fullName("Dinesh Rathnayake")
                .dateOfBirth(LocalDate.of(1985, 2, 28))
                .email("dinesh.r@example.com")
                .phoneNumber("+94775556001")
                .permanentAddress("33 Main Street, Matara")
                .currentAddress("33 Main Street, Matara")
                .emergencyContactName("Champa Rathnayake")
                .emergencyContactNumber("+94775556002")
                .maritalStatus(MaritalStatus.MARRIED)
                .dateOfJoining(LocalDate.of(2022, 6, 15))
                .levelAssigned(LevelAssigned.UKG1)
                .designation(Designation.TEACHER)
                .employmentStatus(EmploymentStatus.RESIGNED)
                .notes("Resigned for personal reasons in December 2024.")
                .build());

        // Teacher 5 — RETIRED, no account
        teacherRepository.save(Teacher.builder()
                .employmentId("MK-STF-" + year + "-0005")
                .fullName("Margaret de Silva")
                .dateOfBirth(LocalDate.of(1965, 9, 10))
                .email("margaret.ds@example.com")
                .phoneNumber("+94773334001")
                .permanentAddress("5 Church Lane, Negombo")
                .currentAddress("5 Church Lane, Negombo")
                .emergencyContactName("Anton de Silva")
                .emergencyContactNumber("+94773334002")
                .maritalStatus(MaritalStatus.WIDOWED)
                .dateOfJoining(LocalDate.of(2015, 1, 5))
                .levelAssigned(LevelAssigned.LKG1)
                .designation(Designation.PRINCIPAL)
                .employmentStatus(EmploymentStatus.RETIRED)
                .notes("Retired after 10 years of dedicated service.")
                .build());

        log.info("Teacher seed data created: 5 teachers (2 with linked accounts).");
    }
}
