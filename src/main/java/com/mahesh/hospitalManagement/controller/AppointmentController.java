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

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDto>> bookAppointment(@RequestBody AppointmentDto dto) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        AppointmentDto booked = appointmentService.bookAppointment(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(booked, "Appointment booked successfully"));
    }

    @PostMapping("/{id}/check-in")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDto>> checkInPatient(@PathVariable UUID id) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        AppointmentDto checkedIn = appointmentService.checkInPatient(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(checkedIn, "Patient checked in to queue"));
    }

    @GetMapping("/doctor/{doctorId}/queue")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'NURSE', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AppointmentDto>>> getDoctorQueue(@PathVariable UUID doctorId) {
        List<AppointmentDto> queue = appointmentService.getDoctorQueue(doctorId);
        return ResponseEntity.ok(ApiResponse.success(queue));
    }

    @GetMapping("/patient/{patientId}/history")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AppointmentDto>>> getPatientHistory(@PathVariable UUID patientId) {
        List<AppointmentDto> history = appointmentService.getPatientAppointmentHistory(patientId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
