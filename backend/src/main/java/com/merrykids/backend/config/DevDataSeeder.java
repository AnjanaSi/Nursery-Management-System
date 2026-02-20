package com.merrykids.backend.config;

import com.merrykids.backend.entity.*;
import com.merrykids.backend.repository.AdmissionAnnouncementRepository;
import com.merrykids.backend.repository.AdmissionSubmissionRepository;
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

    @Override
    public void run(String... args) {
        seedUsers();
        seedAdmissions();
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
}
