package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.Insurance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface InsuranceRepository extends JpaRepository<Insurance, UUID> {
}