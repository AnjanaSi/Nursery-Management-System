package com.merrykids.backend.service;

import com.merrykids.backend.exception.FileStorageException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private final Path uploadPath;

    public FileStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public StoredFile storeFile(MultipartFile file, String subDirectory) {
        validatePdf(file);

        String originalName = file.getOriginalFilename();
        String storedName = UUID.randomUUID() + ".pdf";
        Path targetDir = uploadPath.resolve(subDirectory);
        Path targetPath = targetDir.resolve(storedName);

        try {
            Files.createDirectories(targetDir);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("File stored: {} -> {}", originalName, targetPath);
        } catch (IOException e) {
            throw new FileStorageException("Failed to store file: " + originalName, e);
        }

        return new StoredFile(originalName, storedName, targetPath.toString());
    }

    public Resource loadFileAsResource(String filePath) {
        try {
            Path path = Paths.get(filePath).toAbsolutePath().normalize();
            Resource resource = new UrlResource(path.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new FileStorageException("File not found: " + filePath);
        } catch (MalformedURLException e) {
            throw new FileStorageException("File not found: " + filePath, e);
        }
    }

    public void deleteFile(String filePath) {
        if (filePath == null) return;
        try {
            Path path = Paths.get(filePath);
            Files.deleteIfExists(path);
            log.info("File deleted: {}", filePath);
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", filePath, e);
        }
    }

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );

    public StoredFile storeImage(MultipartFile file, String subDirectory) {
        validateImage(file);

        String originalName = file.getOriginalFilename();
        String extension = getExtension(originalName);
        String storedName = UUID.randomUUID() + extension;
        Path targetDir = uploadPath.resolve(subDirectory);
        Path targetPath = targetDir.resolve(storedName);

        try {
            Files.createDirectories(targetDir);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Image stored: {} -> {}", originalName, targetPath);
        } catch (IOException e) {
            throw new FileStorageException("Failed to store image: " + originalName, e);
        }

        return new StoredFile(originalName, storedName, targetPath.toString());
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("Image file is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new FileStorageException("Only JPEG, PNG, and WEBP images are accepted");
        }

        long maxSize = 5 * 1024 * 1024; // 5MB
        if (file.getSize() > maxSize) {
            throw new FileStorageException("Image size exceeds the maximum limit of 5MB");
        }
    }

    private String getExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf("."));
        }
        return ".jpg";
    }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("File is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new FileStorageException("Only PDF files are accepted");
        }

        long maxSize = 10 * 1024 * 1024; // 10MB
        if (file.getSize() > maxSize) {
            throw new FileStorageException("File size exceeds the maximum limit of 10MB");
        }
    }

    public record StoredFile(String originalName, String storedName, String path) {}
}
