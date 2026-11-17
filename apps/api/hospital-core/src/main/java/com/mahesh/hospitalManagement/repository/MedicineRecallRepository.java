package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.MedicineRecall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MedicineRecallRepository extends JpaRepository<MedicineRecall, UUID> {
    Optional<MedicineRecall> findByRecallNumber(String recallNumber);
    List<MedicineRecall> findAllByOrderByCreatedAtDesc();
    List<MedicineRecall> findByStatus(String status);
}
