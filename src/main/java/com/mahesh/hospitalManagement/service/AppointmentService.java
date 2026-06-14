package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.AppointmentResponseDto;
import com.mahesh.hospitalManagement.entity.Appointment;
import com.mahesh.hospitalManagement.entity.Doctor;
import com.mahesh.hospitalManagement.entity.Patient;
import com.mahesh.hospitalManagement.repository.AppointmentRepository;
import com.mahesh.hospitalManagement.repository.DoctorRepository;
import com.mahesh.hospitalManagement.repository.PatientRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final ModelMapper modelMapper;

    /**
     * Creates a new appointment based on the request DTO.
     * @param createAppointmentRequestDto DTO containing doctor ID, patient ID, and appointment details.
     * @return AppointmentResponseDto of the newly created appointment.
     */
    @Transactional
    @Secured("ROLE_PATIENT")
    public AppointmentResponseDto createNewAppointment(com.mahesh.hospitalManagement.dto.CreateAppointmentRequestDto createAppointmentRequestDto){
        Doctor doctor = doctorRepository.findById(createAppointmentRequestDto.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        Patient patient = patientRepository.findById(createAppointmentRequestDto.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        Appointment appointment = modelMapper.map(createAppointmentRequestDto, Appointment.class);
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);

        // Maintain bidirectional consistency
        patient.getAppointments().add(appointment);

        Appointment savedAppointment = appointmentRepository.save(appointment);
        return modelMapper.map(savedAppointment, AppointmentResponseDto.class);
    }

    /**
     * Reassigns an existing appointment to a different doctor.
     * @param appointmentId The ID of the appointment to reassign.
     * @param doctorId The ID of the new doctor.
     * @return AppointmentResponseDto of the updated appointment.
     */
    @Transactional
    @PreAuthorize("hasAuthority('appointment:write') OR #doctorId == authentication.principal.id")
    public AppointmentResponseDto reAssignAppointmentToAnotherDoctor(Long appointmentId, Long doctorId){
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        appointment.setDoctor(doctor);
        // Maintain bidirectional consistency
        doctor.getAppointments().add(appointment);

        return modelMapper.map(appointment, AppointmentResponseDto.class);
    }

    /**
     * Retrieves all appointments for a specific doctor.
     * @param doctorId The ID of the doctor.
     * @return List of AppointmentResponseDto.
     */
    @PreAuthorize("hasRole('ADMIN') OR (hasRole('DOCTOR') AND #doctorId == authentication.principal.id)")
    public List<AppointmentResponseDto> getAllAppointmentsOfDoctor(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        return doctor.getAppointments()
                .stream()
                .map(appointment -> modelMapper.map(appointment, AppointmentResponseDto.class))
                .collect(Collectors.toList());
    }
}
