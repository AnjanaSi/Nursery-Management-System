package com.merrykids.backend.repository;

import com.merrykids.backend.entity.GalleryPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GalleryPhotoRepository extends JpaRepository<GalleryPhoto, Long> {

    List<GalleryPhoto> findByIsDeletedFalseOrderByDisplayOrderAsc();

    Optional<GalleryPhoto> findByIdAndIsDeletedFalse(Long id);

    Optional<GalleryPhoto> findTopByIsDeletedFalseAndDisplayOrderLessThanOrderByDisplayOrderDesc(int displayOrder);

    Optional<GalleryPhoto> findTopByIsDeletedFalseAndDisplayOrderGreaterThanOrderByDisplayOrderAsc(int displayOrder);

    int countByIsDeletedFalse();
}
