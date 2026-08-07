package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.AppointmentDto;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for scheduling patient appointments, check-ins, and managing doctor consultation queues.
 * 
 * Logic Overview:
 * 1. Booking: Schedules an appointment in SCHEDULED state for a specific doctor, department, and time slot.
 * 2. Check-In: Transitions appointment status from SCHEDULED to CHECKED_IN, assigning a queue token number.
 * 3. Doctor Queue: Provides real-time listing of checked-in patients awaiting consultation for a doctor.
 * 4. Patient History: Lists all past and upcoming appointment records associated with a patient.
 */
@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    /**
     * Books a new appointment slot for a patient.
     * 
     * Logic Flow:
     * - Validates patient existence, doctor availability, and slot conflicts.
     * - Sets initial status to SCHEDULED.
     * - Captures booking user for audit purposes.
     * 
     * @param dto Payload with patientId, doctorId, appointmentDateTime, reason.
     * @return ResponseEntity with created AppointmentDto.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDto>> bookAppointment(@RequestBody AppointmentDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        AppointmentDto booked = appointmentService.bookAppointment(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(booked, "Appointment booked successfully"));
    }

    /**
     * Marks a patient as checked-in upon arrival at the hospital reception.
     * 
     * Logic Flow:
     * - Verifies appointment is currently in SCHEDULED state.
     * - Transitions status to CHECKED_IN and generates sequential queue number.
     * - Updates doctor's OPD live queue.
     * 
     * @param id Appointment UUID identifier.
     * @return ResponseEntity holding updated AppointmentDto with queue token info.
     */
    @PostMapping("/{id}/check-in")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDto>> checkInPatient(@PathVariable UUID id) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        AppointmentDto checkedIn = appointmentService.checkInPatient(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(checkedIn, "Patient checked in to queue"));
    }

    /**
     * Fetches the current live OPD queue for a given doctor.
     * 
     * @param doctorId Doctor's unique UUID identifier.
     * @return ResponseEntity holding list of checked-in patient appointments.
     */
    @GetMapping("/doctor/{doctorId}/queue")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AppointmentDto>>> getDoctorQueue(@PathVariable UUID doctorId) {
        List<AppointmentDto> queue = appointmentService.getDoctorQueue(doctorId);
        return ResponseEntity.ok(ApiResponse.success(queue));
    }

    /**
     * Retrieves complete appointment history for a specified patient.
     * 
     * @param patientId Patient's unique UUID identifier.
     * @return ResponseEntity containing historical appointment records.
     */
    @GetMapping("/patient/{patientId}/history")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AppointmentDto>>> getPatientHistory(@PathVariable UUID patientId) {
        List<AppointmentDto> history = appointmentService.getPatientAppointmentHistory(patientId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
