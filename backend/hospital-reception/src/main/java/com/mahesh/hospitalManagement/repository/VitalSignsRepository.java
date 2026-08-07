package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.VitalSigns;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VitalSignsRepository extends JpaRepository<VitalSigns, UUID> {

    List<VitalSigns> findByPatientIdOrderByRecordedAtDesc(UUID patientId);

    Optional<VitalSigns> findTopByPatientIdOrderByRecordedAtDesc(UUID patientId);

    Optional<VitalSigns> findByAppointmentId(UUID appointmentId);

    @Query("SELECT v FROM VitalSigns v WHERE v.appointment.id = :appointmentId AND v.deletedAt IS NULL")
    Optional<VitalSigns> findActiveByAppointmentId(@Param("appointmentId") UUID appointmentId);
}
