package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.DoctorResponseDto;
import com.mahesh.hospitalManagement.dto.HospitalAdminStatsDto;
import com.mahesh.hospitalManagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final DoctorService doctorService;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final InvoiceRepository invoiceRepository;

    /**
     * Aggregates live operational statistics for the Hospital Admin dashboard.
     */
    public HospitalAdminStatsDto getHospitalAdminStats() {
        long totalDoctors = doctorRepository.count();
        long totalPatients = patientRepository.count();
        long todayOpdPatients = appointmentRepository.count();
        
        // Calculate total revenue from paid invoices
        double totalRevenue = invoiceRepository.findAll().stream()
                .filter(inv -> "PAID".equalsIgnoreCase(inv.getPaymentStatus()))
                .mapToDouble(inv -> inv.getGrandTotal() != null ? inv.getGrandTotal() : 0.0)
                .sum();

        long pendingBills = invoiceRepository.findAll().stream()
                .filter(inv -> "PENDING".equalsIgnoreCase(inv.getPaymentStatus()) || "UNPAID".equalsIgnoreCase(inv.getPaymentStatus()))
                .count();

        long checkedInPatients = appointmentRepository.findAll().stream()
                .filter(app -> "CHECKED_IN".equalsIgnoreCase(app.getStatus()))
                .count();

        return HospitalAdminStatsDto.builder()
                .todayOpdPatients(todayOpdPatients)
                .checkedInPatients(checkedInPatients)
                .totalDoctors(totalDoctors)
                .totalPatients(totalPatients)
                .totalRevenueToday(totalRevenue)
                .pendingBillsCount(pendingBills)
                .occupiedBeds(12) // Mocked initial bed occupancy metrics
                .totalBeds(50)
                .build();
    }

    /**
     * Retrieves all onboarded doctors in the hospital.
     */
    public List<DoctorResponseDto> getAllDoctors() {
        return doctorService.getAllDoctors();
    }
}
