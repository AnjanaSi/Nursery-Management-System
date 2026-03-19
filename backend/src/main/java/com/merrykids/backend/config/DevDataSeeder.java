package com.merrykids.backend.config;

import com.merrykids.backend.entity.*;
import com.merrykids.backend.repository.*;
import com.merrykids.backend.util.AcademicYearUtil;
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
    private final StudentRepository studentRepository;
    private final GuardianRepository guardianRepository;
    private final StudentGuardianRepository studentGuardianRepository;
    private final PortalContentRepository portalContentRepository;
    private final ParentContentViewRepository parentContentViewRepository;

    @Override
    public void run(String... args) {
        seedUsers();
        seedAdmissions();
        seedTeachers();
        seedStudents();
        seedPortalContent();
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

    private void seedStudents() {
        if (studentRepository.count() > 0) {
            log.info("Students already seeded, skipping.");
            return;
        }

        log.info("Seeding student data...");

        int year = LocalDate.now().getYear();
        String batchCode = String.format("%02d%s", year % 100, "LKG1");

        // Guardian 1 — Father, linked to existing parent@example.com user
        User parentUser = userRepository.findByEmail("parent@example.com").orElse(null);
        Guardian father = guardianRepository.save(Guardian.builder()
                .fullName("Nimal Silva")
                .email("nimal.silva@example.com")
                .phone("+94771234567")
                .nic("901234567V")
                .address("123 Galle Road, Colombo 03")
                .user(parentUser)
                .build());

        // Guardian 2 — Mother, no user account
        Guardian mother = guardianRepository.save(Guardian.builder()
                .fullName("Kamala Silva")
                .email("kamala.silva@example.com")
                .phone("+94771234568")
                .address("123 Galle Road, Colombo 03")
                .build());

        // Student 1 — ACTIVE LKG1
        Student student1 = studentRepository.save(Student.builder()
                .admissionNo("MK-" + batchCode + "-0001")
                .fullName("Emma Silva")
                .dateOfBirth(LocalDate.of(2021, 3, 15))
                .gender(Gender.FEMALE)
                .entryYear(year)
                .entryLevel(LevelAssigned.LKG1)
                .currentLevel(LevelAssigned.LKG1)
                .batchCode(batchCode)
                .status(StudentStatus.ACTIVE)
                .enrollmentDate(LocalDate.of(year, 1, 10))
                .notes("Admitted via standard application.")
                .build());

        // Link guardians to student
        studentGuardianRepository.save(StudentGuardian.builder()
                .student(student1)
                .guardian(father)
                .relationshipType(GuardianRelationshipType.FATHER)
                .build());

        studentGuardianRepository.save(StudentGuardian.builder()
                .student(student1)
                .guardian(mother)
                .relationshipType(GuardianRelationshipType.MOTHER)
                .build());

        // Student 2 — ACTIVE LKG1, same batch (for bulk promotion testing)
        Guardian father2 = guardianRepository.save(Guardian.builder()
                .fullName("Kamal Perera")
                .email("kamal.perera@example.com")
                .phone("+94779876543")
                .address("456 Marine Drive, Colombo 06")
                .build());

        Guardian mother2 = guardianRepository.save(Guardian.builder()
                .fullName("Dilani Perera")
                .phone("+94779876544")
                .address("456 Marine Drive, Colombo 06")
                .build());

        Student student2 = studentRepository.save(Student.builder()
                .admissionNo("MK-" + batchCode + "-0002")
                .fullName("Aiden Perera")
                .dateOfBirth(LocalDate.of(2021, 7, 22))
                .gender(Gender.MALE)
                .entryYear(year)
                .entryLevel(LevelAssigned.LKG1)
                .currentLevel(LevelAssigned.LKG1)
                .batchCode(batchCode)
                .status(StudentStatus.ACTIVE)
                .enrollmentDate(LocalDate.of(year, 1, 10))
                .build());

        studentGuardianRepository.save(StudentGuardian.builder()
                .student(student2)
                .guardian(father2)
                .relationshipType(GuardianRelationshipType.FATHER)
                .build());

        studentGuardianRepository.save(StudentGuardian.builder()
                .student(student2)
                .guardian(mother2)
                .relationshipType(GuardianRelationshipType.MOTHER)
                .build());

        // Student 3 — ACTIVE UKG1, second child of Nimal Silva (parent@example.com)
        // This enables the multi-child selector in the Parent Portal demo
        String ukg1BatchCode = String.format("%02d%s", (year - 1) % 100, "LKG1");
        Student student3 = studentRepository.save(Student.builder()
                .admissionNo("MK-" + ukg1BatchCode + "-0001")
                .fullName("Lily Silva")
                .dateOfBirth(LocalDate.of(2019, 6, 5))
                .gender(Gender.FEMALE)
                .entryYear(year - 1)
                .entryLevel(LevelAssigned.LKG1)
                .currentLevel(LevelAssigned.UKG1)
                .batchCode(ukg1BatchCode)
                .status(StudentStatus.ACTIVE)
                .enrollmentDate(LocalDate.of(year - 1, 1, 10))
                .notes("Second child of Nimal Silva — demo for parent portal multi-child selector.")
                .build());

        studentGuardianRepository.save(StudentGuardian.builder()
                .student(student3)
                .guardian(father)
                .relationshipType(GuardianRelationshipType.FATHER)
                .build());

        studentGuardianRepository.save(StudentGuardian.builder()
                .student(student3)
                .guardian(mother)
                .relationshipType(GuardianRelationshipType.MOTHER)
                .build());

        log.info("Student seed data created: 3 students, 4 guardians (1 guardian with 2 active children for parent portal demo).");
    }

    private void seedPortalContent() {
        if (portalContentRepository.count() > 0) {
            log.info("Portal content already seeded, skipping.");
            return;
        }

        log.info("Seeding portal content data...");

        String academicYear = AcademicYearUtil.getCurrent();

        // Fetch LKG1 teacher (Priya Fernando) and UKG1 teacher (Anoma Wijesinghe)
        Teacher priya = teacherRepository.findAll().stream()
                .filter(t -> "Priya Fernando".equals(t.getFullName()) && !t.isDeleted())
                .findFirst().orElse(null);

        Teacher anoma = teacherRepository.findAll().stream()
                .filter(t -> "Anoma Wijesinghe".equals(t.getFullName()) && !t.isDeleted())
                .findFirst().orElse(null);

        if (priya == null || anoma == null) {
            log.warn("Seed teachers not found, skipping portal content seed.");
            return;
        }

        // LKG1 Announcements
        portalContentRepository.save(PortalContent.builder()
                .type(ContentType.ANNOUNCEMENT)
                .title("Welcome to LKG1 — " + academicYear + " Academic Year!")
                .body("Dear Parents,\n\nWe are thrilled to welcome you and your children to the " + academicYear
                        + " academic year at MerryKids. Our LKG1 programme is designed to nurture curiosity, creativity, and confidence in every child.\n\n"
                        + "Classes begin on 10th January. Please ensure your child arrives by 8:00 AM. Kindly review the attached timetable for the weekly schedule.\n\n"
                        + "Looking forward to a wonderful year together!\n\nMs. Priya Fernando\nLKG1 Teacher")
                .targetLevel(LevelAssigned.LKG1)
                .academicYear(academicYear)
                .createdByTeacher(priya)
                .pinned(true)
                .urgent(false)
                .build());

        portalContentRepository.save(PortalContent.builder()
                .type(ContentType.ANNOUNCEMENT)
                .title("Reminder: Annual Sports Day — This Friday!")
                .body("Dear Parents,\n\nThis is a reminder that the Annual Sports Day will be held this Friday, 14th March, from 8:30 AM to 12:00 PM on the school grounds.\n\n"
                        + "Children are requested to wear their house colours. Please ensure they bring a water bottle and wear comfortable footwear.\n\n"
                        + "Parents are warmly invited to attend and cheer for their little champions!")
                .targetLevel(LevelAssigned.LKG1)
                .academicYear(academicYear)
                .createdByTeacher(priya)
                .pinned(false)
                .urgent(true)
                .build());

        portalContentRepository.save(PortalContent.builder()
                .type(ContentType.ANNOUNCEMENT)
                .title("Term 1 Parent-Teacher Meeting Schedule")
                .body("Dear Parents,\n\nPlease find below the schedule for Term 1 Parent-Teacher Meetings. Each session is 15 minutes.\n\n"
                        + "Appointments will be shared via email. Kindly confirm your attendance by replying to the school office.\n\nThank you.")
                .targetLevel(LevelAssigned.LKG1)
                .academicYear((LocalDate.now().getYear() - 1) + "/" + LocalDate.now().getYear())
                .createdByTeacher(priya)
                .pinned(false)
                .urgent(false)
                .archived(true)
                .build());

        // LKG1 Homework
        portalContentRepository.save(PortalContent.builder()
                .type(ContentType.HOMEWORK)
                .title("Alphabet Practice — Letters A to E")
                .body("Dear Parents,\n\nPlease help your child practise writing the letters A, B, C, D, and E in their activity book (pages 5–7).\n\n"
                        + "Children should trace each letter 3 times and then write it independently once. Please encourage them to say the letter name and its sound aloud as they write.\n\n"
                        + "This activity should take about 15–20 minutes.")
                .targetLevel(LevelAssigned.LKG1)
                .academicYear(academicYear)
                .createdByTeacher(priya)
                .category("Language Arts")
                .dueDate(LocalDate.now().plusDays(3))
                .build());

        portalContentRepository.save(PortalContent.builder()
                .type(ContentType.HOMEWORK)
                .title("Counting Activity — Numbers 1 to 10")
                .body("Dear Parents,\n\nFor this week's maths activity, please help your child count objects around the house (e.g., buttons, spoons, toys) and write the numbers 1 to 10 in their maths workbook.\n\n"
                        + "You can make it fun by asking them to find groups of objects and count them together!")
                .targetLevel(LevelAssigned.LKG1)
                .academicYear(academicYear)
                .createdByTeacher(priya)
                .category("Mathematics")
                .build());

        portalContentRepository.save(PortalContent.builder()
                .type(ContentType.HOMEWORK)
                .title("Colour Recognition — Draw and Colour")
                .body("Past homework: Children were asked to draw their favourite animal and colour it using at least 3 different colours.\n\nMost children completed this beautifully!")
                .targetLevel(LevelAssigned.LKG1)
                .academicYear((LocalDate.now().getYear() - 1) + "/" + LocalDate.now().getYear())
                .createdByTeacher(priya)
                .category("Art")
                .archived(true)
                .build());

        // UKG1 Announcements (for Anoma's level — Lily Silva sees these)
        portalContentRepository.save(PortalContent.builder()
                .type(ContentType.ANNOUNCEMENT)
                .title("UKG1 Term 2 Begins — Important Updates")
                .body("Dear Parents,\n\nWelcome back! Term 2 for UKG1 begins on Monday 17th March. Please review the updated timetable attached and ensure all workbooks are labelled.\n\nMs. Anoma Wijesinghe\nUKG1 Senior Teacher")
                .targetLevel(LevelAssigned.UKG1)
                .academicYear(academicYear)
                .createdByTeacher(anoma)
                .pinned(true)
                .build());

        portalContentRepository.save(PortalContent.builder()
                .type(ContentType.ANNOUNCEMENT)
                .title("UKG1 Uniform Reminder")
                .body("Dear Parents,\n\nPlease ensure your child wears the full school uniform every Monday and Friday. Sports attire is permitted on Tuesdays and Thursdays for PE days.\n\nThank you for your cooperation.")
                .targetLevel(LevelAssigned.UKG1)
                .academicYear(academicYear)
                .createdByTeacher(anoma)
                .urgent(true)
                .build());

        // UKG1 Homework (for Anoma's level — Lily Silva sees these)
        portalContentRepository.save(PortalContent.builder()
                .type(ContentType.HOMEWORK)
                .title("Reading Practice — Short Sentences")
                .body("Dear Parents,\n\nThis week, please help your child read aloud 5 short sentences from their reading booklet (pages 12–14). Aim for one practice session each day.\n\n"
                        + "Encourage them to point to each word as they read. Let them try independently first before offering help.")
                .targetLevel(LevelAssigned.UKG1)
                .academicYear(academicYear)
                .createdByTeacher(anoma)
                .category("Reading")
                .dueDate(LocalDate.now().plusDays(5))
                .build());

        portalContentRepository.save(PortalContent.builder()
                .type(ContentType.HOMEWORK)
                .title("Number Writing — 1 to 20")
                .body("Dear Parents,\n\nPlease ask your child to write the numbers 1 to 20 in their maths workbook neatly. Aim to complete one page per day.\n\n"
                        + "You can also practice by asking them to count objects around the home and write the total number.")
                .targetLevel(LevelAssigned.UKG1)
                .academicYear(academicYear)
                .createdByTeacher(anoma)
                .category("Mathematics")
                .build());

        log.info("Portal content seed data created for LKG1 and UKG1 (including homework for parent portal demo).");
    }
}
