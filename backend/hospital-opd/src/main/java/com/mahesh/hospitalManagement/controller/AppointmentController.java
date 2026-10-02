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
    @RequestMapping(value = "/{id}/check-in", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDto>> checkInPatient(@PathVariable UUID id) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        AppointmentDto checkedIn = appointmentService.checkInPatient(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(checkedIn, "Patient checked in to queue"));
    }

    /**
     * Retrieves appointment details by appointment ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentDto>> getAppointmentById(@PathVariable UUID id) {
        AppointmentDto dto = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
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

    /**
     * Searches and filters appointments by date, doctor, status, or patient.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<AppointmentDto>>> searchAppointments(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date,
            @RequestParam(required = false) UUID doctorId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID patientId) {
        List<AppointmentDto> results = appointmentService.searchAppointments(date, doctorId, status, patientId);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    /**
     * Reschedules an appointment to a new date/time or reassigns doctor.
     */
    @PatchMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDto>> rescheduleAppointment(
            @PathVariable UUID id,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime newTime,
            @RequestParam(required = false) UUID newDoctorId) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        AppointmentDto updated = appointmentService.rescheduleAppointment(id, newTime, newDoctorId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(updated, "Appointment rescheduled successfully"));
    }

    /**
     * Cancels an appointment according to hospital policy with cancellation reason.
     */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'PATIENT')")
    public ResponseEntity<ApiResponse<AppointmentDto>> cancelAppointment(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        AppointmentDto cancelled = appointmentService.cancelAppointment(id, reason, currentUser);
        return ResponseEntity.ok(ApiResponse.success(cancelled, "Appointment cancelled successfully"));
    }

    /**
     * Confirms a scheduled appointment.
     */
    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDto>> confirmAppointment(@PathVariable UUID id) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        AppointmentDto confirmed = appointmentService.confirmAppointment(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(confirmed, "Appointment confirmed"));
    }

    /**
     * Marks an appointment as NO_SHOW.
     */
    @PatchMapping("/{id}/no-show")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDto>> markNoShow(@PathVariable UUID id) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        AppointmentDto marked = appointmentService.markNoShow(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(marked, "Appointment marked as NO_SHOW"));
    }

    /**
     * Dispatches/records an appointment reminder notification.
     */
    @PostMapping("/{id}/remind")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDto>> sendReminder(@PathVariable UUID id) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        AppointmentDto reminded = appointmentService.sendReminder(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(reminded, "Appointment reminder notification dispatched"));
    }
}
