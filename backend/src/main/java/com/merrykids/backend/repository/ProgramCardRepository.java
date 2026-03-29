package com.merrykids.backend.repository;

import com.merrykids.backend.entity.ProgramCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProgramCardRepository extends JpaRepository<ProgramCard, Long> {

    List<ProgramCard> findByIsDeletedFalseOrderByDisplayOrderAsc();

    Optional<ProgramCard> findByIdAndIsDeletedFalse(Long id);

    Optional<ProgramCard> findTopByIsDeletedFalseAndDisplayOrderLessThanOrderByDisplayOrderDesc(int displayOrder);

    Optional<ProgramCard> findTopByIsDeletedFalseAndDisplayOrderGreaterThanOrderByDisplayOrderAsc(int displayOrder);
}
