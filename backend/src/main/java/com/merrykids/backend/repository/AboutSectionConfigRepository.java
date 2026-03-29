package com.merrykids.backend.repository;

import com.merrykids.backend.entity.AboutSectionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AboutSectionConfigRepository extends JpaRepository<AboutSectionConfig, Long> {
}
