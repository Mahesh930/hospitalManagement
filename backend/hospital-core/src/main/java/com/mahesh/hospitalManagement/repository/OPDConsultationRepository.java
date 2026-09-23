package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.OPDConsultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OPDConsultationRepository extends JpaRepository<OPDConsultation, UUID> {
    Optional<OPDConsultation> findByAppointmentId(UUID appointmentId);
    List<OPDConsultation> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
    List<OPDConsultation> findByDoctorIdAndStatusOrderByCreatedAtDesc(UUID doctorId, String status);
    List<OPDConsultation> findByDoctorIdOrderByCreatedAtDesc(UUID doctorId);

    @Query("SELECT COUNT(c) FROM OPDConsultation c WHERE c.doctor.id = :doctorId AND c.status = :status AND c.createdAt >= :startOfDay AND c.createdAt <= :endOfDay AND c.deletedAt IS NULL")
    long countTodayByDoctorAndStatus(@Param("doctorId") UUID doctorId, @Param("status") String status, @Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);
}
