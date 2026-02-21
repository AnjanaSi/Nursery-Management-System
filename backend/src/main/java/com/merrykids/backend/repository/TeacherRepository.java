package com.merrykids.backend.repository;

import com.merrykids.backend.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long>,
        JpaSpecificationExecutor<Teacher> {

    @Query("SELECT COUNT(t) FROM Teacher t WHERE YEAR(t.createdAt) = :year")
    long countByYear(@Param("year") int year);

    boolean existsByEmailAndIsDeletedFalse(String email);

    boolean existsByEmailAndIsDeletedFalseAndIdNot(String email, Long id);

    Optional<Teacher> findByIdAndIsDeletedFalse(Long id);

    Optional<Teacher> findByUserId(Long userId);
}
