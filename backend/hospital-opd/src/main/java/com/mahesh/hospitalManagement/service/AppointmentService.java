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

import java.time.LocalDateTime;
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
        if (dto.getDoctorId() == null) {
            throw new BusinessValidationException("Doctor ID is required to book appointment");
        }
        if (dto.getPatientId() == null) {
            throw new BusinessValidationException("Patient ID is required to book appointment");
        }
        if (dto.getAppointmentTime() == null || dto.getAppointmentTime().isBefore(LocalDateTime.now())) {
            throw new BusinessValidationException("Appointment time must be in the future");
        }
        int hour = dto.getAppointmentTime().getHour();
        if (hour < 8 || hour >= 20) {
            throw new BusinessValidationException("Appointment time is outside doctor's working hours (08:00 - 20:00)");
        }

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

        if ("CHECKED_IN".equals(appointment.getStatus()) || "COMPLETED".equals(appointment.getStatus()) || "CANCELLED".equals(appointment.getStatus())) {
            throw new BusinessValidationException("Cannot check in appointment with status: " + appointment.getStatus());
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

    @Transactional(readOnly = true)
    public List<AppointmentDto> searchAppointments(java.time.LocalDate date, UUID doctorId, String status, UUID patientId) {
        List<Appointment> list;
        if (date != null) {
            java.time.LocalDateTime start = date.atStartOfDay();
            java.time.LocalDateTime end = date.atTime(java.time.LocalTime.MAX);
            if (doctorId != null) {
                list = appointmentRepository.findByDoctorIdAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(doctorId, start, end);
            } else {
                list = appointmentRepository.findByAppointmentTimeBetweenOrderByAppointmentTimeAsc(start, end);
            }
        } else if (patientId != null) {
            list = appointmentRepository.findByPatientIdOrderByAppointmentTimeDesc(patientId);
        } else if (doctorId != null) {
            list = appointmentRepository.findByDoctorIdOrderByAppointmentTimeAsc(doctorId);
        } else {
            list = appointmentRepository.findAllByOrderByAppointmentTimeDesc();
        }

        return list.stream()
                .filter(a -> status == null || status.isBlank() || status.equalsIgnoreCase(a.getStatus()))
                .filter(a -> patientId == null || (a.getPatient() != null && patientId.equals(a.getPatient().getId())))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentDto rescheduleAppointment(UUID id, java.time.LocalDateTime newTime, UUID newDoctorId, String currentUser) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        if ("COMPLETED".equals(appointment.getStatus()) || "CANCELLED".equals(appointment.getStatus())) {
            throw new BusinessValidationException("Cannot reschedule appointment with status: " + appointment.getStatus());
        }

        if (newDoctorId != null && !newDoctorId.equals(appointment.getDoctor().getId())) {
            Doctor newDoctor = doctorRepository.findById(newDoctorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + newDoctorId));
            appointment.setDoctor(newDoctor);
        }

        java.time.LocalDateTime targetTime = (newTime != null) ? newTime : appointment.getAppointmentTime();
        if (appointmentRepository.existsByDoctorIdAndAppointmentTime(appointment.getDoctor().getId(), targetTime)) {
            throw new BusinessValidationException("Slot already occupied for doctor at " + targetTime);
        }

        String oldTime = appointment.getAppointmentTime().toString();
        appointment.setAppointmentTime(targetTime);
        appointment.setStatus("RESCHEDULED");
        appointment.setUpdatedBy(currentUser);

        Appointment saved = appointmentRepository.save(appointment);
        auditService.logAction(currentUser, "RESCHEDULE_APPOINTMENT", oldTime, targetTime.toString(), "127.0.0.1", "WEB", "HOSPITAL");
        return mapToDto(saved);
    }

    @Transactional
    public AppointmentDto cancelAppointment(UUID id, String reason, String currentUser) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        if ("COMPLETED".equals(appointment.getStatus()) || "CANCELLED".equals(appointment.getStatus())) {
            throw new BusinessValidationException("Appointment is already " + appointment.getStatus());
        }

        appointment.setStatus("CANCELLED");
        appointment.setCancellationReason(reason != null ? reason : "Cancelled at front desk");
        appointment.setUpdatedBy(currentUser);

        Appointment saved = appointmentRepository.save(appointment);
        auditService.logAction(currentUser, "CANCEL_APPOINTMENT", null, "Cancelled reason: " + reason, "127.0.0.1", "WEB", "HOSPITAL");
        return mapToDto(saved);
    }

    @Transactional
    public AppointmentDto confirmAppointment(UUID id, String currentUser) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        appointment.setStatus("CONFIRMED");
        appointment.setConfirmedAt(java.time.LocalDateTime.now());
        appointment.setConfirmedBy(currentUser);
        appointment.setUpdatedBy(currentUser);

        Appointment saved = appointmentRepository.save(appointment);
        auditService.logAction(currentUser, "CONFIRM_APPOINTMENT", null, "Confirmed by " + currentUser, "127.0.0.1", "WEB", "HOSPITAL");
        return mapToDto(saved);
    }

    @Transactional
    public AppointmentDto markNoShow(UUID id, String currentUser) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        appointment.setStatus("NO_SHOW");
        appointment.setUpdatedBy(currentUser);

        Appointment saved = appointmentRepository.save(appointment);
        auditService.logAction(currentUser, "MARK_NO_SHOW", null, "Patient marked as NO_SHOW", "127.0.0.1", "WEB", "HOSPITAL");
        return mapToDto(saved);
    }

    @Transactional
    public AppointmentDto sendReminder(UUID id, String currentUser) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        appointment.setReminderSentAt(java.time.LocalDateTime.now());
        appointment.setUpdatedBy(currentUser);

        Appointment saved = appointmentRepository.save(appointment);
        auditService.logAction(currentUser, "SEND_REMINDER", null, "Appointment reminder notification logged", "127.0.0.1", "WEB", "HOSPITAL");
        return mapToDto(saved);
    }

    public AppointmentDto mapToDto(Appointment appointment) {
        String deptName = (appointment.getDoctor() != null && appointment.getDoctor().getDepartments() != null && !appointment.getDoctor().getDepartments().isEmpty())
                ? appointment.getDoctor().getDepartments().iterator().next().getName()
                : (appointment.getDoctor() != null ? appointment.getDoctor().getSpecialization() : "General OPD");

        return AppointmentDto.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatient() != null ? appointment.getPatient().getId() : null)
                .patientName(appointment.getPatient() != null ? appointment.getPatient().getName() : null)
                .patientUhid(appointment.getPatient() != null ? appointment.getPatient().getUhid() : null)
                .doctorId(appointment.getDoctor() != null ? appointment.getDoctor().getId() : null)
                .doctorName(appointment.getDoctor() != null ? appointment.getDoctor().getName() : null)
                .departmentName(deptName)
                .appointmentTime(appointment.getAppointmentTime())
                .reason(appointment.getReason())
                .status(appointment.getStatus())
                .queueOrder(appointment.getQueueOrder())
                .tokenNumber(appointment.getTokenNumber())
                .cancellationReason(appointment.getCancellationReason())
                .confirmedAt(appointment.getConfirmedAt())
                .confirmedBy(appointment.getConfirmedBy())
                .reminderSentAt(appointment.getReminderSentAt())
                .referralSource(appointment.getReferralSource())
                .build();
    }

    @Transactional(readOnly = true)
    public AppointmentDto getAppointmentById(UUID id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));
        return mapToDto(appointment);
    }
}
