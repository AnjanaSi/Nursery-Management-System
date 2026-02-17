package com.merrykids.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public void sendWelcomeEmail(String toEmail, String tempPassword, String role) {
        String subject = "Welcome to MerryKids Portal";
        String loginUrl = frontendUrl + "/login";
        String body = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>"
                + "<h2 style='color:#2563EB'>Welcome to MerryKids!</h2>"
                + "<p>Your <strong>" + role + "</strong> account has been created.</p>"
                + "<p><strong>Email:</strong> " + toEmail + "</p>"
                + "<p><strong>Temporary Password:</strong> " + tempPassword + "</p>"
                + "<p>Please log in and change your password immediately:</p>"
                + "<p><a href='" + loginUrl + "' style='display:inline-block;padding:10px 24px;"
                + "background-color:#2563EB;color:#fff;text-decoration:none;border-radius:6px'>"
                + "Log In</a></p>"
                + "<p style='color:#64748B;font-size:12px'>If you did not expect this email, please ignore it.</p>"
                + "</div>";
        sendEmail(toEmail, subject, body);
    }

    public void sendPasswordResetEmail(String toEmail, String rawToken) {
        String subject = "MerryKids - Password Reset Request";
        String resetUrl = frontendUrl + "/reset-password?token=" + rawToken;
        String body = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>"
                + "<h2 style='color:#2563EB'>Password Reset</h2>"
                + "<p>We received a request to reset your password.</p>"
                + "<p><a href='" + resetUrl + "' style='display:inline-block;padding:10px 24px;"
                + "background-color:#2563EB;color:#fff;text-decoration:none;border-radius:6px'>"
                + "Reset Password</a></p>"
                + "<p>This link expires in 30 minutes and can only be used once.</p>"
                + "<p style='color:#64748B;font-size:12px'>If you did not request this, please ignore this email.</p>"
                + "</div>";
        sendEmail(toEmail, subject, body);
    }

    private void sendEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
