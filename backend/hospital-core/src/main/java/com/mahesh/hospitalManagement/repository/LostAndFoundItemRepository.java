package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.LostAndFoundItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LostAndFoundItemRepository extends JpaRepository<LostAndFoundItem, UUID> {
    List<LostAndFoundItem> findByStatusOrderByFoundDateTimeDesc(String status);
    List<LostAndFoundItem> findAllByOrderByFoundDateTimeDesc();
}
