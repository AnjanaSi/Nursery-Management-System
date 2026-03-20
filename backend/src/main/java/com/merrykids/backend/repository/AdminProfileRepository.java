package com.merrykids.backend.repository;

import com.merrykids.backend.entity.AdminProfile;
import com.merrykids.backend.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AdminProfileRepository extends JpaRepository<AdminProfile, Long>,
        JpaSpecificationExecutor<AdminProfile> {

    Optional<AdminProfile> findByIdAndIsDeletedFalse(Long id);

    boolean existsByEmailIgnoreCaseAndIsDeletedFalse(String email);

    boolean existsByEmailIgnoreCaseAndIsDeletedFalseAndIdNot(String email, Long id);

    Optional<AdminProfile> findByUserId(Long userId);

    Optional<AdminProfile> findByUser_EmailAndIsDeletedFalse(String email);

    @Query("SELECT COUNT(a) FROM AdminProfile a WHERE a.isDeleted = false AND a.user IS NOT NULL AND a.user.active = true AND a.user.role = :role")
    long countActiveAdminAccounts(@Param("role") Role role);
}
