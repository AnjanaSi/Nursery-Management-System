package com.merrykids.backend.repository;

import com.merrykids.backend.entity.StudentGuardian;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudentGuardianRepository extends JpaRepository<StudentGuardian, Long> {

    List<StudentGuardian> findByStudentId(Long studentId);

    List<StudentGuardian> findByGuardianId(Long guardianId);

    int countByStudentId(Long studentId);

    void deleteByStudentId(Long studentId);

    @Query("SELECT COUNT(sg) FROM StudentGuardian sg " +
            "JOIN sg.student s " +
            "WHERE sg.guardian.id = :guardianId " +
            "AND s.status = com.merrykids.backend.entity.StudentStatus.ACTIVE " +
            "AND s.isDeleted = false")
    long countActiveStudentsByGuardianId(@Param("guardianId") Long guardianId);
}
