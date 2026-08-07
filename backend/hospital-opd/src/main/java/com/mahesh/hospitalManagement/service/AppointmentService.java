package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.AppointmentDto;
import com.mahesh.hospitalManagement.entity.Appointment;
import com.mahesh.hospitalManagement.entity.Doctor;
import com.mahesh.hospitalManagement.entity.Patient;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.AppointmentRepository;
import com.mahesh.hospitalManagement.repository.DoctorRepository;
import com.mahesh.hospitalManagement.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AuditService auditService;

    @Transactional
    public AppointmentDto bookAppointment(AppointmentDto dto, String currentUser) {
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + dto.getDoctorId()));

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        // Double booking check
        if (appointmentRepository.existsByDoctorIdAndAppointmentTime(dto.getDoctorId(), dto.getAppointmentTime())) {
            throw new BusinessValidationException("Slot no longer available for doctor at " + dto.getAppointmentTime());
        }

        Appointment appointment = Appointment.builder()
                .doctor(doctor)
                .patient(patient)
                .appointmentTime(dto.getAppointmentTime())
                .reason(dto.getReason())
                .status("BOOKED")
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        auditService.logAction(currentUser, "BOOK_APPOINTMENT", null, saved.getId().toString(), null, null, null);

        return mapToDto(saved);
    }

    @Transactional
    public AppointmentDto checkInPatient(UUID appointmentId, String currentUser) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + appointmentId));

        if ("CHECKED_IN".equals(appointment.getStatus()) || "COMPLETED".equals(appointment.getStatus())) {
            throw new BusinessValidationException("Appointment is already " + appointment.getStatus());
        }

        // Get current queue count for doctor to assign queueOrder
        List<Appointment> existingQueue = appointmentRepository.findByDoctorIdAndStatusOrderByQueueOrderAsc(
                appointment.getDoctor().getId(), "CHECKED_IN");

        int nextQueueOrder = existingQueue.size() + 1;
        appointment.setStatus("CHECKED_IN");
        appointment.setQueueOrder(nextQueueOrder);

        Appointment updated = appointmentRepository.save(appointment);

        auditService.logAction(currentUser, "CHECK_IN_PATIENT", "BOOKED", "CHECKED_IN (Queue: " + nextQueueOrder + ")", null, null, null);

        return mapToDto(updated);
    }

    @Transactional(readOnly = true)
    public List<AppointmentDto> getDoctorQueue(UUID doctorId) {
        return appointmentRepository.findByDoctorIdAndStatusOrderByQueueOrderAsc(doctorId, "CHECKED_IN").stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentDto> getPatientAppointmentHistory(UUID patientId) {
        return appointmentRepository.findByPatientIdOrderByAppointmentTimeDesc(patientId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public AppointmentDto mapToDto(Appointment appointment) {
        return AppointmentDto.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatient().getId())
                .patientName(appointment.getPatient().getName())
                .patientUhid(appointment.getPatient().getUhid())
                .doctorId(appointment.getDoctor().getId())
                .doctorName(appointment.getDoctor().getName())
                .appointmentTime(appointment.getAppointmentTime())
                .reason(appointment.getReason())
                .status(appointment.getStatus())
                .queueOrder(appointment.getQueueOrder())
                .build();
    }
}
