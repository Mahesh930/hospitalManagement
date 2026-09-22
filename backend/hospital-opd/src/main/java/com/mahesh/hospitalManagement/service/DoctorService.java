package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.DoctorDashboardDto;
import com.mahesh.hospitalManagement.dto.DoctorResponseDto;
import com.mahesh.hospitalManagement.dto.OnboardDoctorRequestDto;
import com.mahesh.hospitalManagement.entity.*;
import com.mahesh.hospitalManagement.entity.type.RoleType;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service providing core clinical operational logic for the Doctor role in MediCore ERP.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientVisitRepository patientVisitRepository;
    private final VitalSignsRepository vitalSignsRepository;
    private final OPDConsultationRepository opdConsultationRepository;
    private final AuditService auditService;

    public List<DoctorResponseDto> getAllDoctors() {
        return doctorRepository.findAll()
                .stream()
                .map(doctor -> modelMapper.map(doctor, DoctorResponseDto.class))
                .collect(Collectors.toList());
    }

    @Transactional
    public DoctorResponseDto onBoardNewDoctor(OnboardDoctorRequestDto dto) {
        log.info("Onboarding new doctor for user ID: {}", dto.getUserId());

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + dto.getUserId()));

        if (doctorRepository.findByUserId(dto.getUserId()).isPresent()) {
            throw new IllegalArgumentException("User is already registered as a doctor");
        }

        Doctor doctor = Doctor.builder()
                .name(dto.getName())
                .specialization(dto.getSpecialization())
                .registrationNumber(dto.getRegistrationNumber())
                .consultationFee(dto.getConsultationFee() != null ? dto.getConsultationFee() : 500.0)
                .email(dto.getEmail() != null ? dto.getEmail() : user.getUsername() + "@medicore.local")
                .user(user)
                .build();

        user.getRoles().add(RoleType.DOCTOR);
        userRepository.save(user);

        Doctor savedDoctor = doctorRepository.save(doctor);
        log.info("Successfully onboarded doctor: {}", savedDoctor.getName());

        return modelMapper.map(savedDoctor, DoctorResponseDto.class);
    }

    /**
     * Resolves the Doctor entity for a given authenticated username.
     */
    public Doctor resolveDoctorForUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found: " + username));

        return doctorRepository.findByUserId(user.getId())
                .orElseGet(() -> doctorRepository.findByEmail(username)
                        .orElseGet(() -> doctorRepository.findAll().stream().findFirst()
                                .orElseThrow(() -> new ResourceNotFoundException("No Doctor record found for user: " + username))));
    }

    /**
     * Compiles the comprehensive Doctor Clinical Dashboard:
     * - Key clinical metrics (Today's Total, Waiting, In-Consultation, Completed)
     * - Active Clinical Queue with vital signs summary and allergy badges
     * - Today's consultation schedule timeline
     * - Recent consultations
     * - Real-time critical alerts (severe allergies, abnormal vitals)
     */
    @Transactional(readOnly = true)
    public DoctorDashboardDto getDoctorDashboard(String username) {
        Doctor doctor = resolveDoctorForUsername(username);

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        // Fetch active queue from PatientVisit or checked-in Appointments
        List<PatientVisit> activeVisits = patientVisitRepository.findActiveDoctorQueue(doctor.getId());
        List<Appointment> todayAppointments = appointmentRepository.findByDoctorIdAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(
                doctor.getId(), startOfDay, endOfDay);

        long waitingCount = activeVisits.stream()
                .filter(v -> "WAITING_DOCTOR".equalsIgnoreCase(v.getStatus()) || "CHECKED_IN".equalsIgnoreCase(v.getStatus()) || "IN_VITALS".equalsIgnoreCase(v.getStatus()))
                .count();

        long inProgressCount = activeVisits.stream()
                .filter(v -> "IN_CONSULTATION".equalsIgnoreCase(v.getStatus()))
                .count();

        long completedCount = opdConsultationRepository.countTodayByDoctorAndStatus(doctor.getId(), "COMPLETED", startOfDay, endOfDay);

        // Build active queue item DTOs
        List<DoctorDashboardDto.DoctorQueueItemDto> queueItems = new ArrayList<>();
        List<String> criticalAlerts = new ArrayList<>();

        int order = 1;
        for (PatientVisit visit : activeVisits) {
            Patient patient = visit.getPatient();
            Appointment appt = visit.getAppointment();

            // Fetch vitals
            Optional<VitalSigns> vitals = (appt != null)
                    ? vitalSignsRepository.findActiveByAppointmentId(appt.getId())
                    : vitalSignsRepository.findTopByPatientIdOrderByRecordedAtDesc(patient.getId());

            List<String> allergyNames = (patient.getAllergies() != null)
                    ? patient.getAllergies().stream().map(PatientAllergy::getAllergen).collect(Collectors.toList())
                    : Collections.emptyList();

            if (!allergyNames.isEmpty()) {
                criticalAlerts.add("Safety Alert: Patient " + patient.getName() + " (" + patient.getUhid() + ") has documented allergies: " + String.join(", ", allergyNames));
            }

            vitals.ifPresent(v -> {
                if (Boolean.TRUE.equals(v.getIsAbnormal())) {
                    criticalAlerts.add("Vitals Alert: Patient " + patient.getName() + " has abnormal vitals recorded: BP " + v.getBloodPressure() + ", Pulse " + v.getPulseRate());
                }
            });

            queueItems.add(DoctorDashboardDto.DoctorQueueItemDto.builder()
                    .appointmentId(appt != null ? appt.getId() : null)
                    .visitId(visit.getId())
                    .patientId(patient.getId())
                    .tokenNumber(visit.getTokenNumber() != null ? visit.getTokenNumber() : "T-" + (100 + order))
                    .queueOrder(order++)
                    .patientName(patient.getName())
                    .patientUhid(patient.getUhid())
                    .age(patient.getAge())
                    .gender(patient.getGender())
                    .appointmentTime(appt != null ? appt.getAppointmentTime() : visit.getCheckInTime())
                    .status(visit.getStatus())
                    .priorityRank(visit.getPriorityRank())
                    .chiefComplaint(visit.getNotes())
                    .bloodPressure(vitals.map(VitalSigns::getBloodPressure).orElse("120/80"))
                    .pulseRate(vitals.map(VitalSigns::getPulseRate).orElse(72.0))
                    .temperature(vitals.map(VitalSigns::getTemperature).orElse(98.6))
                    .weight(vitals.map(VitalSigns::getWeightKg).orElse(70.0))
                    .spo2(vitals.map(VitalSigns::getSpo2).orElse(98.0))
                    .allergyCount(allergyNames.size())
                    .allergyNames(allergyNames)
                    .build());
        }

        // Fallback: If no PatientVisit entries exist, convert today's appointments into queue items
        if (queueItems.isEmpty()) {
            for (Appointment appt : todayAppointments) {
                Patient patient = appt.getPatient();
                List<String> allergyNames = (patient.getAllergies() != null)
                        ? patient.getAllergies().stream().map(PatientAllergy::getAllergen).collect(Collectors.toList())
                        : Collections.emptyList();

                Optional<VitalSigns> vitals = vitalSignsRepository.findActiveByAppointmentId(appt.getId());

                queueItems.add(DoctorDashboardDto.DoctorQueueItemDto.builder()
                        .appointmentId(appt.getId())
                        .visitId(null)
                        .patientId(patient.getId())
                        .tokenNumber("T-" + (100 + order))
                        .queueOrder(appt.getQueueOrder() != null ? appt.getQueueOrder() : order++)
                        .patientName(patient.getName())
                        .patientUhid(patient.getUhid())
                        .age(patient.getAge())
                        .gender(patient.getGender())
                        .appointmentTime(appt.getAppointmentTime())
                        .status(appt.getStatus())
                        .priorityRank(2)
                        .chiefComplaint(appt.getReason())
                        .bloodPressure(vitals.map(VitalSigns::getBloodPressure).orElse("120/80"))
                        .pulseRate(vitals.map(VitalSigns::getPulseRate).orElse(72.0))
                        .temperature(vitals.map(VitalSigns::getTemperature).orElse(98.6))
                        .weight(vitals.map(VitalSigns::getWeightKg).orElse(70.0))
                        .spo2(vitals.map(VitalSigns::getSpo2).orElse(98.0))
                        .allergyCount(allergyNames.size())
                        .allergyNames(allergyNames)
                        .build());
            }
        }

        // Build schedule slots
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
        List<DoctorDashboardDto.DoctorScheduleSlotDto> scheduleSlots = todayAppointments.stream()
                .map(a -> DoctorDashboardDto.DoctorScheduleSlotDto.builder()
                        .slotTime(a.getAppointmentTime() != null ? a.getAppointmentTime().format(timeFormatter) : "09:00 AM")
                        .patientName(a.getPatient().getName())
                        .patientUhid(a.getPatient().getUhid())
                        .status(a.getStatus())
                        .appointmentId(a.getId())
                        .build())
                .collect(Collectors.toList());

        // Fetch recent consultations
        List<OPDConsultation> recentConsultations = opdConsultationRepository.findByDoctorIdOrderByCreatedAtDesc(doctor.getId())
                .stream().limit(5).collect(Collectors.toList());

        List<DoctorDashboardDto.RecentConsultationSummaryDto> recentPatients = recentConsultations.stream()
                .map(c -> DoctorDashboardDto.RecentConsultationSummaryDto.builder()
                        .consultationId(c.getId())
                        .appointmentId(c.getAppointment() != null ? c.getAppointment().getId() : null)
                        .patientId(c.getPatient().getId())
                        .patientName(c.getPatient().getName())
                        .patientUhid(c.getPatient().getUhid())
                        .icdCode(c.getIcdCode())
                        .diagnosisNotes(c.getDiagnosisNotes())
                        .completedAt(c.getUpdatedAt() != null ? c.getUpdatedAt() : c.getCreatedAt())
                        .prescriptionItemCount(c.getPrescription() != null && c.getPrescription().getItems() != null ? c.getPrescription().getItems().size() : 0)
                        .build())
                .collect(Collectors.toList());

        return DoctorDashboardDto.builder()
                .doctorId(doctor.getId())
                .doctorName(doctor.getName())
                .specialization(doctor.getSpecialization())
                .registrationNumber(doctor.getRegistrationNumber())
                .roomNumber(doctor.getRoomNumber() != null ? doctor.getRoomNumber() : "OPD Room 101")
                .consultationFee(doctor.getConsultationFee())
                .isAvailable(Boolean.TRUE.equals(doctor.getIsAvailable()))
                .todayAppointmentsCount(todayAppointments.size())
                .waitingPatientsCount(waitingCount)
                .inProgressCount(inProgressCount)
                .completedCount(completedCount)
                .activeQueue(queueItems)
                .todaySchedule(scheduleSlots)
                .recentPatients(recentPatients)
                .criticalAlerts(criticalAlerts)
                .build();
    }

    /**
     * Calls a patient into consultation, updating status to IN_CONSULTATION and setting start time.
     */
    @Transactional
    public void callPatientInQueue(UUID appointmentId, String currentUser) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        appointment.setStatus("IN_CONSULTATION");
        appointmentRepository.save(appointment);

        patientVisitRepository.findByAppointmentId(appointmentId).ifPresent(v -> {
            v.setStatus("IN_CONSULTATION");
            v.setConsultationStartTime(LocalDateTime.now());
            patientVisitRepository.save(v);
        });

        auditService.logAction(currentUser, "CALL_PATIENT_IN_QUEUE", "WAITING", "IN_CONSULTATION", null, null, null);
    }

    /**
     * Skips patient in queue or marks as no-show.
     */
    @Transactional
    public void skipPatientInQueue(UUID appointmentId, String currentUser) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        appointment.setStatus("NO_SHOW");
        appointmentRepository.save(appointment);

        patientVisitRepository.findByAppointmentId(appointmentId).ifPresent(v -> {
            v.setStatus("NO_SHOW");
            patientVisitRepository.save(v);
        });

        auditService.logAction(currentUser, "SKIP_PATIENT_IN_QUEUE", "WAITING", "NO_SHOW", null, null, null);
    }

    /**
     * Updates doctor availability and room number.
     */
    @Transactional
    public DoctorResponseDto updateDoctorAvailability(String username, Boolean isAvailable, String roomNumber) {
        Doctor doctor = resolveDoctorForUsername(username);
        if (isAvailable != null) doctor.setIsAvailable(isAvailable);
        if (roomNumber != null && !roomNumber.isBlank()) doctor.setRoomNumber(roomNumber);

        Doctor saved = doctorRepository.save(doctor);
        auditService.logAction(username, "UPDATE_DOCTOR_AVAILABILITY", null, "Available: " + isAvailable, null, null, null);
        return modelMapper.map(saved, DoctorResponseDto.class);
    }
}