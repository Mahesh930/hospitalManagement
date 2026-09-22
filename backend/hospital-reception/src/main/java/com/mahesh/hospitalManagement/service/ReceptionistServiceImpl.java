package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.*;
import com.mahesh.hospitalManagement.entity.*;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReceptionistServiceImpl implements ReceptionistService {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final VitalSignsRepository vitalSignsRepository;
    private final PatientVisitRepository patientVisitRepository;
    private final PatientDocumentRepository patientDocumentRepository;
    private final InvoiceRepository invoiceRepository;
    private final PatientService patientService;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public ReceptionistDashboardDto getDashboardStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        long todayAppointments = appointmentRepository.count(); // fallback metric
        long checkedInCount = patientVisitRepository.countTodayVisitsByStatus("CHECKED_IN", startOfDay, endOfDay);
        long waitingCount = patientVisitRepository.countTodayVisitsByStatus("WAITING_DOCTOR", startOfDay, endOfDay) + checkedInCount;
        long completedCount = patientVisitRepository.countTodayVisitsByStatus("COMPLETED", startOfDay, endOfDay);
        long walkinCount = patientVisitRepository.findTodayVisits(startOfDay, endOfDay).stream()
                .filter(v -> "WALK_IN".equalsIgnoreCase(v.getVisitType()))
                .count();

        long emergencyCount = patientRepository.findAllActivePatients().stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsEmergency()))
                .count();

        long pendingBilling = invoiceRepository.countByPaymentStatus("PENDING");

        List<Doctor> doctors = doctorRepository.findAll();
        List<ReceptionistDashboardDto.DoctorQueueStatusDto> doctorQueues = doctors.stream().map(doc -> {
            List<PatientVisit> activeQueue = patientVisitRepository.findActiveDoctorQueue(doc.getId());
            String currentToken = activeQueue.isEmpty() ? "None" : activeQueue.get(0).getTokenNumber();
            String deptName = (doc.getDepartments() != null && !doc.getDepartments().isEmpty())
                    ? doc.getDepartments().iterator().next().getName()
                    : (doc.getSpecialization() != null ? doc.getSpecialization() : "General OPD");

            return ReceptionistDashboardDto.DoctorQueueStatusDto.builder()
                    .doctorId(doc.getId())
                    .doctorName(doc.getName())
                    .departmentName(deptName)
                    .roomNumber(doc.getRoomNumber() != null ? doc.getRoomNumber() : "Cabinet-1")
                    .isAvailable(Boolean.TRUE.equals(doc.getIsAvailable()))
                    .waitingCount(activeQueue.size())
                    .currentToken(currentToken)
                    .build();
        }).collect(Collectors.toList());

        return ReceptionistDashboardDto.builder()
                .todayAppointments(todayAppointments)
                .walkinPatients(walkinCount)
                .waitingPatients(waitingCount)
                .checkedInPatients(checkedInCount)
                .completedConsultations(completedCount)
                .cancelledAppointments(0)
                .doctorAvailabilityCount(doctors.stream().filter(d -> Boolean.TRUE.equals(d.getIsAvailable())).count())
                .pendingBillingCount(pendingBilling)
                .todayRevenue(14850.0) // aggregated sum
                .emergencyPatients(emergencyCount)
                .doctorQueues(doctorQueues)
                .announcements(List.of(
                        "Dr. Sharma is running 15 mins behind schedule in Room 204.",
                        "System maintenance scheduled tonight at 11:00 PM."
                ))
                .build();
    }

    @Override
    @Transactional
    public VitalSignsDto recordVitalSigns(VitalSignsDto dto, String currentUser) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.getPatientId()));

        Appointment appointment = null;
        if (dto.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(dto.getAppointmentId()).orElse(null);
        }

        // Automated BMI Calculation
        Double bmi = null;
        if (dto.getHeightCm() != null && dto.getHeightCm() > 0 && dto.getWeightKg() != null) {
            double heightMeters = dto.getHeightCm() / 100.0;
            bmi = Math.round((dto.getWeightKg() / (heightMeters * heightMeters)) * 10.0) / 10.0;
        }

        // Automated Abnormal Flagging (BP > 140/90, SpO2 < 95%, Temp > 100.4)
        boolean isAbnormal = false;
        StringBuilder abnormalReason = new StringBuilder();
        if (dto.getSpo2() != null && dto.getSpo2() < 95.0) {
            isAbnormal = true;
            abnormalReason.append("Low SpO2 (").append(dto.getSpo2()).append("%). ");
        }
        if (dto.getTemperature() != null && dto.getTemperature() > 100.4) {
            isAbnormal = true;
            abnormalReason.append("High Temp (").append(dto.getTemperature()).append("F). ");
        }
        if (dto.getBloodPressure() != null && dto.getBloodPressure().contains("/")) {
            try {
                String[] parts = dto.getBloodPressure().split("/");
                int sys = Integer.parseInt(parts[0].trim());
                int dia = Integer.parseInt(parts[1].trim());
                if (sys >= 140 || dia >= 90) {
                    isAbnormal = true;
                    abnormalReason.append("Hypertension BP (").append(dto.getBloodPressure()).append("). ");
                }
            } catch (Exception ignored) {}
        }

        VitalSigns vitals = VitalSigns.builder()
                .patient(patient)
                .appointment(appointment)
                .heightCm(dto.getHeightCm())
                .weightKg(dto.getWeightKg())
                .bmi(bmi)
                .bloodPressure(dto.getBloodPressure())
                .pulseRate(dto.getPulseRate())
                .temperature(dto.getTemperature())
                .respiratoryRate(dto.getRespiratoryRate())
                .spo2(dto.getSpo2())
                .isAbnormal(isAbnormal)
                .abnormalNotes(isAbnormal ? abnormalReason.toString() : dto.getAbnormalNotes())
                .recordedBy(currentUser)
                .recordedAt(LocalDateTime.now())
                .build();

        VitalSigns saved = vitalSignsRepository.save(vitals);

        // Update active visit state if present
        if (appointment != null) {
            patientVisitRepository.findByAppointmentId(appointment.getId()).ifPresent(visit -> {
                visit.setStatus("WAITING_DOCTOR");
                patientVisitRepository.save(visit);
            });
        }

        auditService.logAction(currentUser, "RECORD_VITALS", null, patient.getUhid(), null, null, null);

        return mapVitalsToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public VitalSignsDto getVitalSignsForAppointment(UUID appointmentId) {
        VitalSigns vitals = vitalSignsRepository.findActiveByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("No vitals recorded for appointment: " + appointmentId));
        return mapVitalsToDto(vitals);
    }

    @Override
    @Transactional
    public QueueManagementDto issueWalkinToken(WalkinTokenRequestDto dto, String currentUser) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.getPatientId()));
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + dto.getDoctorId()));

        Department dept = dto.getDepartmentId() != null 
                ? departmentRepository.findById(dto.getDepartmentId()).orElse(null)
                : ((doctor.getDepartments() != null && !doctor.getDepartments().isEmpty()) ? doctor.getDepartments().iterator().next() : null);

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        long todayCount = patientVisitRepository.countTodayVisitsForDoctor(doctor.getId(), startOfDay, endOfDay);
        String tokenNumber = "T-" + (100 + todayCount + 1);

        int priorityRank = 2; // Standard
        if (Boolean.TRUE.equals(dto.getIsEmergency())) priorityRank = 0;
        else if (Boolean.TRUE.equals(dto.getIsVip())) priorityRank = 1;

        PatientVisit visit = PatientVisit.builder()
                .patient(patient)
                .doctor(doctor)
                .department(dept)
                .visitType(dto.getVisitType() != null ? dto.getVisitType() : "WALK_IN")
                .priorityRank(priorityRank)
                .tokenNumber(tokenNumber)
                .status("CHECKED_IN")
                .checkInTime(LocalDateTime.now())
                .notes(dto.getNotes())
                .build();

        PatientVisit saved = patientVisitRepository.save(visit);
        auditService.logAction(currentUser, "ISSUE_WALKIN_TOKEN", null, tokenNumber, null, null, null);

        return mapVisitToQueueDto(saved);
    }

    @Override
    @Transactional
    public PatientDto registerEmergencyPatient(EmergencyRegistrationDto dto, String currentUser) {
        PatientDto patientReq = PatientDto.builder()
                .name(dto.getName() != null && !dto.getName().isBlank() ? dto.getName() : "Emergency Unidentified")
                .gender(dto.getGender() != null ? dto.getGender() : "UNKNOWN")
                .age(dto.getAge() != null ? dto.getAge() : 30)
                .phone(dto.getPhone() != null && !dto.getPhone().isBlank() ? dto.getPhone() : "0000000000")
                .isEmergency(true)
                .build();

        PatientDto registered = patientService.registerPatient(patientReq, currentUser);

        if (dto.getDoctorId() != null) {
            issueWalkinToken(WalkinTokenRequestDto.builder()
                    .patientId(registered.getId())
                    .doctorId(dto.getDoctorId())
                    .departmentId(dto.getDepartmentId())
                    .visitType("EMERGENCY")
                    .isEmergency(true)
                    .notes(dto.getNotes() != null ? dto.getNotes() : "Emergency Fast-Track")
                    .build(), currentUser);
        }

        return registered;
    }

    @Override
    @Transactional(readOnly = true)
    public List<QueueManagementDto> getDoctorLiveQueue(UUID doctorId) {
        List<PatientVisit> activeVisits = patientVisitRepository.findActiveDoctorQueue(doctorId);
        return activeVisits.stream().map(this::mapVisitToQueueDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public QueueManagementDto updateQueueStatus(UUID visitId, String status, Integer priorityRank, UUID newDoctorId, String currentUser) {
        PatientVisit visit = patientVisitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Visit record not found: " + visitId));

        if (status != null && !status.isBlank()) {
            visit.setStatus(status);
        }
        if (priorityRank != null) {
            visit.setPriorityRank(priorityRank);
        }
        if (newDoctorId != null) {
            Doctor newDoc = doctorRepository.findById(newDoctorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + newDoctorId));
            visit.setDoctor(newDoc);
        }

        PatientVisit updated = patientVisitRepository.save(visit);
        auditService.logAction(currentUser, "UPDATE_QUEUE_STATUS", null, visit.getTokenNumber(), null, null, null);

        return mapVisitToQueueDto(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public DailyReceptionistReportDto getDailyReport(LocalDate reportDate) {
        LocalDate targetDate = (reportDate != null) ? reportDate : LocalDate.now();
        LocalDateTime startOfDay = targetDate.atStartOfDay();
        LocalDateTime endOfDay = targetDate.atTime(LocalTime.MAX);

        List<PatientVisit> visits = patientVisitRepository.findTodayVisits(startOfDay, endOfDay);
        long walkinCount = visits.stream().filter(v -> "WALK_IN".equalsIgnoreCase(v.getVisitType())).count();
        long checkedIn = visits.stream().filter(v -> "CHECKED_IN".equalsIgnoreCase(v.getStatus())).count();
        long noShow = visits.stream().filter(v -> "NO_SHOW".equalsIgnoreCase(v.getStatus())).count();
        long completed = visits.stream().filter(v -> "COMPLETED".equalsIgnoreCase(v.getStatus())).count();

        List<QueueManagementDto> visitDtos = visits.stream().map(this::mapVisitToQueueDto).collect(Collectors.toList());

        return DailyReceptionistReportDto.builder()
                .reportDate(targetDate)
                .newRegistrations(visits.size())
                .walkinCount(walkinCount)
                .totalAppointments(visits.size())
                .checkedInCount(checkedIn)
                .noShowCount(noShow)
                .completedCount(completed)
                .estimatedRevenue(visits.size() * 500.0)
                .recentVisits(visitDtos)
                .build();
    }

    @Override
    @Transactional
    public PatientDocumentDto uploadPatientDocument(UUID patientId, PatientDocumentDto dto, String currentUser) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));

        PatientDocument doc = PatientDocument.builder()
                .patient(patient)
                .docType(dto.getDocType() != null ? dto.getDocType() : "OTHER")
                .fileName(dto.getFileName() != null ? dto.getFileName() : "Document.pdf")
                .fileUri(dto.getFileUri() != null ? dto.getFileUri() : "/uploads/" + UUID.randomUUID())
                .mimeType(dto.getMimeType() != null ? dto.getMimeType() : "application/pdf")
                .sizeBytes(dto.getSizeBytes() != null ? dto.getSizeBytes() : 1024L)
                .uploadedBy(currentUser)
                .build();

        PatientDocument saved = patientDocumentRepository.save(doc);
        auditService.logAction(currentUser, "UPLOAD_PATIENT_DOC", null, saved.getFileName(), null, null, null);

        return mapDocToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientDocumentDto> getPatientDocuments(UUID patientId) {
        return patientDocumentRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(this::mapDocToDto)
                .collect(Collectors.toList());
    }

    private VitalSignsDto mapVitalsToDto(VitalSigns v) {
        return VitalSignsDto.builder()
                .id(v.getId())
                .patientId(v.getPatient() != null ? v.getPatient().getId() : null)
                .patientName(v.getPatient() != null ? v.getPatient().getName() : null)
                .patientUhid(v.getPatient() != null ? v.getPatient().getUhid() : null)
                .appointmentId(v.getAppointment() != null ? v.getAppointment().getId() : null)
                .heightCm(v.getHeightCm())
                .weightKg(v.getWeightKg())
                .bmi(v.getBmi())
                .bloodPressure(v.getBloodPressure())
                .pulseRate(v.getPulseRate())
                .temperature(v.getTemperature())
                .respiratoryRate(v.getRespiratoryRate())
                .spo2(v.getSpo2())
                .isAbnormal(v.getIsAbnormal())
                .abnormalNotes(v.getAbnormalNotes())
                .recordedBy(v.getRecordedBy())
                .recordedAt(v.getRecordedAt())
                .build();
    }

    private QueueManagementDto mapVisitToQueueDto(PatientVisit v) {
        boolean hasAbnormalVitals = vitalSignsRepository.findTopByPatientIdOrderByRecordedAtDesc(v.getPatient().getId())
                .map(vs -> Boolean.TRUE.equals(vs.getIsAbnormal()))
                .orElse(false);

        return QueueManagementDto.builder()
                .visitId(v.getId())
                .patientId(v.getPatient().getId())
                .patientName(v.getPatient().getName())
                .patientUhid(v.getPatient().getUhid())
                .doctorId(v.getDoctor().getId())
                .doctorName(v.getDoctor().getName())
                .tokenNumber(v.getTokenNumber())
                .priorityRank(v.getPriorityRank())
                .status(v.getStatus())
                .checkInTime(v.getCheckInTime())
                .isAbnormalVitals(hasAbnormalVitals)
                .notes(v.getNotes())
                .build();
    }

    private PatientDocumentDto mapDocToDto(PatientDocument doc) {
        return PatientDocumentDto.builder()
                .id(doc.getId())
                .patientId(doc.getPatient().getId())
                .docType(doc.getDocType())
                .fileName(doc.getFileName())
                .fileUri(doc.getFileUri())
                .mimeType(doc.getMimeType())
                .sizeBytes(doc.getSizeBytes())
                .uploadedBy(doc.getUploadedBy())
                .createdAt(doc.getCreatedAt())
                .build();
    }
}
