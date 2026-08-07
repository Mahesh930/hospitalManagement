package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.PatientVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientVisitRepository extends JpaRepository<PatientVisit, UUID> {

    List<PatientVisit> findByDoctorIdAndCheckInTimeBetweenOrderByPriorityRankAscCheckInTimeAsc(
            UUID doctorId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT pv FROM PatientVisit pv WHERE pv.doctor.id = :doctorId AND pv.status IN ('CHECKED_IN', 'IN_VITALS', 'WAITING_DOCTOR', 'IN_CONSULTATION') AND pv.deletedAt IS NULL ORDER BY pv.priorityRank ASC, pv.checkInTime ASC")
    List<PatientVisit> findActiveDoctorQueue(@Param("doctorId") UUID doctorId);

    @Query("SELECT pv FROM PatientVisit pv WHERE pv.checkInTime >= :startOfDay AND pv.checkInTime <= :endOfDay AND pv.deletedAt IS NULL ORDER BY pv.checkInTime DESC")
    List<PatientVisit> findTodayVisits(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    Optional<PatientVisit> findByAppointmentId(UUID appointmentId);

    @Query("SELECT COUNT(pv) FROM PatientVisit pv WHERE pv.doctor.id = :doctorId AND pv.checkInTime >= :startOfDay AND pv.checkInTime <= :endOfDay AND pv.deletedAt IS NULL")
    long countTodayVisitsForDoctor(@Param("doctorId") UUID doctorId, @Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT COUNT(pv) FROM PatientVisit pv WHERE pv.status = :status AND pv.checkInTime >= :startOfDay AND pv.checkInTime <= :endOfDay AND pv.deletedAt IS NULL")
    long countTodayVisitsByStatus(@Param("status") String status, @Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);
}
