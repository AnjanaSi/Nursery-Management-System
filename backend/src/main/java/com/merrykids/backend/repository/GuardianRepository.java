package com.merrykids.backend.repository;

import com.merrykids.backend.entity.Guardian;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GuardianRepository extends JpaRepository<Guardian, Long> {

    Optional<Guardian> findByIdAndIsDeletedFalse(Long id);

    Optional<Guardian> findByEmailIgnoreCaseAndIsDeletedFalse(String email);

    Optional<Guardian> findByNicAndIsDeletedFalse(String nic);
}
