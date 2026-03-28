package com.merrykids.backend.repository;

import com.merrykids.backend.entity.NurseryEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface NurseryEventRepository
        extends JpaRepository<NurseryEvent, Long>,
                JpaSpecificationExecutor<NurseryEvent> {

    Optional<NurseryEvent> findByIdAndIsDeletedFalse(Long id);

    long countByIsDeletedFalse();
}
