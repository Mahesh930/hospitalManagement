package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.PharmacyShiftHandover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PharmacyShiftHandoverRepository extends JpaRepository<PharmacyShiftHandover, UUID> {
    List<PharmacyShiftHandover> findAllByOrderByHandoverDateDescCreatedAtDesc();
}
