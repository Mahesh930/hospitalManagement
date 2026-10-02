package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.DiagnosticBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DiagnosticBookingRepository extends JpaRepository<DiagnosticBooking, UUID> {
    List<DiagnosticBooking> findByPatientIdOrderByBookingDateTimeDesc(UUID patientId);
    List<DiagnosticBooking> findByBookingDateTimeBetweenOrderByBookingDateTimeAsc(LocalDateTime start, LocalDateTime end);
    List<DiagnosticBooking> findByStatusOrderByBookingDateTimeAsc(String status);
    List<DiagnosticBooking> findByReferringDoctorIdOrderByBookingDateTimeDesc(UUID referringDoctorId);
    List<DiagnosticBooking> findByPatientIdAndCategoryOrderByBookingDateTimeDesc(UUID patientId, String category);
    List<DiagnosticBooking> findByReferringDoctorIdAndIsAbnormalTrue(UUID referringDoctorId);
}
