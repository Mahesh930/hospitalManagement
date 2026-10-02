package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.*;
import com.mahesh.hospitalManagement.entity.*;
import com.mahesh.hospitalManagement.entity.type.RoleType;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
 * Covers: Dashboard, Queue, Patient Clinical Summary, Chronological Timeline,
 * Diagnostic Orders & Results, Abnormal Result Reviews, Inpatient Ward Rounds (SOAP Notes),
 * Medical Certificates, Doctor-to-Nurse Clinical Orders, Admission & Discharge Recommendations,
 * and Diagnostic/Medicine Catalogues.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientVisitRepository patientVisitRepository;
    private final VitalSignsRepository vitalSignsRepository;
    private final OPDConsultationRepository opdConsultationRepository;
    private final PatientRepository patientRepository;
    private final DiagnosticBookingRepository diagnosticBookingRepository;
    private final InpatientProgressNoteRepository inpatientProgressNoteRepository;
    private final MedicalCertificateRepository medicalCertificateRepository;
    private final BedAdmissionRepository bedAdmissionRepository;
    private final NursingTaskRepository nursingTaskRepository;
    private final WardRepository wardRepository;
    private final DiagnosisCatalogueRepository diagnosisCatalogueRepository;
    private final MedicineCatalogueRepository medicineCatalogueRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AuditService auditService;

    public List<DoctorResponseDto> getAllDoctors() {
        return doctorRepository.findAll()
                .stream()
                .map(this::mapDoctorToDto)
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

        return mapDoctorToDto(savedDoctor);
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
        return mapDoctorToDto(saved);
    }

    /**
     * Updates permitted doctor professional profile fields.
     */
    @Transactional
    public DoctorResponseDto updateDoctorProfile(DoctorResponseDto dto, String username) {
        Doctor doctor = resolveDoctorForUsername(username);

        if (dto.getSpecialization() != null) doctor.setSpecialization(dto.getSpecialization());
        if (dto.getRegistrationNumber() != null) doctor.setRegistrationNumber(dto.getRegistrationNumber());
        if (dto.getConsultationFee() != null) doctor.setConsultationFee(dto.getConsultationFee());
        if (dto.getRoomNumber() != null) doctor.setRoomNumber(dto.getRoomNumber());
        if (dto.getPhone() != null) doctor.setPhone(dto.getPhone());
        if (dto.getQualification() != null) doctor.setQualification(dto.getQualification());
        if (dto.getExperienceYears() != null) doctor.setExperienceYears(dto.getExperienceYears());
        if (dto.getScheduleSummary() != null) doctor.setScheduleSummary(dto.getScheduleSummary());

        Doctor saved = doctorRepository.save(doctor);
        auditService.logAction(username, "UPDATE_DOCTOR_PROFILE", null, "Updated profile for: " + doctor.getName(), null, null, null);
        return mapDoctorToDto(saved);
    }

    /**
     * 360-degree patient clinical summary (vitals, allergies, past diagnoses, active prescriptions, investigations).
     */
    @Transactional(readOnly = true)
    public PatientClinicalSummaryDto getPatientClinicalSummary(UUID patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));

        // Allergies
        List<PatientClinicalSummaryDto.AllergySummaryDto> allergyDtos = (patient.getAllergies() != null)
                ? patient.getAllergies().stream()
                .map(a -> PatientClinicalSummaryDto.AllergySummaryDto.builder()
                        .allergen(a.getAllergen())
                        .severity(a.getSeverity())
                        .reaction(a.getReaction())
                        .build())
                .collect(Collectors.toList())
                : Collections.emptyList();

        // Vitals History
        List<VitalSigns> vitalsList = vitalSignsRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
        List<PatientClinicalSummaryDto.VitalSignsSummaryDto> vitalDtos = vitalsList.stream()
                .map(v -> PatientClinicalSummaryDto.VitalSignsSummaryDto.builder()
                        .bloodPressure(v.getBloodPressure())
                        .pulseRate(v.getPulseRate())
                        .temperature(v.getTemperature())
                        .spo2(v.getSpo2())
                        .respiratoryRate(v.getRespiratoryRate())
                        .weightKg(v.getWeightKg())
                        .recordedAt(v.getRecordedAt())
                        .isAbnormal(v.getIsAbnormal())
                        .build())
                .collect(Collectors.toList());

        PatientClinicalSummaryDto.VitalSignsSummaryDto latestVitals = vitalDtos.isEmpty() ? null : vitalDtos.get(0);

        // Past Consultations
        List<OPDConsultation> consultations = opdConsultationRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        List<PatientClinicalSummaryDto.ConsultationBriefDto> pastConsultations = consultations.stream()
                .map(c -> PatientClinicalSummaryDto.ConsultationBriefDto.builder()
                        .consultationId(c.getId())
                        .consultationDate(c.getCreatedAt() != null ? c.getCreatedAt() : LocalDateTime.now())
                        .doctorName(c.getDoctor() != null ? c.getDoctor().getName() : "Dr. Clinician")
                        .icdCode(c.getIcdCode())
                        .diagnosisNotes(c.getDiagnosisNotes())
                        .status(c.getStatus())
                        .build())
                .collect(Collectors.toList());

        // Active Prescriptions
        List<Prescription> prescriptions = prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        List<PatientClinicalSummaryDto.PrescriptionBriefDto> rxDtos = prescriptions.stream()
                .map(p -> PatientClinicalSummaryDto.PrescriptionBriefDto.builder()
                        .prescriptionId(p.getId())
                        .prescribedDate(p.getCreatedAt() != null ? p.getCreatedAt() : LocalDateTime.now())
                        .doctorName(p.getDoctor() != null ? p.getDoctor().getName() : "Dr. Clinician")
                        .medications(p.getItems() != null ? p.getItems().stream().map(PrescriptionItem::getMedicineName).collect(Collectors.toList()) : Collections.emptyList())
                        .build())
                .collect(Collectors.toList());

        // Investigations
        List<DiagnosticBooking> bookings = diagnosticBookingRepository.findByPatientIdOrderByBookingDateTimeDesc(patientId);
        List<PatientClinicalSummaryDto.InvestigationBriefDto> investigationDtos = bookings.stream()
                .map(b -> PatientClinicalSummaryDto.InvestigationBriefDto.builder()
                        .bookingId(b.getId())
                        .testName(b.getTestName())
                        .category(b.getCategory())
                        .bookingDate(b.getBookingDateTime())
                        .status(b.getStatus())
                        .isAbnormal(b.getIsAbnormal())
                        .resultNotes(b.getResultNotes())
                        .build())
                .collect(Collectors.toList());

        // Check if currently admitted
        Optional<BedAdmission> activeAdmission = bedAdmissionRepository.findByPatientIdAndStatusAndDeletedAtIsNull(patientId, "ADMITTED");
        String activeBed = activeAdmission.map(a -> a.getBed() != null ? a.getBed().getBedNumber() : null).orElse(null);
        String activeWard = activeAdmission.map(a -> (a.getBed() != null && a.getBed().getWard() != null) ? a.getBed().getWard().getName() : null).orElse(null);

        return PatientClinicalSummaryDto.builder()
                .patientId(patient.getId())
                .uhid(patient.getUhid())
                .name(patient.getName())
                .age(patient.getAge())
                .gender(patient.getGender())
                .bloodGroup(patient.getBloodGroup() != null ? patient.getBloodGroup().name() : null)
                .contactNumber(patient.getPhone())
                .allergies(allergyDtos)
                .latestVitals(latestVitals)
                .vitalHistory(vitalDtos)
                .pastConsultations(pastConsultations)
                .activePrescriptions(rxDtos)
                .recentInvestigations(investigationDtos)
                .activeBedNumber(activeBed)
                .activeWardName(activeWard)
                .build();
    }

    /**
     * Unified chronological timeline of clinical events for a patient.
     */
    @Transactional(readOnly = true)
    public List<ClinicalTimelineEventDto> getPatientClinicalTimeline(UUID patientId) {
        List<ClinicalTimelineEventDto> events = new ArrayList<>();

        // Consultations
        List<OPDConsultation> consultations = opdConsultationRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        for (OPDConsultation c : consultations) {
            LocalDateTime ts = c.getCreatedAt() != null ? c.getCreatedAt() : LocalDateTime.now();
            events.add(ClinicalTimelineEventDto.builder()
                    .timestamp(ts)
                    .eventType("CONSULTATION")
                    .title("Consultation: " + (c.getIcdCode() != null ? c.getIcdCode() : "Clinical Review"))
                    .summary(c.getDiagnosisNotes() != null ? c.getDiagnosisNotes() : "OPD Clinical Encounter")
                    .performerName(c.getDoctor() != null ? c.getDoctor().getName() : "Dr. Clinician")
                    .severity(c.getAmended() ? "ALERT" : "NORMAL")
                    .build());
        }

        // Investigations
        List<DiagnosticBooking> bookings = diagnosticBookingRepository.findByPatientIdOrderByBookingDateTimeDesc(patientId);
        for (DiagnosticBooking b : bookings) {
            events.add(ClinicalTimelineEventDto.builder()
                    .timestamp(b.getBookingDateTime())
                    .eventType(b.getCategory() != null ? b.getCategory() : "INVESTIGATION")
                    .title("Ordered: " + b.getTestName() + " (" + b.getStatus() + ")")
                    .summary(b.getResultNotes() != null ? b.getResultNotes() : "Investigation ordered by " + b.getReferringDoctorName())
                    .performerName(b.getReferringDoctorName() != null ? b.getReferringDoctorName() : "Doctor")
                    .severity(Boolean.TRUE.equals(b.getIsAbnormal()) ? "CRITICAL" : "NORMAL")
                    .build());
        }

        // Vitals
        List<VitalSigns> vitals = vitalSignsRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
        for (VitalSigns v : vitals) {
            events.add(ClinicalTimelineEventDto.builder()
                    .timestamp(v.getRecordedAt())
                    .eventType("VITALS")
                    .title("Vitals Recorded: BP " + v.getBloodPressure() + ", Pulse " + v.getPulseRate())
                    .summary("Temp: " + v.getTemperature() + "°F, SpO2: " + v.getSpo2() + "%")
                    .performerName(v.getRecordedBy() != null ? v.getRecordedBy() : "Nursing Staff")
                    .severity(Boolean.TRUE.equals(v.getIsAbnormal()) ? "ALERT" : "NORMAL")
                    .build());
        }

        // Inpatient Notes
        List<InpatientProgressNote> notes = inpatientProgressNoteRepository.findByPatientIdOrderByRoundDateTimeDesc(patientId);
        for (InpatientProgressNote n : notes) {
            events.add(ClinicalTimelineEventDto.builder()
                    .timestamp(n.getRoundDateTime())
                    .eventType("PROGRESS_NOTE")
                    .title("Ward Round Note: " + n.getNoteType())
                    .summary("Assessment: " + n.getAssessment() + " | Plan: " + n.getPlan())
                    .performerName(n.getDoctor() != null ? n.getDoctor().getName() : "Doctor")
                    .severity(Boolean.TRUE.equals(n.getIsCritical()) ? "CRITICAL" : "NORMAL")
                    .build());
        }

        // Sort descending by timestamp
        events.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        return events;
    }

    /**
     * Orders a laboratory or radiology investigation.
     */
    @Transactional
    public DoctorInvestigationResultDto orderInvestigation(DoctorInvestigationOrderDto dto, String username) {
        Doctor doctor = resolveDoctorForUsername(username);
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.getPatientId()));

        DiagnosticBooking booking = DiagnosticBooking.builder()
                .patientId(patient.getId())
                .patientName(patient.getName())
                .patientUhid(patient.getUhid())
                .testName(dto.getTestName())
                .category(dto.getCategory().toUpperCase())
                .bookingDateTime(dto.getBookingDateTime() != null ? dto.getBookingDateTime() : LocalDateTime.now())
                .status("SCHEDULED")
                .referringDoctorId(doctor.getId())
                .referringDoctorName(doctor.getName())
                .departmentName(dto.getDepartmentName() != null ? dto.getDepartmentName() : "Diagnostics")
                .instructions(dto.getInstructions())
                .clinicalNotes(dto.getClinicalNotes())
                .bookedBy(doctor.getName())
                .build();

        DiagnosticBooking saved = diagnosticBookingRepository.save(booking);
        auditService.logAction(username, "ORDER_INVESTIGATION", null, "Ordered " + dto.getCategory() + " test: " + dto.getTestName() + " for patient " + patient.getUhid(), null, null, null);

        return mapInvestigationToDto(saved);
    }

    /**
     * Fetches doctor's investigation orders and results, with optional category and abnormal filters.
     */
    @Transactional(readOnly = true)
    public List<DoctorInvestigationResultDto> getDoctorInvestigations(String username, String category, Boolean abnormalOnly) {
        Doctor doctor = resolveDoctorForUsername(username);
        List<DiagnosticBooking> bookings;

        if (Boolean.TRUE.equals(abnormalOnly)) {
            bookings = diagnosticBookingRepository.findByReferringDoctorIdAndIsAbnormalTrue(doctor.getId());
        } else {
            bookings = diagnosticBookingRepository.findByReferringDoctorIdOrderByBookingDateTimeDesc(doctor.getId());
        }

        if (category != null && !category.isBlank()) {
            bookings = bookings.stream()
                    .filter(b -> category.equalsIgnoreCase(b.getCategory()))
                    .collect(Collectors.toList());
        }

        return bookings.stream().map(this::mapInvestigationToDto).collect(Collectors.toList());
    }

    /**
     * Doctors can review and sign off on abnormal or normal investigation results.
     */
    @Transactional
    public DoctorInvestigationResultDto reviewAbnormalInvestigation(UUID bookingId, String reviewNotes, String username) {
        DiagnosticBooking booking = diagnosticBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Investigation not found with ID: " + bookingId));

        booking.setClinicalNotes(booking.getClinicalNotes() != null
                ? booking.getClinicalNotes() + "\n[Doctor Review " + LocalDateTime.now() + "]: " + reviewNotes
                : "[Doctor Review " + LocalDateTime.now() + "]: " + reviewNotes);

        DiagnosticBooking saved = diagnosticBookingRepository.save(booking);
        auditService.logAction(username, "REVIEW_INVESTIGATION_RESULT", null, "Reviewed investigation " + booking.getTestName() + " (Abnormal: " + booking.getIsAbnormal() + ")", null, null, null);

        return mapInvestigationToDto(saved);
    }

    /**
     * Records an Inpatient Ward Round SOAP Progress Note.
     */
    @Transactional
    public InpatientProgressNoteDto createInpatientProgressNote(InpatientProgressNoteDto dto, String username) {
        Doctor doctor = resolveDoctorForUsername(username);
        BedAdmission admission = bedAdmissionRepository.findById(dto.getBedAdmissionId())
                .orElseThrow(() -> new ResourceNotFoundException("Bed Admission not found: " + dto.getBedAdmissionId()));

        Patient patient = admission.getPatient();

        InpatientProgressNote note = InpatientProgressNote.builder()
                .bedAdmission(admission)
                .patient(patient)
                .doctor(doctor)
                .noteType(dto.getNoteType() != null ? dto.getNoteType() : "WARD_ROUND")
                .roundDateTime(dto.getRoundDateTime() != null ? dto.getRoundDateTime() : LocalDateTime.now())
                .subjective(dto.getSubjective())
                .objective(dto.getObjective())
                .assessment(dto.getAssessment())
                .plan(dto.getPlan())
                .bloodPressure(dto.getBloodPressure())
                .pulseRate(dto.getPulseRate())
                .temperature(dto.getTemperature())
                .spo2(dto.getSpo2())
                .respiratoryRate(dto.getRespiratoryRate())
                .isCritical(Boolean.TRUE.equals(dto.getIsCritical()))
                .clinicalInstructions(dto.getClinicalInstructions())
                .build();

        InpatientProgressNote saved = inpatientProgressNoteRepository.save(note);
        auditService.logAction(username, "CREATE_INPATIENT_PROGRESS_NOTE", null, "Recorded SOAP note for patient: " + patient.getUhid(), null, null, null);

        return mapProgressNoteToDto(saved);
    }

    /**
     * Returns progress notes for an inpatient admission.
     */
    @Transactional(readOnly = true)
    public List<InpatientProgressNoteDto> getInpatientProgressNotes(UUID admissionId) {
        return inpatientProgressNoteRepository.findByBedAdmissionIdOrderByRoundDateTimeDesc(admissionId)
                .stream()
                .map(this::mapProgressNoteToDto)
                .collect(Collectors.toList());
    }

    /**
     * Issues an official medical certificate.
     */
    @Transactional
    public MedicalCertificateDto issueMedicalCertificate(MedicalCertificateDto dto, String username) {
        Doctor doctor = resolveDoctorForUsername(username);
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.getPatientId()));

        String certNumber = "MC-" + System.currentTimeMillis() % 10000000;

        MedicalCertificate cert = MedicalCertificate.builder()
                .certificateNumber(certNumber)
                .certificateType(dto.getCertificateType().toUpperCase())
                .patient(patient)
                .doctor(doctor)
                .issueDate(dto.getIssueDate() != null ? dto.getIssueDate() : LocalDate.now())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .diagnosis(dto.getDiagnosis())
                .clinicalRemarks(dto.getClinicalRemarks())
                .recommendations(dto.getRecommendations())
                .status("ACTIVE")
                .build();

        MedicalCertificate saved = medicalCertificateRepository.save(cert);
        auditService.logAction(username, "ISSUE_MEDICAL_CERTIFICATE", null, "Issued " + cert.getCertificateType() + " [" + cert.getCertificateNumber() + "] for patient " + patient.getUhid(), null, null, null);

        return mapCertificateToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<MedicalCertificateDto> getPatientCertificates(UUID patientId) {
        return medicalCertificateRepository.findByPatientIdOrderByIssueDateDesc(patientId)
                .stream()
                .map(this::mapCertificateToDto)
                .collect(Collectors.toList());
    }

    /**
     * Orders a clinical task/instruction directly to nursing staff.
     */
    @Transactional
    public DoctorNurseInstructionDto createDoctorToNurseInstruction(DoctorNurseInstructionDto dto, String username) {
        Doctor doctor = resolveDoctorForUsername(username);
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.getPatientId()));

        Ward ward = null;
        if (dto.getWardId() != null) {
            ward = wardRepository.findById(dto.getWardId()).orElse(null);
        }

        BedAdmission admission = null;
        if (dto.getBedAdmissionId() != null) {
            admission = bedAdmissionRepository.findById(dto.getBedAdmissionId()).orElse(null);
            if (ward == null && admission != null && admission.getBed() != null) {
                ward = admission.getBed().getWard();
            }
        }

        if (ward == null) {
            ward = wardRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No ward available to assign nurse task"));
        }

        NursingTask task = NursingTask.builder()
                .patient(patient)
                .bedAdmission(admission)
                .ward(ward)
                .taskTitle(dto.getTaskTitle())
                .description("Doctor Order by Dr. " + doctor.getName() + ": " + dto.getDescription())
                .taskType("DOCTOR_ORDER")
                .priority(dto.getPriority() != null ? dto.getPriority() : "ROUTINE")
                .scheduledAt(dto.getScheduledAt() != null ? dto.getScheduledAt() : LocalDateTime.now())
                .dueAt(dto.getDueAt() != null ? dto.getDueAt() : LocalDateTime.now().plusHours(2))
                .status("PENDING")
                .build();

        NursingTask saved = nursingTaskRepository.save(task);
        auditService.logAction(username, "CREATE_NURSE_INSTRUCTION", null, "Assigned nursing order: " + dto.getTaskTitle() + " for patient " + patient.getUhid(), null, null, null);

        dto.setId(saved.getId());
        dto.setWardId(ward.getId());
        return dto;
    }

    /**
     * Recommends admission for an OPD patient to IPD.
     */
    @Transactional
    public void recommendAdmission(AdmissionRecommendationDto dto, String username) {
        Doctor doctor = resolveDoctorForUsername(username);
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.getPatientId()));

        auditService.logAction(username, "RECOMMEND_ADMISSION", null,
                "Doctor " + doctor.getName() + " recommended admission for " + patient.getUhid() +
                        ". Reason: " + dto.getReasonForAdmission() + " | Priority: " + dto.getPriority() + " | Ward: " + dto.getSuggestedWardType(),
                null, null, null);
    }

    /**
     * Documents clinical discharge recommendation and instructions.
     */
    @Transactional
    public void recommendDischarge(DischargeRecommendationDto dto, String username) {
        Doctor doctor = resolveDoctorForUsername(username);
        BedAdmission admission = bedAdmissionRepository.findById(dto.getBedAdmissionId())
                .orElseThrow(() -> new ResourceNotFoundException("Bed Admission not found: " + dto.getBedAdmissionId()));

        admission.setDischargeRecommendation(dto.getDischargeRecommendation());
        admission.setDischargeInstructions(dto.getDischargeInstructions());
        admission.setConditionAtDischarge(dto.getConditionAtDischarge() != null ? dto.getConditionAtDischarge() : "STABLE");
        admission.setDietInstructions(dto.getDietInstructions());
        admission.setActivityInstructions(dto.getActivityInstructions());

        bedAdmissionRepository.save(admission);
        auditService.logAction(username, "RECOMMEND_DISCHARGE", null,
                "Doctor " + doctor.getName() + " documented discharge recommendation for admission " + admission.getId() +
                        " (Patient: " + admission.getPatient().getUhid() + ")", null, null, null);
    }

    /**
     * Lists active IPD inpatients assigned to the doctor.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getActiveInpatients(String username) {
        Doctor doctor = resolveDoctorForUsername(username);
        List<BedAdmission> admissions = bedAdmissionRepository.findActiveAdmissionsByDoctor(doctor.getId());
        if (admissions.isEmpty()) {
            admissions = bedAdmissionRepository.findAllActiveAdmissions();
        }

        return admissions.stream().map(a -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("admissionId", a.getId());
            map.put("patientId", a.getPatient().getId());
            map.put("patientName", a.getPatient().getName());
            map.put("patientUhid", a.getPatient().getUhid());
            map.put("age", a.getPatient().getAge());
            map.put("gender", a.getPatient().getGender());
            map.put("admissionTime", a.getAdmissionTime());
            map.put("bedNumber", a.getBed() != null ? a.getBed().getBedNumber() : "N/A");
            map.put("wardName", (a.getBed() != null && a.getBed().getWard() != null) ? a.getBed().getWard().getName() : "N/A");
            map.put("reasonForAdmission", a.getReasonForAdmission());
            map.put("status", a.getStatus());
            return map;
        }).collect(Collectors.toList());
    }

    /**
     * Searches ICD-10 Diagnosis Catalogue.
     */
    @Transactional(readOnly = true)
    public List<DiagnosisCatalogue> searchDiagnosesCatalogue(String query) {
        if (query == null || query.isBlank()) {
            return diagnosisCatalogueRepository.findAll().stream().limit(25).collect(Collectors.toList());
        }
        return diagnosisCatalogueRepository.findByDescriptionContainingIgnoreCase(query);
    }

    /**
     * Searches Hospital Medicine Catalogue.
     */
    @Transactional(readOnly = true)
    public List<MedicineCatalogue> searchMedicinesCatalogue(String query) {
        if (query == null || query.isBlank()) {
            return medicineCatalogueRepository.findAll().stream().limit(25).collect(Collectors.toList());
        }
        return medicineCatalogueRepository.findByNameContainingIgnoreCase(query);
    }

    // Mapping Helpers
    private DoctorResponseDto mapDoctorToDto(Doctor doctor) {
        return DoctorResponseDto.builder()
                .id(doctor.getId())
                .name(doctor.getName())
                .specialization(doctor.getSpecialization())
                .email(doctor.getEmail())
                .registrationNumber(doctor.getRegistrationNumber())
                .roomNumber(doctor.getRoomNumber())
                .consultationFee(doctor.getConsultationFee())
                .isAvailable(doctor.getIsAvailable())
                .phone(doctor.getPhone())
                .qualification(doctor.getQualification())
                .experienceYears(doctor.getExperienceYears())
                .scheduleSummary(doctor.getScheduleSummary())
                .build();
    }

    private DoctorInvestigationResultDto mapInvestigationToDto(DiagnosticBooking b) {
        return DoctorInvestigationResultDto.builder()
                .id(b.getId())
                .patientId(b.getPatientId())
                .patientName(b.getPatientName())
                .patientUhid(b.getPatientUhid())
                .testName(b.getTestName())
                .category(b.getCategory())
                .bookingDateTime(b.getBookingDateTime())
                .status(b.getStatus())
                .referringDoctorId(b.getReferringDoctorId())
                .referringDoctorName(b.getReferringDoctorName())
                .departmentName(b.getDepartmentName())
                .instructions(b.getInstructions())
                .clinicalNotes(b.getClinicalNotes())
                .resultNotes(b.getResultNotes())
                .resultAttachmentUrl(b.getResultAttachmentUrl())
                .resultRecordedAt(b.getResultRecordedAt())
                .isAbnormal(b.getIsAbnormal())
                .build();
    }

    private InpatientProgressNoteDto mapProgressNoteToDto(InpatientProgressNote n) {
        return InpatientProgressNoteDto.builder()
                .id(n.getId())
                .bedAdmissionId(n.getBedAdmission().getId())
                .patientId(n.getPatient().getId())
                .patientName(n.getPatient().getName())
                .patientUhid(n.getPatient().getUhid())
                .bedNumber(n.getBedAdmission().getBed() != null ? n.getBedAdmission().getBed().getBedNumber() : null)
                .wardName((n.getBedAdmission().getBed() != null && n.getBedAdmission().getBed().getWard() != null) ? n.getBedAdmission().getBed().getWard().getName() : null)
                .doctorId(n.getDoctor() != null ? n.getDoctor().getId() : null)
                .doctorName(n.getDoctor() != null ? n.getDoctor().getName() : null)
                .noteType(n.getNoteType())
                .roundDateTime(n.getRoundDateTime())
                .subjective(n.getSubjective())
                .objective(n.getObjective())
                .assessment(n.getAssessment())
                .plan(n.getPlan())
                .bloodPressure(n.getBloodPressure())
                .pulseRate(n.getPulseRate())
                .temperature(n.getTemperature())
                .spo2(n.getSpo2())
                .respiratoryRate(n.getRespiratoryRate())
                .isCritical(n.getIsCritical())
                .clinicalInstructions(n.getClinicalInstructions())
                .build();
    }

    private MedicalCertificateDto mapCertificateToDto(MedicalCertificate c) {
        return MedicalCertificateDto.builder()
                .id(c.getId())
                .certificateNumber(c.getCertificateNumber())
                .certificateType(c.getCertificateType())
                .patientId(c.getPatient().getId())
                .patientName(c.getPatient().getName())
                .patientUhid(c.getPatient().getUhid())
                .doctorId(c.getDoctor().getId())
                .doctorName(c.getDoctor().getName())
                .issueDate(c.getIssueDate())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .diagnosis(c.getDiagnosis())
                .clinicalRemarks(c.getClinicalRemarks())
                .recommendations(c.getRecommendations())
                .status(c.getStatus())
                .build();
    }
}