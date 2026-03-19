package com.merrykids.backend.repository;

import com.merrykids.backend.entity.ParentContentView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ParentContentViewRepository extends JpaRepository<ParentContentView, Long> {

    Optional<ParentContentView> findByGuardianIdAndStudentIdAndContentId(
            Long guardianId, Long studentId, Long contentId);

    @Query("SELECT v FROM ParentContentView v " +
           "WHERE v.guardian.id = :guardianId " +
           "AND v.student.id = :studentId " +
           "AND v.content.id IN :contentIds")
    List<ParentContentView> findByGuardianIdAndStudentIdAndContentIdIn(
            @Param("guardianId") Long guardianId,
            @Param("studentId") Long studentId,
            @Param("contentIds") List<Long> contentIds);
}
