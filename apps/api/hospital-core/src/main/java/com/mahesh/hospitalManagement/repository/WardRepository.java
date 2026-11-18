package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.Ward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WardRepository extends JpaRepository<Ward, UUID> {

    List<Ward> findByHospitalIdAndDeletedAtIsNull(UUID hospitalId);

    List<Ward> findByHospitalIdAndWardTypeAndDeletedAtIsNull(UUID hospitalId, String wardType);
}
