package com.merrykids.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merrykids.backend.dto.CreatePortalContentRequest;
import com.merrykids.backend.dto.LoginRequest;
import com.merrykids.backend.entity.ContentType;
import com.merrykids.backend.entity.Designation;
import com.merrykids.backend.entity.EmploymentStatus;
import com.merrykids.backend.entity.Gender;
import com.merrykids.backend.entity.Guardian;
import com.merrykids.backend.entity.GuardianRelationshipType;
import com.merrykids.backend.entity.LevelAssigned;
import com.merrykids.backend.entity.PortalContent;
import com.merrykids.backend.entity.Role;
import com.merrykids.backend.entity.Student;
import com.merrykids.backend.entity.StudentGuardian;
import com.merrykids.backend.entity.StudentStatus;
import com.merrykids.backend.entity.Teacher;
import com.merrykids.backend.entity.User;
import com.merrykids.backend.repository.GuardianRepository;
import com.merrykids.backend.repository.PasswordResetTokenRepository;
import com.merrykids.backend.repository.PortalContentRepository;
import com.merrykids.backend.repository.StudentGuardianRepository;
import com.merrykids.backend.repository.StudentRepository;
import com.merrykids.backend.repository.TeacherRepository;
import com.merrykids.backend.repository.UserRepository;
import com.merrykids.backend.service.EmailService;
import com.merrykids.backend.util.AcademicYearUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MSc Integration Tests — Teacher Portal (Feature 7) & Parent Portal (Feature 8)
 * Approved test IDs: INT-TCH-01, INT-TCH-02, INT-PAR-01
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TeacherParentPortalIntegrationMscTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired TeacherRepository teacherRepository;
    @Autowired StudentRepository studentRepository;
    @Autowired GuardianRepository guardianRepository;
    @Autowired StudentGuardianRepository studentGuardianRepository;
    @Autowired PortalContentRepository contentRepository;
    @Autowired PasswordResetTokenRepository tokenRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @MockitoBean
    EmailService emailService;

    // LKG1 teacher
    private Teacher lkg1Teacher;
    // UKG1 teacher (used only for cross-level access test)
    private Teacher ukg1Teacher;
    // Parent whose child is in LKG1
    private Guardian parentGuardian;
    private Student lkg1Student;

    private String lkg1TeacherToken;
    private String parentToken;

    @BeforeEach
    void setUp() throws Exception {
        tokenRepository.deleteAll();
        contentRepository.deleteAll();
        studentGuardianRepository.deleteAll();
        studentRepository.deleteAll();
        guardianRepository.deleteAll();
        teacherRepository.deleteAll();
        userRepository.deleteAll();

        // ── LKG1 teacher ────────────────────────────────────────────────────
        User lkg1User = userRepository.save(User.builder()
                .email("priya.fernando@example.com")
                .passwordHash(passwordEncoder.encode("Teacher123!"))
                .role(Role.TEACHER).active(true).mustChangePassword(false).build());

        lkg1Teacher = teacherRepository.save(Teacher.builder()
                .employmentId("MK-STF-2025-0001")
                .fullName("Priya Fernando")
                .email("priya.fernando@example.com")
                .dateOfBirth(LocalDate.of(1985, 3, 12))
                .phoneNumber("+94771234567")
                .permanentAddress("123 Main St").currentAddress("123 Main St")
                .emergencyContactName("EC").emergencyContactNumber("+94771234568")
                .dateOfJoining(LocalDate.of(2020, 1, 15))
                .levelAssigned(LevelAssigned.LKG1)
                .designation(Designation.TEACHER)
                .employmentStatus(EmploymentStatus.ACTIVE)
                .isDeleted(false).user(lkg1User).build());

        // ── UKG1 teacher ────────────────────────────────────────────────────
        User ukg1User = userRepository.save(User.builder()
                .email("teacher@example.com")
                .passwordHash(passwordEncoder.encode("Teacher123!"))
                .role(Role.TEACHER).active(true).mustChangePassword(false).build());

        ukg1Teacher = teacherRepository.save(Teacher.builder()
                .employmentId("MK-STF-2025-0002")
                .fullName("Test Teacher UKG1")
                .email("teacher@example.com")
                .dateOfBirth(LocalDate.of(1988, 5, 20))
                .phoneNumber("+94771234569")
                .permanentAddress("456 Side St").currentAddress("456 Side St")
                .emergencyContactName("EC2").emergencyContactNumber("+94771234570")
                .dateOfJoining(LocalDate.of(2021, 1, 10))
                .levelAssigned(LevelAssigned.UKG1)
                .designation(Designation.TEACHER)
                .employmentStatus(EmploymentStatus.ACTIVE)
                .isDeleted(false).user(ukg1User).build());

        // ── Parent + LKG1 child ──────────────────────────────────────────────
        User parentUser = userRepository.save(User.builder()
                .email("nimal.silva@example.com")
                .passwordHash(passwordEncoder.encode("Parent123!"))
                .role(Role.PARENT).active(true).mustChangePassword(false).build());

        parentGuardian = guardianRepository.save(Guardian.builder()
                .fullName("Nimal Silva")
                .email("nimal.silva@example.com")
                .phone("+94771234567")
                .user(parentUser).isDeleted(false).build());

        lkg1Student = studentRepository.save(Student.builder()
                .admissionNo("MK-25LKG1-0001")
                .fullName("Emma Silva")
                .dateOfBirth(LocalDate.of(2020, 6, 15))
                .gender(Gender.FEMALE)
                .entryLevel(LevelAssigned.LKG1)
                .currentLevel(LevelAssigned.LKG1)
                .batchCode("25LKG1")
                .status(StudentStatus.ACTIVE)
                .enrollmentDate(LocalDate.of(2025, 1, 6))
                .isDeleted(false).build());

        studentGuardianRepository.save(StudentGuardian.builder()
                .student(lkg1Student).guardian(parentGuardian)
                .relationshipType(GuardianRelationshipType.FATHER).build());

        lkg1TeacherToken  = obtainToken("priya.fernando@example.com", "Teacher123!");
        parentToken       = obtainToken("nimal.silva@example.com", "Parent123!");
    }

    // ── INT-TCH-01 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("INT-TCH-01: Announcement created by LKG1 teacher is visible in parent's LKG1 child announcement list")
    void teacherCreatesAnnouncement_parentOfSameLevelChildCanSeeIt() throws Exception {
        CreatePortalContentRequest req = new CreatePortalContentRequest();
        req.setTitle("LKG1 Parent Meeting");
        req.setBody("Parent-teacher meeting on Friday at 4 PM.");

        MockMultipartFile dataPart = new MockMultipartFile(
                "data", "", MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(req));

        // Teacher creates the announcement
        mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .multipart("/api/v1/teacher/announcements")
                                .file(dataPart)
                                .header("Authorization", "Bearer " + lkg1TeacherToken))
                .andExpect(status().isCreated());

        // Parent's LKG1 child should see the announcement
        mockMvc.perform(get("/api/v1/parent/children/" + lkg1Student.getId() + "/announcements")
                        .header("Authorization", "Bearer " + parentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title").value("LKG1 Parent Meeting"));
    }

    // ── INT-TCH-02 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("INT-TCH-02: LKG1 teacher cannot access an announcement created for UKG1 level")
    void lkg1Teacher_cannotAccessUkg1Content_returns403or404() throws Exception {
        // Seed a UKG1 announcement directly in DB
        PortalContent ukg1Content = contentRepository.save(PortalContent.builder()
                .type(ContentType.ANNOUNCEMENT)
                .title("UKG1 Announcement")
                .body("For UKG1 students only.")
                .targetLevel(LevelAssigned.UKG1)
                .academicYear(AcademicYearUtil.getCurrent())
                .createdByTeacher(ukg1Teacher)
                .pinned(false).urgent(false).archived(false)
                .build());

        // LKG1 teacher attempts to access it
        mockMvc.perform(get("/api/v1/teacher/announcements/" + ukg1Content.getId())
                        .header("Authorization", "Bearer " + lkg1TeacherToken))
                .andExpect(result ->
                        org.assertj.core.api.Assertions.assertThat(
                                result.getResponse().getStatus())
                                .isIn(403, 404));
    }

    // ── INT-PAR-01 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("INT-PAR-01: After parent marks announcement as viewed, it is returned with isViewed=true in subsequent list")
    void markViewed_announcementShownAsViewedInSubsequentList() throws Exception {
        // Seed announcement for LKG1
        PortalContent announcement = contentRepository.save(PortalContent.builder()
                .type(ContentType.ANNOUNCEMENT)
                .title("Welcome to LKG1!")
                .body("Welcome all new students.")
                .targetLevel(LevelAssigned.LKG1)
                .academicYear(AcademicYearUtil.getCurrent())
                .createdByTeacher(lkg1Teacher)
                .pinned(false).urgent(false).archived(false)
                .build());

        // Step 1: List — isViewed should be false
        mockMvc.perform(get("/api/v1/parent/children/" + lkg1Student.getId() + "/announcements")
                        .header("Authorization", "Bearer " + parentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].viewed").value(false));

        // Step 2: Mark as viewed
        mockMvc.perform(post("/api/v1/parent/children/" + lkg1Student.getId()
                        + "/announcements/" + announcement.getId() + "/view")
                        .header("Authorization", "Bearer " + parentToken))
                .andExpect(status().isOk());

        // Step 3: List again — isViewed should now be true
        mockMvc.perform(get("/api/v1/parent/children/" + lkg1Student.getId() + "/announcements")
                        .header("Authorization", "Bearer " + parentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].viewed").value(true));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private String obtainToken(String email, String password) throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail(email);
        req.setPassword(password);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("token").asText();
    }
}
