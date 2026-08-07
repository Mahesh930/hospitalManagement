package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.OPDConsultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OPDConsultationRepository extends JpaRepository<OPDConsultation, UUID> {
    Optional<OPDConsultation> findByAppointmentId(UUID appointmentId);
}
