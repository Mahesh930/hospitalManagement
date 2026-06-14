package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.AppointmentResponseDto;
import com.mahesh.hospitalManagement.dto.CreateAppointmentRequestDto;
import com.mahesh.hospitalManagement.dto.PatientResponseDto;
import com.mahesh.hospitalManagement.service.AppointmentService;
import com.mahesh.hospitalManagement.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
public class PatientController {
    private final PatientService patientService;
    private final AppointmentService appointmentService;

    /**
     * Endpoint for a patient to create a new appointment.
     * @param createAppointmentRequestDto Request body containing appointment details.
     * @return ResponseEntity with the created appointment details.
     */
    @PostMapping("/appointments")
    public ResponseEntity<AppointmentResponseDto> createNewAppointment(
            @RequestBody CreateAppointmentRequestDto createAppointmentRequestDto)
    {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.createNewAppointment(createAppointmentRequestDto));
    }

    /**
     * Endpoint for the logged-in patient to view their profile.
     * Uses the current authenticated user's ID.
     * @return ResponseEntity with the patient's profile details.
     */
    @GetMapping("/profile")
    public ResponseEntity<PatientResponseDto> getPatientProfile() {
        com.mahesh.hospitalManagement.entity.User user = (com.mahesh.hospitalManagement.entity.User) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(patientService.getPatientById(user.getId()));
    }
}
