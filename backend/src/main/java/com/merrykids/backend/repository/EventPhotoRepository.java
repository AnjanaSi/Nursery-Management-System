package com.merrykids.backend.repository;

import com.merrykids.backend.entity.EventPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventPhotoRepository extends JpaRepository<EventPhoto, Long> {

    List<EventPhoto> findByEventIdOrderByDisplayOrderAsc(Long eventId);

    List<EventPhoto> findByIdInAndEvent_Id(List<Long> ids, Long eventId);

    Optional<EventPhoto> findFirstByEvent_IdOrderByDisplayOrderAsc(Long eventId);
}
