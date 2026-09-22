package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.doctor.id = :doctorId " +
            "AND a.appointmentTime = :appointmentTime AND a.status != 'CANCELLED' AND a.deletedAt IS NULL")
    boolean existsByDoctorIdAndAppointmentTime(@Param("doctorId") UUID doctorId,
                                               @Param("appointmentTime") LocalDateTime appointmentTime);

    List<Appointment> findByDoctorIdAndStatusOrderByQueueOrderAsc(UUID doctorId, String status);

    List<Appointment> findByDoctorIdOrderByAppointmentTimeAsc(UUID doctorId);

    List<Appointment> findByDoctorIdAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(
            UUID doctorId, LocalDateTime start, LocalDateTime end);

    List<Appointment> findByPatientIdOrderByAppointmentTimeDesc(UUID patientId);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentTime >= :startOfDay AND a.appointmentTime <= :endOfDay AND a.deletedAt IS NULL")
    long countTodayAppointmentsForDoctor(@Param("doctorId") UUID doctorId, @Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);
}
