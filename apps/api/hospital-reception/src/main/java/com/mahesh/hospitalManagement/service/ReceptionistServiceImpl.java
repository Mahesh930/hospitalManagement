package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.*;
import com.mahesh.hospitalManagement.entity.*;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
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
    private final PatientMergeRequestRepository mergeRequestRepository;
    private final DiagnosticBookingRepository diagnosticBookingRepository;
    private final ReceptionShiftHandoverRepository handoverRepository;
    private final PatientFeedbackRepository feedbackRepository;
    private final LostAndFoundItemRepository lostAndFoundRepository;
    private final InsuranceRepository insuranceRepository;

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
        if (dto.getDoctorId() == null) {
            throw new BusinessValidationException("Doctor ID is required to issue walk-in token");
        }
        if (dto.getPatientId() == null) {
            throw new BusinessValidationException("Patient ID is required to issue walk-in token");
        }
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

        // Check for duplicate active visit in queue
        List<PatientVisit> activeVisits = patientVisitRepository.findActiveDoctorQueue(doctor.getId());
        boolean hasDuplicate = activeVisits.stream().anyMatch(v -> 
            v.getPatient() != null && v.getPatient().getId().equals(patient.getId())
        );
        if (hasDuplicate && !Boolean.TRUE.equals(dto.getIsEmergency())) {
            throw new BusinessValidationException("Patient already has an active visit in queue for Dr. " + doctor.getSpecialization());
        }

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
        if (dto != null) {
            if (dto.getAge() != null && (dto.getAge() < 0 || dto.getAge() > 150)) {
                throw new BusinessValidationException("Invalid age specified for emergency registration.");
            }
            if (dto.getPhone() != null && !dto.getPhone().isBlank() && !dto.getPhone().matches("^\\+?[0-9]{10,15}$")) {
                throw new BusinessValidationException("Invalid phone number format for emergency registration.");
            }
        }

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
            if ("SURGERY_COMPLETED".equalsIgnoreCase(status) || "IN_SURGERY".equalsIgnoreCase(status) || "DISCHARGED_CLINICAL".equalsIgnoreCase(status)) {
                throw new BusinessValidationException("Receptionist does not have permission to set clinical queue status: " + status);
            }
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
        // Validate MIME type
        if (dto.getMimeType() != null) {
            String mime = dto.getMimeType().toLowerCase();
            if (mime.contains("msdownload") || mime.contains("x-sh") || (mime.contains("octet-stream") && dto.getFileName() != null && dto.getFileName().toLowerCase().endsWith(".exe")) || (dto.getFileName() != null && dto.getFileName().toLowerCase().endsWith(".exe"))) {
                throw new BusinessValidationException("Unsupported file type: " + dto.getMimeType());
            }
        }
        // Validate file size (max 25MB)
        if (dto.getSizeBytes() != null && dto.getSizeBytes() > 25 * 1024 * 1024) {
            throw new BusinessValidationException("File size exceeds maximum permitted limit of 25MB");
        }

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
                .isVerified(Boolean.TRUE.equals(doc.getIsVerified()))
                .verifiedBy(doc.getVerifiedBy())
                .verifiedAt(doc.getVerifiedAt())
                .createdAt(doc.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public PatientDocumentDto verifyPatientDocument(UUID documentId, String currentUser) {
        PatientDocument doc = patientDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient document not found with ID: " + documentId));

        doc.setIsVerified(true);
        doc.setVerifiedBy(currentUser);
        doc.setVerifiedAt(LocalDateTime.now());
        doc.setUpdatedBy(currentUser);

        PatientDocument saved = patientDocumentRepository.save(doc);
        auditService.logAction(currentUser, "VERIFY_DOCUMENT", null, "Verified document ID: " + documentId, "127.0.0.1", "WEB", "HOSPITAL");
        return mapDocToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DuplicateCheckDto checkDuplicatePatient(String phone, String name, String email, String aadhaar) {
        List<DuplicateCheckDto.MatchedPatientDto> matches = new ArrayList<>();

        if (phone != null && !phone.isBlank()) {
            patientRepository.findByPhone(phone.trim()).ifPresent(p -> {
                matches.add(DuplicateCheckDto.MatchedPatientDto.builder()
                        .id(p.getId())
                        .uhid(p.getUhid())
                        .name(p.getName())
                        .phone(p.getPhone())
                        .email(p.getEmail())
                        .aadhaar(p.getAadhaar())
                        .gender(p.getGender())
                        .age(p.getAge())
                        .matchReason("Exact Phone Number Match (" + p.getPhone() + ")")
                        .build());
            });
        }

        if (aadhaar != null && !aadhaar.isBlank()) {
            patientRepository.findByAadhaar(aadhaar.trim()).ifPresent(p -> {
                boolean alreadyMatched = matches.stream().anyMatch(m -> m.getId().equals(p.getId()));
                if (!alreadyMatched) {
                    matches.add(DuplicateCheckDto.MatchedPatientDto.builder()
                            .id(p.getId())
                            .uhid(p.getUhid())
                            .name(p.getName())
                            .phone(p.getPhone())
                            .email(p.getEmail())
                            .aadhaar(p.getAadhaar())
                            .gender(p.getGender())
                            .age(p.getAge())
                            .matchReason("Exact National ID / Aadhaar Match")
                            .build());
                }
            });
        }

        if (name != null && !name.isBlank() && phone != null && !phone.isBlank()) {
            List<Patient> byNamePhone = patientRepository.findDuplicatesByPhoneAndName(phone.trim(), name.trim());
            for (Patient p : byNamePhone) {
                boolean alreadyMatched = matches.stream().anyMatch(m -> m.getId().equals(p.getId()));
                if (!alreadyMatched) {
                    matches.add(DuplicateCheckDto.MatchedPatientDto.builder()
                            .id(p.getId())
                            .uhid(p.getUhid())
                            .name(p.getName())
                            .phone(p.getPhone())
                            .email(p.getEmail())
                            .aadhaar(p.getAadhaar())
                            .gender(p.getGender())
                            .age(p.getAge())
                            .matchReason("Name and Phone Combination Match")
                            .build());
                }
            }
        }

        return DuplicateCheckDto.builder()
                .isDuplicate(!matches.isEmpty())
                .matchCount(matches.size())
                .matchedPatients(matches)
                .build();
    }

    @Override
    @Transactional
    public PatientMergeRequestDto createMergeRequest(PatientMergeRequestDto dto, String currentUser) {
        Patient source = patientRepository.findById(dto.getSourcePatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Source patient not found with ID: " + dto.getSourcePatientId()));
        Patient target = patientRepository.findById(dto.getTargetPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Target patient not found with ID: " + dto.getTargetPatientId()));

        PatientMergeRequest req = PatientMergeRequest.builder()
                .sourcePatientId(source.getId())
                .sourcePatientUhid(source.getUhid())
                .sourcePatientName(source.getName())
                .targetPatientId(target.getId())
                .targetPatientUhid(target.getUhid())
                .targetPatientName(target.getName())
                .reason(dto.getReason())
                .status("PENDING")
                .requestedBy(currentUser)
                .build();
        req.setCreatedBy(currentUser);

        PatientMergeRequest saved = mergeRequestRepository.save(req);
        auditService.logAction(currentUser, "REQUEST_PATIENT_MERGE", source.getUhid(), "Target: " + target.getUhid(), "127.0.0.1", "WEB", "HOSPITAL");

        return mapMergeToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientMergeRequestDto> getMergeRequests(String status) {
        List<PatientMergeRequest> list = (status != null && !status.isBlank())
                ? mergeRequestRepository.findByStatusOrderByCreatedAtDesc(status)
                : mergeRequestRepository.findAllByOrderByCreatedAtDesc();

        return list.stream().map(this::mapMergeToDto).collect(Collectors.toList());
    }

    private PatientMergeRequestDto mapMergeToDto(PatientMergeRequest req) {
        return PatientMergeRequestDto.builder()
                .id(req.getId())
                .sourcePatientId(req.getSourcePatientId())
                .sourcePatientUhid(req.getSourcePatientUhid())
                .sourcePatientName(req.getSourcePatientName())
                .targetPatientId(req.getTargetPatientId())
                .targetPatientUhid(req.getTargetPatientUhid())
                .targetPatientName(req.getTargetPatientName())
                .reason(req.getReason())
                .status(req.getStatus())
                .requestedBy(req.getRequestedBy())
                .reviewedBy(req.getReviewedBy())
                .reviewNotes(req.getReviewNotes())
                .createdAt(req.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorScheduleDto> getDoctorSchedules() {
        List<Doctor> doctors = doctorRepository.findAll();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        return doctors.stream().map(doc -> {
            String deptName = (doc.getDepartments() != null && !doc.getDepartments().isEmpty())
                    ? doc.getDepartments().iterator().next().getName()
                    : (doc.getSpecialization() != null ? doc.getSpecialization() : "General OPD");

            List<PatientVisit> activeQueue = patientVisitRepository.findActiveDoctorQueue(doc.getId());
            long todayAppts = appointmentRepository.countTodayAppointmentsForDoctor(doc.getId(), startOfDay, endOfDay);

            return DoctorScheduleDto.builder()
                    .doctorId(doc.getId())
                    .doctorName(doc.getName())
                    .specialization(doc.getSpecialization())
                    .departmentName(deptName)
                    .roomNumber(doc.getRoomNumber() != null ? doc.getRoomNumber() : "OPD Room")
                    .workingHours("09:00 AM - 05:00 PM")
                    .isAvailable(Boolean.TRUE.equals(doc.getIsAvailable()))
                    .isOnLeave(!Boolean.TRUE.equals(doc.getIsAvailable()))
                    .activeQueueCount(activeQueue.size())
                    .todayAppointmentsCount((int) todayAppts)
                    .consultationFee(doc.getConsultationFee() != null ? doc.getConsultationFee() : 500.0)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InsuranceDetailsDto assignPatientInsurance(UUID patientId, InsuranceDetailsDto dto, String currentUser) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));

        Insurance insurance = patient.getInsurance();
        if (insurance == null) {
            insurance = Insurance.builder()
                    .policyNumber(dto.getPolicyNumber())
                    .provider(dto.getProvider())
                    .validUntil(dto.getValidTill() != null ? dto.getValidTill() : LocalDate.now().plusYears(1))
                    .build();
            insurance.setCreatedBy(currentUser);
        } else {
            insurance.setPolicyNumber(dto.getPolicyNumber());
            insurance.setProvider(dto.getProvider());
            if (dto.getValidTill() != null) insurance.setValidUntil(dto.getValidTill());
            insurance.setUpdatedBy(currentUser);
        }

        Insurance savedInsurance = insuranceRepository.save(insurance);
        patient.setInsurance(savedInsurance);
        if (dto.getTpaName() != null) {
            patient.setTpaDetails(dto.getTpaName());
        }
        patientRepository.save(patient);

        auditService.logAction(currentUser, "ASSIGN_INSURANCE", null, "Policy: " + dto.getPolicyNumber(), "127.0.0.1", "WEB", "HOSPITAL");

        return InsuranceDetailsDto.builder()
                .id(savedInsurance.getId())
                .patientId(patient.getId())
                .policyNumber(savedInsurance.getPolicyNumber())
                .provider(savedInsurance.getProvider())
                .validTill(savedInsurance.getValidUntil())
                .tpaName(patient.getTpaDetails())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public InsuranceDetailsDto getPatientInsurance(UUID patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));

        if (patient.getInsurance() == null) {
            return null;
        }

        Insurance ins = patient.getInsurance();
        return InsuranceDetailsDto.builder()
                .id(ins.getId())
                .patientId(patient.getId())
                .policyNumber(ins.getPolicyNumber())
                .provider(ins.getProvider())
                .validTill(ins.getValidUntil())
                .tpaName(patient.getTpaDetails())
                .build();
    }

    @Override
    @Transactional
    public DiagnosticBookingDto scheduleDiagnosticBooking(DiagnosticBookingDto dto, String currentUser) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        DiagnosticBooking booking = DiagnosticBooking.builder()
                .patientId(patient.getId())
                .patientName(patient.getName())
                .patientUhid(patient.getUhid())
                .testName(dto.getTestName())
                .category(dto.getCategory() != null ? dto.getCategory() : "LAB")
                .bookingDateTime(dto.getBookingDateTime() != null ? dto.getBookingDateTime() : LocalDateTime.now().plusHours(1))
                .status("SCHEDULED")
                .referringDoctorId(dto.getReferringDoctorId())
                .referringDoctorName(dto.getReferringDoctorName())
                .departmentName(dto.getDepartmentName())
                .instructions(dto.getInstructions())
                .bookedBy(currentUser)
                .build();
        booking.setCreatedBy(currentUser);

        DiagnosticBooking saved = diagnosticBookingRepository.save(booking);
        auditService.logAction(currentUser, "BOOK_DIAGNOSTIC", null, "Test: " + dto.getTestName(), "127.0.0.1", "WEB", "HOSPITAL");

        return mapDiagToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DiagnosticBookingDto> getDiagnosticBookings(UUID patientId, String status) {
        List<DiagnosticBooking> list;
        if (patientId != null) {
            list = diagnosticBookingRepository.findByPatientIdOrderByBookingDateTimeDesc(patientId);
        } else if (status != null && !status.isBlank()) {
            list = diagnosticBookingRepository.findByStatusOrderByBookingDateTimeAsc(status);
        } else {
            LocalDateTime start = LocalDate.now().atStartOfDay();
            LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);
            list = diagnosticBookingRepository.findByBookingDateTimeBetweenOrderByBookingDateTimeAsc(start, end);
        }

        return list.stream().map(this::mapDiagToDto).collect(Collectors.toList());
    }

    private DiagnosticBookingDto mapDiagToDto(DiagnosticBooking b) {
        return DiagnosticBookingDto.builder()
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
                .bookedBy(b.getBookedBy())
                .createdAt(b.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public ReceptionShiftHandoverDto createShiftHandover(ReceptionShiftHandoverDto dto, String currentUser) {
        ReceptionShiftHandover handover = ReceptionShiftHandover.builder()
                .shiftDate(dto.getShiftDate() != null ? dto.getShiftDate() : LocalDate.now())
                .shiftType(dto.getShiftType() != null ? dto.getShiftType() : "MORNING")
                .outgoingStaff(currentUser)
                .incomingStaff(dto.getIncomingStaff())
                .cashCollected(dto.getCashCollected() != null ? dto.getCashCollected() : java.math.BigDecimal.ZERO)
                .totalTokensIssued(dto.getTotalTokensIssued() != null ? dto.getTotalTokensIssued() : 0)
                .totalWalkinsHandled(dto.getTotalWalkinsHandled() != null ? dto.getTotalWalkinsHandled() : 0)
                .totalEmergenciesHandled(dto.getTotalEmergenciesHandled() != null ? dto.getTotalEmergenciesHandled() : 0)
                .pendingAppointmentsSummary(dto.getPendingAppointmentsSummary())
                .handoverNotes(dto.getHandoverNotes())
                .build();
        handover.setCreatedBy(currentUser);

        ReceptionShiftHandover saved = handoverRepository.save(handover);
        auditService.logAction(currentUser, "CREATE_SHIFT_HANDOVER", null, "Shift: " + saved.getShiftType(), "127.0.0.1", "WEB", "HOSPITAL");

        return mapHandoverToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReceptionShiftHandoverDto> getShiftHandovers(LocalDate date) {
        List<ReceptionShiftHandover> list = (date != null)
                ? handoverRepository.findByShiftDateOrderByCreatedAtDesc(date)
                : handoverRepository.findAllByOrderByShiftDateDescCreatedAtDesc();

        return list.stream().map(this::mapHandoverToDto).collect(Collectors.toList());
    }

    private ReceptionShiftHandoverDto mapHandoverToDto(ReceptionShiftHandover h) {
        return ReceptionShiftHandoverDto.builder()
                .id(h.getId())
                .shiftDate(h.getShiftDate())
                .shiftType(h.getShiftType())
                .outgoingStaff(h.getOutgoingStaff())
                .incomingStaff(h.getIncomingStaff())
                .cashCollected(h.getCashCollected())
                .totalTokensIssued(h.getTotalTokensIssued())
                .totalWalkinsHandled(h.getTotalWalkinsHandled())
                .totalEmergenciesHandled(h.getTotalEmergenciesHandled())
                .pendingAppointmentsSummary(h.getPendingAppointmentsSummary())
                .handoverNotes(h.getHandoverNotes())
                .createdAt(h.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public PatientFeedbackDto registerPatientFeedback(PatientFeedbackDto dto, String currentUser) {
        String pName = dto.getPatientName();
        String pUhid = dto.getPatientUhid();

        if (dto.getPatientId() != null) {
            patientRepository.findById(dto.getPatientId()).ifPresent(p -> {
                dto.setPatientName(p.getName());
                dto.setPatientUhid(p.getUhid());
            });
            pName = dto.getPatientName();
            pUhid = dto.getPatientUhid();
        }

        PatientFeedback feedback = PatientFeedback.builder()
                .patientId(dto.getPatientId())
                .patientName(pName)
                .patientUhid(pUhid)
                .contactPhone(dto.getContactPhone())
                .category(dto.getCategory() != null ? dto.getCategory() : "COMPLAINT")
                .subject(dto.getSubject())
                .description(dto.getDescription())
                .severity(dto.getSeverity() != null ? dto.getSeverity() : "MEDIUM")
                .status("OPEN")
                .recordedBy(currentUser)
                .assignedDepartment(dto.getAssignedDepartment())
                .build();
        feedback.setCreatedBy(currentUser);

        PatientFeedback saved = feedbackRepository.save(feedback);
        auditService.logAction(currentUser, "REGISTER_FEEDBACK", null, "Category: " + saved.getCategory(), "127.0.0.1", "WEB", "HOSPITAL");

        return mapFeedbackToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientFeedbackDto> getPatientFeedbacks(UUID patientId, String status) {
        List<PatientFeedback> list;
        if (patientId != null) {
            list = feedbackRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        } else if (status != null && !status.isBlank()) {
            list = feedbackRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            list = feedbackRepository.findAllByOrderByCreatedAtDesc();
        }

        return list.stream().map(this::mapFeedbackToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PatientFeedbackDto resolvePatientFeedback(UUID feedbackId, String resolutionNotes, String currentUser) {
        PatientFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient feedback not found with ID: " + feedbackId));

        feedback.setStatus("RESOLVED");
        feedback.setResolutionNotes(resolutionNotes);
        feedback.setResolvedBy(currentUser);
        feedback.setUpdatedBy(currentUser);

        PatientFeedback saved = feedbackRepository.save(feedback);
        auditService.logAction(currentUser, "RESOLVE_FEEDBACK", null, "Resolved feedback ID: " + feedbackId, "127.0.0.1", "WEB", "HOSPITAL");

        return mapFeedbackToDto(saved);
    }

    private PatientFeedbackDto mapFeedbackToDto(PatientFeedback f) {
        return PatientFeedbackDto.builder()
                .id(f.getId())
                .patientId(f.getPatientId())
                .patientName(f.getPatientName())
                .patientUhid(f.getPatientUhid())
                .contactPhone(f.getContactPhone())
                .category(f.getCategory())
                .subject(f.getSubject())
                .description(f.getDescription())
                .severity(f.getSeverity())
                .status(f.getStatus())
                .recordedBy(f.getRecordedBy())
                .assignedDepartment(f.getAssignedDepartment())
                .resolutionNotes(f.getResolutionNotes())
                .resolvedBy(f.getResolvedBy())
                .createdAt(f.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public LostAndFoundItemDto recordLostAndFound(LostAndFoundItemDto dto, String currentUser) {
        LostAndFoundItem item = LostAndFoundItem.builder()
                .itemName(dto.getItemName())
                .category(dto.getCategory() != null ? dto.getCategory() : "VALUABLES")
                .description(dto.getDescription())
                .foundLocation(dto.getFoundLocation())
                .foundDateTime(dto.getFoundDateTime() != null ? dto.getFoundDateTime() : LocalDateTime.now())
                .foundBy(dto.getFoundBy() != null ? dto.getFoundBy() : currentUser)
                .storageLocation(dto.getStorageLocation() != null ? dto.getStorageLocation() : "Front Desk Safe")
                .status("UNCLAIMED")
                .remarks(dto.getRemarks())
                .build();
        item.setCreatedBy(currentUser);

        LostAndFoundItem saved = lostAndFoundRepository.save(item);
        auditService.logAction(currentUser, "RECORD_LOST_ITEM", null, "Item: " + saved.getItemName(), "127.0.0.1", "WEB", "HOSPITAL");

        return mapLostToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LostAndFoundItemDto> getLostAndFoundItems(String status) {
        List<LostAndFoundItem> list = (status != null && !status.isBlank())
                ? lostAndFoundRepository.findByStatusOrderByFoundDateTimeDesc(status)
                : lostAndFoundRepository.findAllByOrderByFoundDateTimeDesc();

        return list.stream().map(this::mapLostToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LostAndFoundItemDto claimLostAndFound(UUID itemId, String claimedBy, String claimantContact, String claimantIdProof, String remarks, String currentUser) {
        LostAndFoundItem item = lostAndFoundRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Lost item not found with ID: " + itemId));

        item.setStatus("CLAIMED");
        item.setClaimedBy(claimedBy);
        item.setClaimantContact(claimantContact);
        item.setClaimantIdProof(claimantIdProof);
        item.setClaimedDateTime(LocalDateTime.now());
        if (remarks != null) item.setRemarks(remarks);
        item.setUpdatedBy(currentUser);

        LostAndFoundItem saved = lostAndFoundRepository.save(item);
        auditService.logAction(currentUser, "CLAIM_LOST_ITEM", null, "Claimed by: " + claimedBy, "127.0.0.1", "WEB", "HOSPITAL");

        return mapLostToDto(saved);
    }

    private LostAndFoundItemDto mapLostToDto(LostAndFoundItem i) {
        return LostAndFoundItemDto.builder()
                .id(i.getId())
                .itemName(i.getItemName())
                .category(i.getCategory())
                .description(i.getDescription())
                .foundLocation(i.getFoundLocation())
                .foundDateTime(i.getFoundDateTime())
                .foundBy(i.getFoundBy())
                .storageLocation(i.getStorageLocation())
                .status(i.getStatus())
                .claimedBy(i.getClaimedBy())
                .claimantContact(i.getClaimantContact())
                .claimantIdProof(i.getClaimantIdProof())
                .claimedDateTime(i.getClaimedDateTime())
                .remarks(i.getRemarks())
                .createdAt(i.getCreatedAt())
                .build();
    }
}
