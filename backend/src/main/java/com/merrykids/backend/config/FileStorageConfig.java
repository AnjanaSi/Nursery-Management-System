package com.merrykids.backend.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
@Slf4j
public class FileStorageConfig {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostConstruct
    public void init() throws IOException {
        Path announcementsDir = Paths.get(uploadDir, "admissions", "announcements");
        Path submissionsDir = Paths.get(uploadDir, "admissions", "submissions");
        Path staffPhotosDir = Paths.get(uploadDir, "staff", "photos");
        Path teacherContentDir = Paths.get(uploadDir, "teacher-content", "attachments");
        Path eventPhotosDir = Paths.get(uploadDir, "events", "photos");
        Path aboutImagesDir = Paths.get(uploadDir, "about", "images");
        Path galleryPhotosDir = Paths.get(uploadDir, "gallery", "photos");

        Files.createDirectories(announcementsDir);
        Files.createDirectories(submissionsDir);
        Files.createDirectories(staffPhotosDir);
        Files.createDirectories(teacherContentDir);
        Files.createDirectories(eventPhotosDir);
        Files.createDirectories(aboutImagesDir);
        Files.createDirectories(galleryPhotosDir);

        log.info("Upload directories created: {}, {}, {}, {}, {}, {}, {}", announcementsDir, submissionsDir, staffPhotosDir, teacherContentDir, eventPhotosDir, aboutImagesDir, galleryPhotosDir);
    }
}
