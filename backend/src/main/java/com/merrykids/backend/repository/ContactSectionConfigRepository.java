package com.merrykids.backend.repository;

import com.merrykids.backend.entity.ContactSectionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContactSectionConfigRepository extends JpaRepository<ContactSectionConfig, Long> {
}
