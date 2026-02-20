package com.merrykids.backend.repository;

import com.merrykids.backend.entity.AdmissionAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdmissionAnnouncementRepository extends JpaRepository<AdmissionAnnouncement, Long> {

    Optional<AdmissionAnnouncement> findTopByOrderByCreatedAtDesc();
}
