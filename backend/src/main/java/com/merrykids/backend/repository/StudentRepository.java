package com.merrykids.backend.repository;

import com.merrykids.backend.entity.LevelAssigned;
import com.merrykids.backend.entity.Student;
import com.merrykids.backend.entity.StudentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long>, JpaSpecificationExecutor<Student> {

    Optional<Student> findByIdAndIsDeletedFalse(Long id);

    boolean existsByAdmissionNo(String admissionNo);

    @Query("SELECT COUNT(s) FROM Student s WHERE s.batchCode = :batchCode")
    long countByBatchCode(@Param("batchCode") String batchCode);

    List<Student> findByStatusAndCurrentLevelAndIsDeletedFalse(StudentStatus status, LevelAssigned level);
}
