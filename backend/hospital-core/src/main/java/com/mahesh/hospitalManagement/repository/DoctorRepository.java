package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, UUID> {
    Optional<Doctor> findByEmail(String email);
    Optional<Doctor> findByUserId(UUID userId);
    List<Doctor> findByHospitalId(UUID hospitalId);
}
