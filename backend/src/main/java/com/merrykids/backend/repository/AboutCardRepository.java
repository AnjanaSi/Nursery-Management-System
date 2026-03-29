package com.merrykids.backend.repository;

import com.merrykids.backend.entity.AboutCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AboutCardRepository extends JpaRepository<AboutCard, Long> {

    List<AboutCard> findByIsDeletedFalseOrderByDisplayOrderAsc();

    Optional<AboutCard> findByIdAndIsDeletedFalse(Long id);

    // For move-up: find the card immediately before (highest displayOrder less than target)
    Optional<AboutCard> findTopByIsDeletedFalseAndDisplayOrderLessThanOrderByDisplayOrderDesc(int displayOrder);

    // For move-down: find the card immediately after (lowest displayOrder greater than target)
    Optional<AboutCard> findTopByIsDeletedFalseAndDisplayOrderGreaterThanOrderByDisplayOrderAsc(int displayOrder);
}
