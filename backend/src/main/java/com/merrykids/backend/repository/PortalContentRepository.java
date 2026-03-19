package com.merrykids.backend.repository;

import com.merrykids.backend.entity.ContentType;
import com.merrykids.backend.entity.LevelAssigned;
import com.merrykids.backend.entity.PortalContent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface PortalContentRepository extends JpaRepository<PortalContent, Long>, JpaSpecificationExecutor<PortalContent> {

    Page<PortalContent> findByTargetLevelAndTypeAndArchived(
            LevelAssigned targetLevel, ContentType type, boolean archived, Pageable pageable);

    List<PortalContent> findByTargetLevelAndTypeAndAcademicYearAndArchived(
            LevelAssigned targetLevel, ContentType type, String academicYear, boolean archived);

    Page<PortalContent> findByTargetLevelAndTypeAndAcademicYearAndArchived(
            LevelAssigned targetLevel, ContentType type, String academicYear, boolean archived,
            Pageable pageable);
}
