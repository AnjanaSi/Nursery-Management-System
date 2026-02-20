package com.merrykids.backend.repository;

import com.merrykids.backend.entity.AdmissionSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdmissionSubmissionRepository extends JpaRepository<AdmissionSubmission, Long>,
        JpaSpecificationExecutor<AdmissionSubmission> {

    @Query("SELECT COUNT(s) FROM AdmissionSubmission s WHERE YEAR(s.createdAt) = :year")
    long countByYear(@Param("year") int year);
}
