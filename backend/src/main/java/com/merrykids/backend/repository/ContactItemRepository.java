package com.merrykids.backend.repository;

import com.merrykids.backend.entity.ContactItem;
import com.merrykids.backend.entity.ContactItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactItemRepository extends JpaRepository<ContactItem, Long> {

    List<ContactItem> findAllByOrderByDisplayOrderAsc();

    Optional<ContactItem> findByItemType(ContactItemType itemType);
}
