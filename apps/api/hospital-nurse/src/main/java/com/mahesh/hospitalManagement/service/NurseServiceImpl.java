package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.*;
import com.mahesh.hospitalManagement.entity.*;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Production-grade implementation of NurseService.
 * Handles Nurse Station telemetry, pre-consultation triage, inpatient bed lifecycle,
 * eMAR medication administration, and clinical nursing documentation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NurseServiceImpl implements NurseService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientVisitRepository patientVisitRepository;
    private final VitalSignsRepository vitalSignsRepository;
    private final WardRepository wardRepository;
    private final BedRepository bedRepository;
    private final BedAdmissionRepository bedAdmissionRepository;
    private final MedicationAdministrationRepository medicationAdministrationRepository;
    private final NursingNoteRepository nursingNoteRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final FluidBalanceRecordRepository fluidBalanceRecordRepository;
    private final NursingCareRecordRepository nursingCareRecordRepository;
    private final NursingTaskRepository nursingTaskRepository;
    private final ClinicalEscalationRepository clinicalEscalationRepository;
    private final NursingAssessmentRepository nursingAssessmentRepository;
    private final NursingIncidentRepository nursingIncidentRepository;
    private final ShiftHandoverReportRepository shiftHandoverReportRepository;

    /**
     * Aggregates real-time metrics for the Nurse Station Dashboard.
     */
    @Override
    @Transactional(readOnly = true)
    public NurseDashboardDto getDashboardStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        long pendingTriage = patientVisitRepository.countTodayVisitsByStatus("CHECKED_IN", startOfDay, endOfDay);
        long todayVisits = patientVisitRepository.countTodayVisitsByStatus("WAITING_DOCTOR", startOfDay, endOfDay)
                + patientVisitRepository.countTodayVisitsByStatus("IN_CONSULTATION", startOfDay, endOfDay)
                + patientVisitRepository.countTodayVisitsByStatus("COMPLETED", startOfDay, endOfDay);

        long totalBeds = bedRepository.count();
        long occupiedBeds = bedRepository.findAll().stream()
                .filter(b -> "OCCUPIED".equalsIgnoreCase(b.getStatus()) && b.getDeletedAt() == null)
                .count();

        long activeAdmissions = bedAdmissionRepository.findAll().stream()
                .filter(ba -> "ADMITTED".equalsIgnoreCase(ba.getStatus()) && ba.getDeletedAt() == null)
                .count();

        List<VitalSigns> abnormalVitalsList = vitalSignsRepository.findAll().stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsAbnormal()) && v.getDeletedAt() == null)
                .sorted(Comparator.comparing(VitalSigns::getCreatedAt).reversed())
                .limit(10)
                .collect(Collectors.toList());

        List<VitalSignsDto> recentAbnormalAlerts = abnormalVitalsList.stream()
                .map(this::mapToVitalSignsDto)
                .collect(Collectors.toList());

        List<QueueManagementDto> activeQueue = getTriageQueue();

        return NurseDashboardDto.builder()
                .todayTriageCount(todayVisits)
                .pendingTriageCount(pendingTriage)
                .abnormalVitalsCount(abnormalVitalsList.size())
                .totalBedsCount(totalBeds)
                .occupiedBedsCount(occupiedBeds)
                .activeAdmissionsCount(activeAdmissions)
                .pendingMedicationsCount(0)
                .recentAbnormalAlerts(recentAbnormalAlerts)
                .activeQueue(activeQueue)
                .build();
    }

    /**
     * Returns checked-in patients awaiting vital signs recording.
     */
    @Override
    @Transactional(readOnly = true)
    public List<QueueManagementDto> getTriageQueue() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        return patientVisitRepository.findTodayVisits(startOfDay, endOfDay).stream()
                .filter(v -> "CHECKED_IN".equalsIgnoreCase(v.getStatus()) || "IN_VITALS".equalsIgnoreCase(v.getStatus()))
                .map(this::mapToQueueDto)
                .collect(Collectors.toList());
    }

    /**
     * Records comprehensive vitals, detects safety abnormalities, and advances queue.
     */
    @Override
    @Transactional
    public VitalSignsDto recordTriageVitals(VitalSignsDto dto, String nurseName) {
        if (dto.getPatientId() == null) {
            throw new BusinessValidationException("Patient ID is required to record vitals");
        }

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.getPatientId()));

        Appointment appointment = null;
        if (dto.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(dto.getAppointmentId()).orElse(null);
        }

        // Auto-calculate BMI if height and weight are provided
        Double bmi = null;
        if (dto.getHeightCm() != null && dto.getHeightCm() > 0 && dto.getWeightKg() != null && dto.getWeightKg() > 0) {
            double heightM = dto.getHeightCm() / 100.0;
            bmi = Math.round((dto.getWeightKg() / (heightM * heightM)) * 10.0) / 10.0;
        }

        // Clinical Safety Thresholds Check
        StringBuilder alertNotes = new StringBuilder();
        boolean isAbnormal = false;
        String priority = "GREEN";

        // BP Check
        if (dto.getBloodPressure() != null && dto.getBloodPressure().contains("/")) {
            try {
                String[] parts = dto.getBloodPressure().trim().split("/");
                int systolic = Integer.parseInt(parts[0].trim());
                int diastolic = Integer.parseInt(parts[1].trim());

                if (systolic >= 160 || diastolic >= 100) {
                    alertNotes.append("[Stage 2 Hypertension: ").append(dto.getBloodPressure()).append("] ");
                    isAbnormal = true;
                    priority = "RED";
                } else if (systolic > 140 || diastolic > 90) {
                    alertNotes.append("[Hypertension: ").append(dto.getBloodPressure()).append("] ");
                    isAbnormal = true;
                    if (!"RED".equals(priority)) priority = "YELLOW";
                } else if (systolic < 90 || diastolic < 60) {
                    alertNotes.append("[Hypotension: ").append(dto.getBloodPressure()).append("] ");
                    isAbnormal = true;
                    if (!"RED".equals(priority)) priority = "YELLOW";
                }
            } catch (Exception ignored) {}
        }

        // SpO2 Check
        if (dto.getSpo2() != null) {
            if (dto.getSpo2() < 92.0) {
                alertNotes.append("[CRITICAL HYPOXIA SpO2: ").append(dto.getSpo2()).append("%] ");
                isAbnormal = true;
                priority = "RED";
            } else if (dto.getSpo2() < 95.0) {
                alertNotes.append("[Low Oxygen Saturation SpO2: ").append(dto.getSpo2()).append("%] ");
                isAbnormal = true;
                if (!"RED".equals(priority)) priority = "YELLOW";
            }
        }

        // Pulse Check
        if (dto.getPulseRate() != null) {
            if (dto.getPulseRate() > 110.0) {
                alertNotes.append("[Tachycardia Pulse: ").append(dto.getPulseRate()).append(" bpm] ");
                isAbnormal = true;
                if (!"RED".equals(priority)) priority = "YELLOW";
            } else if (dto.getPulseRate() < 50.0) {
                alertNotes.append("[Bradycardia Pulse: ").append(dto.getPulseRate()).append(" bpm] ");
                isAbnormal = true;
                if (!"RED".equals(priority)) priority = "YELLOW";
            }
        }

        // Temperature Check
        if (dto.getTemperature() != null && dto.getTemperature() >= 101.0) {
            alertNotes.append("[High Fever Temp: ").append(dto.getTemperature()).append("°F] ");
            isAbnormal = true;
            if (!"RED".equals(priority)) priority = "YELLOW";
        }

        // Blood Glucose Check
        if (dto.getBloodSugarMgDl() != null) {
            if (dto.getBloodSugarMgDl() > 250.0) {
                alertNotes.append("[Severe Hyperglycemia: ").append(dto.getBloodSugarMgDl()).append(" mg/dL] ");
                isAbnormal = true;
                if (!"RED".equals(priority)) priority = "YELLOW";
            } else if (dto.getBloodSugarMgDl() < 70.0) {
                alertNotes.append("[Hypoglycemia Alert: ").append(dto.getBloodSugarMgDl()).append(" mg/dL] ");
                isAbnormal = true;
                priority = "RED";
            }
        }

        // Severe Pain Check
        if (dto.getPainScore() != null && dto.getPainScore() >= 8) {
            alertNotes.append("[Severe Pain Score: ").append(dto.getPainScore()).append("/10] ");
            isAbnormal = true;
            if (!"RED".equals(priority)) priority = "YELLOW";
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
                .bloodSugarMgDl(dto.getBloodSugarMgDl())
                .painScore(dto.getPainScore())
                .triagePriority(priority)
                .chiefComplaint(dto.getChiefComplaint())
                .isAbnormal(isAbnormal)
                .abnormalNotes(alertNotes.length() > 0 ? alertNotes.toString().trim() : null)
                .recordedBy(nurseName)
                .recordedAt(LocalDateTime.now())
                .build();

        vitals.setCreatedBy(nurseName);
        vitals.setUpdatedBy(nurseName);
        VitalSigns saved = vitalSignsRepository.save(vitals);

        // Auto-advance Patient Visit queue status from CHECKED_IN -> WAITING_DOCTOR
        if (appointment != null) {
            patientVisitRepository.findByAppointmentId(appointment.getId()).ifPresent(visit -> {
                visit.setStatus("WAITING_DOCTOR");
                visit.setUpdatedBy(nurseName);
                patientVisitRepository.save(visit);
            });
        }

        auditService.logAction(nurseName, "RECORD_VITALS", null,
                "Recorded vitals for patient: " + patient.getName() + " (Priority: " + priority + ")",
                null, null, null);

        return mapToVitalSignsDto(saved);
    }

    /**
     * Lists wards with bed availability metrics.
     */
    @Override
    @Transactional(readOnly = true)
    public List<WardDto> getWards(UUID hospitalId) {
        List<Ward> wards;
        if (hospitalId != null) {
            wards = wardRepository.findByHospitalIdAndDeletedAtIsNull(hospitalId);
        } else {
            wards = wardRepository.findAll().stream()
                    .filter(w -> w.getDeletedAt() == null)
                    .collect(Collectors.toList());
        }

        return wards.stream().map(w -> {
            List<Bed> beds = bedRepository.findByWardIdAndDeletedAtIsNull(w.getId());
            int occupied = (int) beds.stream().filter(b -> "OCCUPIED".equalsIgnoreCase(b.getStatus())).count();
            int available = (int) beds.stream().filter(b -> "AVAILABLE".equalsIgnoreCase(b.getStatus())).count();

            return WardDto.builder()
                    .id(w.getId())
                    .hospitalId(w.getHospital().getId())
                    .name(w.getName())
                    .wardType(w.getWardType())
                    .totalBeds(w.getTotalBeds())
                    .floorNumber(w.getFloorNumber())
                    .description(w.getDescription())
                    .occupiedBeds(occupied)
                    .availableBeds(available)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Creates a new ward.
     */
    @Override
    @Transactional
    public WardDto createWard(WardDto dto, String nurseName) {
        Hospital hospital;
        if (dto.getHospitalId() != null) {
            hospital = hospitalRepository.findById(dto.getHospitalId())
                    .orElseThrow(() -> new ResourceNotFoundException("Hospital not found"));
        } else {
            hospital = hospitalRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No hospital found"));
        }

        Ward ward = Ward.builder()
                .hospital(hospital)
                .name(dto.getName())
                .wardType(dto.getWardType() != null ? dto.getWardType().toUpperCase() : "GENERAL")
                .totalBeds(dto.getTotalBeds() != null ? dto.getTotalBeds() : 10)
                .floorNumber(dto.getFloorNumber())
                .description(dto.getDescription())
                .build();

        ward.setCreatedBy(nurseName);
        ward.setUpdatedBy(nurseName);
        Ward saved = wardRepository.save(ward);

        auditService.logAction(nurseName, "CREATE_WARD", null, "Created ward: " + saved.getName(), null, null, null);

        return WardDto.builder()
                .id(saved.getId())
                .hospitalId(hospital.getId())
                .name(saved.getName())
                .wardType(saved.getWardType())
                .totalBeds(saved.getTotalBeds())
                .floorNumber(saved.getFloorNumber())
                .description(saved.getDescription())
                .occupiedBeds(0)
                .availableBeds(saved.getTotalBeds())
                .build();
    }

    /**
     * Lists beds in a ward/hospital with active admission details.
     */
    @Override
    @Transactional(readOnly = true)
    public List<BedDto> getBeds(UUID wardId, UUID hospitalId) {
        List<Bed> beds;
        if (wardId != null) {
            beds = bedRepository.findByWardIdAndDeletedAtIsNull(wardId);
        } else if (hospitalId != null) {
            beds = bedRepository.findByHospitalIdAndDeletedAtIsNull(hospitalId);
        } else {
            beds = bedRepository.findAll().stream().filter(b -> b.getDeletedAt() == null).collect(Collectors.toList());
        }

        return beds.stream().map(bed -> {
            BedDto.BedDtoBuilder builder = BedDto.builder()
                    .id(bed.getId())
                    .wardId(bed.getWard().getId())
                    .wardName(bed.getWard().getName())
                    .hospitalId(bed.getHospital().getId())
                    .bedNumber(bed.getBedNumber())
                    .status(bed.getStatus())
                    .dailyRate(bed.getDailyRate());

            if ("OCCUPIED".equalsIgnoreCase(bed.getStatus())) {
                bedAdmissionRepository.findByBedIdAndStatusAndDeletedAtIsNull(bed.getId(), "ADMITTED")
                        .ifPresent(admission -> {
                            builder.currentPatientId(admission.getPatient().getId());
                            builder.currentPatientName(admission.getPatient().getName() + " " + (admission.getPatient().getLastName() != null ? admission.getPatient().getLastName() : ""));
                            builder.currentPatientUhid(admission.getPatient().getUhid());
                            builder.currentAdmissionId(admission.getId());
                            if (admission.getAdmittingDoctor() != null) {
                                builder.admittedDoctorName("Dr. " + admission.getAdmittingDoctor().getName());
                            }
                        });
            }

            return builder.build();
        }).collect(Collectors.toList());
    }

    /**
     * Creates a new bed.
     */
    @Override
    @Transactional
    public BedDto createBed(BedDto dto, String nurseName) {
        Ward ward = wardRepository.findById(dto.getWardId())
                .orElseThrow(() -> new ResourceNotFoundException("Ward not found: " + dto.getWardId()));

        Bed bed = Bed.builder()
                .ward(ward)
                .hospital(ward.getHospital())
                .bedNumber(dto.getBedNumber())
                .status(dto.getStatus() != null ? dto.getStatus().toUpperCase() : "AVAILABLE")
                .dailyRate(dto.getDailyRate() != null ? dto.getDailyRate() : 500.0)
                .notes(dto.getWardName())
                .build();

        bed.setCreatedBy(nurseName);
        bed.setUpdatedBy(nurseName);
        Bed saved = bedRepository.save(bed);

        auditService.logAction(nurseName, "CREATE_BED", null, "Created bed: " + saved.getBedNumber(), null, null, null);

        return BedDto.builder()
                .id(saved.getId())
                .wardId(ward.getId())
                .wardName(ward.getName())
                .hospitalId(ward.getHospital().getId())
                .bedNumber(saved.getBedNumber())
                .status(saved.getStatus())
                .dailyRate(saved.getDailyRate())
                .build();
    }

    /**
     * Inpatient Bed Admission: assigns patient to bed with doctor and updates bed to OCCUPIED.
     */
    @Override
    @Transactional
    public BedAdmissionDto admitPatient(BedAdmissionRequestDto dto, String nurseName) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.getPatientId()));

        Bed bed = bedRepository.findById(dto.getBedId())
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found: " + dto.getBedId()));

        if (!"AVAILABLE".equalsIgnoreCase(bed.getStatus())) {
            throw new BusinessValidationException("Bed " + bed.getBedNumber() + " is currently " + bed.getStatus() + ". Only AVAILABLE beds can be allocated.");
        }

        Doctor doctor = null;
        if (dto.getAdmittingDoctorId() != null) {
            doctor = doctorRepository.findById(dto.getAdmittingDoctorId()).orElse(null);
        }

        // Occupy bed
        bed.setStatus("OCCUPIED");
        bed.setUpdatedBy(nurseName);
        bedRepository.save(bed);

        // Record admission
        BedAdmission admission = BedAdmission.builder()
                .patient(patient)
                .bed(bed)
                .admittingDoctor(doctor)
                .admissionTime(LocalDateTime.now())
                .reasonForAdmission(dto.getReasonForAdmission())
                .status("ADMITTED")
                .admittedByNurse(nurseName)
                .build();

        admission.setCreatedBy(nurseName);
        admission.setUpdatedBy(nurseName);
        BedAdmission saved = bedAdmissionRepository.save(admission);

        auditService.logAction(nurseName, "ADMIT_PATIENT", null,
                "Admitted patient " + patient.getName() + " to Bed " + bed.getBedNumber(),
                null, null, null);

        return mapToAdmissionDto(saved);
    }

    /**
     * Bed Transfer: Moves patient from one bed to another.
     */
    @Override
    @Transactional
    public BedAdmissionDto transferBed(UUID admissionId, UUID targetBedId, String nurseName) {
        BedAdmission admission = bedAdmissionRepository.findById(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Admission record not found: " + admissionId));

        if (!"ADMITTED".equalsIgnoreCase(admission.getStatus())) {
            throw new BusinessValidationException("Only actively ADMITTED patients can be transferred");
        }

        Bed targetBed = bedRepository.findById(targetBedId)
                .orElseThrow(() -> new ResourceNotFoundException("Target bed not found: " + targetBedId));

        if (!"AVAILABLE".equalsIgnoreCase(targetBed.getStatus())) {
            throw new BusinessValidationException("Target bed " + targetBed.getBedNumber() + " is not available");
        }

        Bed oldBed = admission.getBed();
        oldBed.setStatus("CLEANING");
        oldBed.setUpdatedBy(nurseName);
        bedRepository.save(oldBed);

        targetBed.setStatus("OCCUPIED");
        targetBed.setUpdatedBy(nurseName);
        bedRepository.save(targetBed);

        admission.setBed(targetBed);
        admission.setUpdatedBy(nurseName);
        BedAdmission saved = bedAdmissionRepository.save(admission);

        auditService.logAction(nurseName, "TRANSFER_BED",
                "Bed " + oldBed.getBedNumber(), "Bed " + targetBed.getBedNumber(),
                null, null, null);

        return mapToAdmissionDto(saved);
    }

    /**
     * Discharge Inpatient: Frees bed, updates bed to CLEANING, logs discharge.
     */
    @Override
    @Transactional
    public BedAdmissionDto dischargePatient(UUID admissionId, String dischargeNotes, String nurseName) {
        BedAdmission admission = bedAdmissionRepository.findById(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Admission record not found: " + admissionId));

        if (!"ADMITTED".equalsIgnoreCase(admission.getStatus())) {
            throw new BusinessValidationException("Patient is already " + admission.getStatus());
        }

        admission.setStatus("DISCHARGED");
        admission.setDischargeTime(LocalDateTime.now());
        admission.setDischargeNotes(dischargeNotes);
        admission.setUpdatedBy(nurseName);
        BedAdmission saved = bedAdmissionRepository.save(admission);

        Bed bed = admission.getBed();
        bed.setStatus("CLEANING");
        bed.setUpdatedBy(nurseName);
        bedRepository.save(bed);

        auditService.logAction(nurseName, "DISCHARGE_PATIENT", "ADMITTED", "DISCHARGED", null, null, null);

        return mapToAdmissionDto(saved);
    }

    /**
     * Lists active bed admissions.
     */
    @Override
    @Transactional(readOnly = true)
    public List<BedAdmissionDto> getActiveAdmissions(UUID hospitalId) {
        return bedAdmissionRepository.findAll().stream()
                .filter(ba -> "ADMITTED".equalsIgnoreCase(ba.getStatus()) && ba.getDeletedAt() == null)
                .map(this::mapToAdmissionDto)
                .collect(Collectors.toList());
    }

    /**
     * Fetches active prescription items for medication administration.
     */
    @Override
    @Transactional(readOnly = true)
    public List<MedicationAdministrationDto> getPatientPrescriptionsDue(UUID patientId) {
        List<PrescriptionItem> items = prescriptionItemRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        return items.stream().map(item -> MedicationAdministrationDto.builder()
                .prescriptionItemId(item.getId())
                .patientId(patientId)
                .medicineName(item.getMedicineName())
                .dosage(item.getDosage())
                .route("ORAL")
                .status("PENDING")
                .build()
        ).collect(Collectors.toList());
    }

    /**
     * eMAR: Logs medication dose administered, held, or refused by nurse.
     */
    @Override
    @Transactional
    public MedicationAdministrationDto recordMedicationAdministration(MedicationAdministrationRequestDto dto, String nurseName) {
        PrescriptionItem prescriptionItem = prescriptionItemRepository.findById(dto.getPrescriptionItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Prescription item not found: " + dto.getPrescriptionItemId()));

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.getPatientId()));

        BedAdmission admission = null;
        if (dto.getBedAdmissionId() != null) {
            admission = bedAdmissionRepository.findById(dto.getBedAdmissionId()).orElse(null);
        }

        MedicationAdministration admin = MedicationAdministration.builder()
                .patient(patient)
                .prescriptionItem(prescriptionItem)
                .bedAdmission(admission)
                .dosage(dto.getDosage() != null ? dto.getDosage() : prescriptionItem.getDosage())
                .route(dto.getRoute() != null ? dto.getRoute().toUpperCase() : "ORAL")
                .status(dto.getStatus() != null ? dto.getStatus().toUpperCase() : "GIVEN")
                .administeredBy(nurseName)
                .administeredAt(LocalDateTime.now())
                .notes(dto.getNotes())
                .build();

        admin.setCreatedBy(nurseName);
        admin.setUpdatedBy(nurseName);
        MedicationAdministration saved = medicationAdministrationRepository.save(admin);

        auditService.logAction(nurseName, "ADMINISTER_MEDICATION", null,
                "Administered " + prescriptionItem.getMedicineName() + " (" + saved.getStatus() + ") to " + patient.getName(),
                null, null, null);

        return mapToEmarDto(saved);
    }

    /**
     * Lists medication administration history for a patient.
     */
    @Override
    @Transactional(readOnly = true)
    public List<MedicationAdministrationDto> getPatientMedicationHistory(UUID patientId) {
        return medicationAdministrationRepository.findByPatientIdAndDeletedAtIsNullOrderByAdministeredAtDesc(patientId)
                .stream().map(this::mapToEmarDto).collect(Collectors.toList());
    }

    /**
     * Adds clinical nursing progress or handover note.
     */
    @Override
    @Transactional
    public NursingNoteDto addNursingNote(NursingNoteDto dto, String nurseName) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.getPatientId()));

        BedAdmission admission = null;
        if (dto.getBedAdmissionId() != null) {
            admission = bedAdmissionRepository.findById(dto.getBedAdmissionId()).orElse(null);
        }

        PatientVisit visit = null;
        if (dto.getPatientVisitId() != null) {
            visit = patientVisitRepository.findById(dto.getPatientVisitId()).orElse(null);
        }

        NursingNote note = NursingNote.builder()
                .patient(patient)
                .bedAdmission(admission)
                .patientVisit(visit)
                .noteType(dto.getNoteType() != null ? dto.getNoteType().toUpperCase() : "PROGRESS")
                .content(dto.getContent())
                .nurseName(nurseName)
                .recordedAt(LocalDateTime.now())
                .build();

        note.setCreatedBy(nurseName);
        note.setUpdatedBy(nurseName);
        NursingNote saved = nursingNoteRepository.save(note);

        auditService.logAction(nurseName, "ADD_NURSING_NOTE", null,
                "Added " + saved.getNoteType() + " note for " + patient.getName(), null, null, null);

        return mapToNoteDto(saved);
    }

    /**
     * Lists nursing notes for patient.
     */
    @Override
    @Transactional(readOnly = true)
    public List<NursingNoteDto> getPatientNursingNotes(UUID patientId) {
        return nursingNoteRepository.findByPatientIdAndDeletedAtIsNullOrderByRecordedAtDesc(patientId)
                .stream().map(this::mapToNoteDto).collect(Collectors.toList());
    }

    // ────────────────────────── Helpers & DTO Mappers ──────────────────────────

    private VitalSignsDto mapToVitalSignsDto(VitalSigns v) {
        return VitalSignsDto.builder()
                .id(v.getId())
                .patientId(v.getPatient().getId())
                .patientName(v.getPatient().getName() + " " + (v.getPatient().getLastName() != null ? v.getPatient().getLastName() : ""))
                .patientUhid(v.getPatient().getUhid())
                .appointmentId(v.getAppointment() != null ? v.getAppointment().getId() : null)
                .heightCm(v.getHeightCm())
                .weightKg(v.getWeightKg())
                .bmi(v.getBmi())
                .bloodPressure(v.getBloodPressure())
                .pulseRate(v.getPulseRate())
                .temperature(v.getTemperature())
                .respiratoryRate(v.getRespiratoryRate())
                .spo2(v.getSpo2())
                .bloodSugarMgDl(v.getBloodSugarMgDl())
                .painScore(v.getPainScore())
                .triagePriority(v.getTriagePriority())
                .chiefComplaint(v.getChiefComplaint())
                .isAbnormal(v.getIsAbnormal())
                .abnormalNotes(v.getAbnormalNotes())
                .recordedBy(v.getRecordedBy())
                .recordedAt(v.getRecordedAt())
                .build();
    }

    private QueueManagementDto mapToQueueDto(PatientVisit visit) {
        return QueueManagementDto.builder()
                .visitId(visit.getId())
                .patientId(visit.getPatient().getId())
                .patientName(visit.getPatient().getName() + " " + (visit.getPatient().getLastName() != null ? visit.getPatient().getLastName() : ""))
                .patientUhid(visit.getPatient().getUhid())
                .doctorId(visit.getDoctor().getId())
                .doctorName("Dr. " + visit.getDoctor().getName())
                .tokenNumber(visit.getTokenNumber())
                .status(visit.getStatus())
                .priorityRank(visit.getPriorityRank())
                .checkInTime(visit.getCheckInTime())
                .notes(visit.getNotes())
                .build();
    }

    private BedAdmissionDto mapToAdmissionDto(BedAdmission ba) {
        return BedAdmissionDto.builder()
                .id(ba.getId())
                .patientId(ba.getPatient().getId())
                .patientName(ba.getPatient().getName() + " " + (ba.getPatient().getLastName() != null ? ba.getPatient().getLastName() : ""))
                .patientUhid(ba.getPatient().getUhid())
                .bedId(ba.getBed().getId())
                .bedNumber(ba.getBed().getBedNumber())
                .wardName(ba.getBed().getWard().getName())
                .admittingDoctorId(ba.getAdmittingDoctor() != null ? ba.getAdmittingDoctor().getId() : null)
                .doctorName(ba.getAdmittingDoctor() != null ? "Dr. " + ba.getAdmittingDoctor().getName() : "Unassigned")
                .admissionTime(ba.getAdmissionTime())
                .dischargeTime(ba.getDischargeTime())
                .reasonForAdmission(ba.getReasonForAdmission())
                .status(ba.getStatus())
                .admittedByNurse(ba.getAdmittedByNurse())
                .dischargeNotes(ba.getDischargeNotes())
                .build();
    }

    private MedicationAdministrationDto mapToEmarDto(MedicationAdministration ma) {
        return MedicationAdministrationDto.builder()
                .id(ma.getId())
                .patientId(ma.getPatient().getId())
                .patientName(ma.getPatient().getName() + " " + (ma.getPatient().getLastName() != null ? ma.getPatient().getLastName() : ""))
                .prescriptionItemId(ma.getPrescriptionItem().getId())
                .medicineName(ma.getPrescriptionItem().getMedicineName())
                .dosage(ma.getDosage())
                .route(ma.getRoute())
                .status(ma.getStatus())
                .administeredBy(ma.getAdministeredBy())
                .administeredAt(ma.getAdministeredAt())
                .notes(ma.getNotes())
                .build();
    }

    private NursingNoteDto mapToNoteDto(NursingNote nn) {
        return NursingNoteDto.builder()
                .id(nn.getId())
                .patientId(nn.getPatient().getId())
                .patientName(nn.getPatient().getName() + " " + (nn.getPatient().getLastName() != null ? nn.getPatient().getLastName() : ""))
                .bedAdmissionId(nn.getBedAdmission() != null ? nn.getBedAdmission().getId() : null)
                .patientVisitId(nn.getPatientVisit() != null ? nn.getPatientVisit().getId() : null)
                .noteType(nn.getNoteType())
                .content(nn.getContent())
                .nurseName(nn.getNurseName())
                .recordedAt(nn.getRecordedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public WardDto getAssignedWard(String nurseName) {
        User nurse = userRepository.findByUsername(nurseName)
                .orElseThrow(() -> new ResourceNotFoundException("Nurse user not found: " + nurseName));
        Ward ward = nurse.getAssignedWard();
        if (ward == null) {
            return null;
        }
        return mapToWardDto(ward);
    }

    @Override
    @Transactional
    public WardDto setAssignedWard(String nurseName, UUID wardId) {
        User nurse = userRepository.findByUsername(nurseName)
                .orElseThrow(() -> new ResourceNotFoundException("Nurse user not found: " + nurseName));
        Ward ward = wardRepository.findById(wardId)
                .orElseThrow(() -> new ResourceNotFoundException("Ward not found with ID: " + wardId));
        nurse.setAssignedWard(ward);
        userRepository.save(nurse);

        auditService.logAction(nurseName, "ASSIGN_NURSE_WARD", null, "Assigned ward: " + ward.getName(), null, null, null);
        return mapToWardDto(ward);
    }

    private WardDto mapToWardDto(Ward ward) {
        long occupied = bedRepository.findByWardIdAndDeletedAtIsNull(ward.getId()).stream()
                .filter(b -> "OCCUPIED".equalsIgnoreCase(b.getStatus()))
                .count();
        int total = ward.getTotalBeds() != null ? ward.getTotalBeds() : 0;
        int available = Math.max(0, total - (int) occupied);

        return WardDto.builder()
                .id(ward.getId())
                .hospitalId(ward.getHospital() != null ? ward.getHospital().getId() : null)
                .name(ward.getName())
                .wardType(ward.getWardType())
                .totalBeds(ward.getTotalBeds())
                .floorNumber(ward.getFloorNumber())
                .description(ward.getDescription())
                .occupiedBeds((int) occupied)
                .availableBeds(available)
                .build();
    }

    /**
     * Validates that the patient has an active admission in the nurse's assigned ward.
     */
    private BedAdmission validateInpatientScope(UUID patientId, String nurseName) {
        User user = userRepository.findByUsername(nurseName)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + nurseName));

        boolean isHighPrivilege = user.getRoles().stream()
                .anyMatch(r -> "ADMIN".equalsIgnoreCase(r.name()) || "SUPER_ADMIN".equalsIgnoreCase(r.name()) || "DOCTOR".equalsIgnoreCase(r.name()));

        if (isHighPrivilege) {
            return bedAdmissionRepository.findByPatientIdAndDeletedAtIsNullOrderByAdmissionTimeDesc(patientId)
                    .stream()
                    .filter(ba -> "ADMITTED".equalsIgnoreCase(ba.getStatus()))
                    .findFirst()
                    .orElse(null);
        }

        Ward ward = user.getAssignedWard();
        if (ward == null) {
            throw new BusinessValidationException("Access Denied: Nurse does not have an assigned ward.");
        }

        return bedAdmissionRepository.findActiveAdmissionByPatientAndWard(patientId, ward.getId())
                .orElseThrow(() -> new BusinessValidationException("Access Denied: Patient is no longer admitted in your assigned ward or has been discharged."));
    }

    // ==========================================
    // 1. FLUID BALANCE & INTAKE / OUTPUT (I/O)
    // ==========================================

    @Override
    @Transactional
    public FluidBalanceDto recordFluidBalance(FluidBalanceDto dto, String nurseName) {
        if (dto.getPatientId() == null || dto.getRecordType() == null || dto.getAmountMl() == null) {
            throw new BusinessValidationException("Patient ID, Record Type (INTAKE/OUTPUT), and Amount (ml) are required.");
        }
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.getPatientId()));
        BedAdmission admission = validateInpatientScope(patient.getId(), nurseName);

        FluidBalanceRecord record = FluidBalanceRecord.builder()
                .patient(patient)
                .bedAdmission(admission)
                .recordType(dto.getRecordType().toUpperCase())
                .subCategory(dto.getSubCategory() != null ? dto.getSubCategory().toUpperCase() : "OTHER")
                .amountMl(dto.getAmountMl())
                .recordedAt(dto.getRecordedAt() != null ? dto.getRecordedAt() : LocalDateTime.now())
                .recordedBy(nurseName)
                .notes(dto.getNotes())
                .build();

        FluidBalanceRecord saved = fluidBalanceRecordRepository.save(record);
        auditService.logAction(nurseName, "RECORD_FLUID_BALANCE", null,
                "Logged " + saved.getRecordType() + " of " + saved.getAmountMl() + "ml for patient " + patient.getUhid(), null, null, null);

        return mapToFluidBalanceDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public FluidBalanceSummaryDto getFluidBalanceSummary(UUID patientId, String nurseName) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));
        validateInpatientScope(patientId, nurseName);

        LocalDateTime past24Hours = LocalDateTime.now().minusHours(24);
        List<FluidBalanceRecord> records = fluidBalanceRecordRepository.findByPatientIdAndDeletedAtIsNullOrderByRecordedAtDesc(patientId);

        double intake24h = records.stream()
                .filter(r -> "INTAKE".equalsIgnoreCase(r.getRecordType()) && r.getRecordedAt().isAfter(past24Hours))
                .mapToDouble(FluidBalanceRecord::getAmountMl)
                .sum();

        double output24h = records.stream()
                .filter(r -> "OUTPUT".equalsIgnoreCase(r.getRecordType()) && r.getRecordedAt().isAfter(past24Hours))
                .mapToDouble(FluidBalanceRecord::getAmountMl)
                .sum();

        double netBalance = intake24h - output24h;
        boolean overloadRisk = netBalance > 2000.0; // Flag fluid retention above 2 Liters

        List<FluidBalanceDto> recent = records.stream()
                .limit(20)
                .map(this::mapToFluidBalanceDto)
                .collect(Collectors.toList());

        return FluidBalanceSummaryDto.builder()
                .patientId(patient.getId())
                .patientName(patient.getName() + " " + (patient.getLastName() != null ? patient.getLastName() : ""))
                .patientUhid(patient.getUhid())
                .totalIntakeMl(intake24h)
                .totalOutputMl(output24h)
                .netBalanceMl(netBalance)
                .isFluidOverloadRisk(overloadRisk)
                .recentRecords(recent)
                .build();
    }

    private FluidBalanceDto mapToFluidBalanceDto(FluidBalanceRecord r) {
        return FluidBalanceDto.builder()
                .id(r.getId())
                .patientId(r.getPatient().getId())
                .patientName(r.getPatient().getName() + " " + (r.getPatient().getLastName() != null ? r.getPatient().getLastName() : ""))
                .patientUhid(r.getPatient().getUhid())
                .bedAdmissionId(r.getBedAdmission() != null ? r.getBedAdmission().getId() : null)
                .recordType(r.getRecordType())
                .subCategory(r.getSubCategory())
                .amountMl(r.getAmountMl())
                .recordedAt(r.getRecordedAt())
                .recordedBy(r.getRecordedBy())
                .notes(r.getNotes())
                .build();
    }

    // ==========================================
    // 2. SPECIALIZED BEDSIDE & WOUND CARE
    // ==========================================

    @Override
    @Transactional
    public NursingCareRecordDto recordBedsideCare(NursingCareRecordDto dto, String nurseName) {
        if (dto.getPatientId() == null || dto.getCareType() == null) {
            throw new BusinessValidationException("Patient ID and Care Type are required.");
        }
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.getPatientId()));
        BedAdmission admission = validateInpatientScope(patient.getId(), nurseName);

        NursingCareRecord record = NursingCareRecord.builder()
                .patient(patient)
                .bedAdmission(admission)
                .careType(dto.getCareType().toUpperCase())
                .siteOrDevice(dto.getSiteOrDevice())
                .statusOrCondition(dto.getStatusOrCondition())
                .details(dto.getDetails())
                .performedBy(nurseName)
                .performedAt(dto.getPerformedAt() != null ? dto.getPerformedAt() : LocalDateTime.now())
                .build();

        NursingCareRecord saved = nursingCareRecordRepository.save(record);
        auditService.logAction(nurseName, "RECORD_BEDSIDE_CARE", null,
                "Logged care " + saved.getCareType() + " for patient " + patient.getUhid(), null, null, null);

        return mapToCareDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NursingCareRecordDto> getPatientBedsideCareHistory(UUID patientId, String nurseName) {
        validateInpatientScope(patientId, nurseName);
        return nursingCareRecordRepository.findByPatientIdAndDeletedAtIsNullOrderByPerformedAtDesc(patientId)
                .stream()
                .map(this::mapToCareDto)
                .collect(Collectors.toList());
    }

    private NursingCareRecordDto mapToCareDto(NursingCareRecord r) {
        return NursingCareRecordDto.builder()
                .id(r.getId())
                .patientId(r.getPatient().getId())
                .patientName(r.getPatient().getName() + " " + (r.getPatient().getLastName() != null ? r.getPatient().getLastName() : ""))
                .patientUhid(r.getPatient().getUhid())
                .bedAdmissionId(r.getBedAdmission() != null ? r.getBedAdmission().getId() : null)
                .careType(r.getCareType())
                .siteOrDevice(r.getSiteOrDevice())
                .statusOrCondition(r.getStatusOrCondition())
                .details(r.getDetails())
                .performedBy(r.getPerformedBy())
                .performedAt(r.getPerformedAt())
                .build();
    }

    // ==========================================
    // 3. NURSING TASKS & WORKLOAD
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<NursingTaskDto> getWardTasks(UUID wardId, String nurseName) {
        UUID effectiveWardId = wardId;
        if (effectiveWardId == null) {
            User nurse = userRepository.findByUsername(nurseName)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + nurseName));
            if (nurse.getAssignedWard() != null) {
                effectiveWardId = nurse.getAssignedWard().getId();
            }
        }
        if (effectiveWardId == null) {
            return Collections.emptyList();
        }

        return nursingTaskRepository.findByWardIdAndDeletedAtIsNullOrderByScheduledAtAsc(effectiveWardId)
                .stream()
                .map(this::mapToTaskDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NursingTaskDto createNursingTask(NursingTaskDto dto, String nurseName) {
        if (dto.getPatientId() == null || dto.getTaskTitle() == null) {
            throw new BusinessValidationException("Patient ID and Task Title are required.");
        }
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.getPatientId()));
        BedAdmission admission = validateInpatientScope(patient.getId(), nurseName);

        Ward ward = null;
        if (admission != null && admission.getBed() != null) {
            ward = admission.getBed().getWard();
        }
        if (ward == null && dto.getWardId() != null) {
            ward = wardRepository.findById(dto.getWardId()).orElse(null);
        }
        if (ward == null) {
            User user = userRepository.findByUsername(nurseName).orElse(null);
            ward = user != null ? user.getAssignedWard() : null;
        }
        if (ward == null) {
            throw new BusinessValidationException("Ward could not be determined for task.");
        }

        NursingTask task = NursingTask.builder()
                .patient(patient)
                .bedAdmission(admission)
                .ward(ward)
                .taskTitle(dto.getTaskTitle())
                .description(dto.getDescription())
                .taskType(dto.getTaskType() != null ? dto.getTaskType().toUpperCase() : "GENERAL_CARE")
                .priority(dto.getPriority() != null ? dto.getPriority().toUpperCase() : "ROUTINE")
                .scheduledAt(dto.getScheduledAt() != null ? dto.getScheduledAt() : LocalDateTime.now())
                .dueAt(dto.getDueAt() != null ? dto.getDueAt() : LocalDateTime.now().plusHours(2))
                .status("PENDING")
                .assignedNurse(dto.getAssignedNurse() != null ? dto.getAssignedNurse() : nurseName)
                .build();

        NursingTask saved = nursingTaskRepository.save(task);
        auditService.logAction(nurseName, "CREATE_NURSING_TASK", null, "Created task: " + saved.getTaskTitle(), null, null, null);
        return mapToTaskDto(saved);
    }

    @Override
    @Transactional
    public NursingTaskDto completeNursingTask(UUID taskId, String completionNotes, String nurseName) {
        NursingTask task = nursingTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Nursing task not found: " + taskId));

        task.setStatus("COMPLETED");
        task.setCompletedBy(nurseName);
        task.setCompletedAt(LocalDateTime.now());
        task.setCompletionNotes(completionNotes);

        NursingTask updated = nursingTaskRepository.save(task);
        auditService.logAction(nurseName, "COMPLETE_NURSING_TASK", null, "Completed task: " + task.getTaskTitle(), null, null, null);
        return mapToTaskDto(updated);
    }

    private NursingTaskDto mapToTaskDto(NursingTask t) {
        return NursingTaskDto.builder()
                .id(t.getId())
                .patientId(t.getPatient().getId())
                .patientName(t.getPatient().getName() + " " + (t.getPatient().getLastName() != null ? t.getPatient().getLastName() : ""))
                .patientUhid(t.getPatient().getUhid())
                .bedAdmissionId(t.getBedAdmission() != null ? t.getBedAdmission().getId() : null)
                .wardId(t.getWard().getId())
                .wardName(t.getWard().getName())
                .taskTitle(t.getTaskTitle())
                .description(t.getDescription())
                .taskType(t.getTaskType())
                .priority(t.getPriority())
                .scheduledAt(t.getScheduledAt())
                .dueAt(t.getDueAt())
                .status(t.getStatus())
                .assignedNurse(t.getAssignedNurse())
                .completedBy(t.getCompletedBy())
                .completedAt(t.getCompletedAt())
                .completionNotes(t.getCompletionNotes())
                .build();
    }

    // ==========================================
    // 4. DOCTOR NOTIFICATION & CLINICAL ESCALATION
    // ==========================================

    @Override
    @Transactional
    public ClinicalEscalationDto createClinicalEscalation(ClinicalEscalationDto dto, String nurseName) {
        if (dto.getPatientId() == null || dto.getTriggerReason() == null || dto.getClinicalNotes() == null) {
            throw new BusinessValidationException("Patient ID, Trigger Reason, and Clinical Notes are required.");
        }
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.getPatientId()));
        BedAdmission admission = validateInpatientScope(patient.getId(), nurseName);

        Ward ward = admission != null && admission.getBed() != null ? admission.getBed().getWard() : null;
        if (ward == null) {
            User user = userRepository.findByUsername(nurseName).orElse(null);
            ward = user != null ? user.getAssignedWard() : null;
        }
        if (ward == null) {
            throw new BusinessValidationException("Ward could not be determined for escalation.");
        }

        String doctorName = dto.getAttendingDoctorName();
        if (doctorName == null && admission != null && admission.getAdmittingDoctor() != null) {
            doctorName = admission.getAdmittingDoctor().getName();
        }

        ClinicalEscalation esc = ClinicalEscalation.builder()
                .patient(patient)
                .bedAdmission(admission)
                .ward(ward)
                .severity(dto.getSeverity() != null ? dto.getSeverity().toUpperCase() : "URGENT")
                .triggerReason(dto.getTriggerReason().toUpperCase())
                .clinicalNotes(dto.getClinicalNotes())
                .escalatedBy(nurseName)
                .escalatedAt(LocalDateTime.now())
                .attendingDoctorName(doctorName)
                .isAcknowledged(false)
                .build();

        ClinicalEscalation saved = clinicalEscalationRepository.save(esc);
        auditService.logAction(nurseName, "RAISE_CLINICAL_ESCALATION", null,
                "Raised " + saved.getSeverity() + " alert for patient " + patient.getUhid(), null, null, null);

        return mapToEscalationDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClinicalEscalationDto> getWardEscalations(UUID wardId, String nurseName) {
        UUID effectiveWardId = wardId;
        if (effectiveWardId == null) {
            User nurse = userRepository.findByUsername(nurseName)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + nurseName));
            if (nurse.getAssignedWard() != null) {
                effectiveWardId = nurse.getAssignedWard().getId();
            }
        }
        if (effectiveWardId == null) {
            return Collections.emptyList();
        }

        return clinicalEscalationRepository.findByWardIdAndDeletedAtIsNullOrderByEscalatedAtDesc(effectiveWardId)
                .stream()
                .map(this::mapToEscalationDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ClinicalEscalationDto acknowledgeEscalation(UUID escalationId, String doctorResponse, String doctorName) {
        ClinicalEscalation esc = clinicalEscalationRepository.findById(escalationId)
                .orElseThrow(() -> new ResourceNotFoundException("Escalation record not found: " + escalationId));

        esc.setIsAcknowledged(true);
        esc.setAcknowledgedByDoctor(doctorName);
        esc.setAcknowledgedAt(LocalDateTime.now());
        esc.setDoctorResponseNotes(doctorResponse);

        ClinicalEscalation updated = clinicalEscalationRepository.save(esc);
        auditService.logAction(doctorName, "ACKNOWLEDGE_CLINICAL_ESCALATION", null,
                "Doctor acknowledged escalation for patient " + esc.getPatient().getUhid(), null, null, null);

        return mapToEscalationDto(updated);
    }

    private ClinicalEscalationDto mapToEscalationDto(ClinicalEscalation e) {
        return ClinicalEscalationDto.builder()
                .id(e.getId())
                .patientId(e.getPatient().getId())
                .patientName(e.getPatient().getName() + " " + (e.getPatient().getLastName() != null ? e.getPatient().getLastName() : ""))
                .patientUhid(e.getPatient().getUhid())
                .bedAdmissionId(e.getBedAdmission() != null ? e.getBedAdmission().getId() : null)
                .wardId(e.getWard().getId())
                .wardName(e.getWard().getName())
                .severity(e.getSeverity())
                .triggerReason(e.getTriggerReason())
                .clinicalNotes(e.getClinicalNotes())
                .escalatedBy(e.getEscalatedBy())
                .escalatedAt(e.getEscalatedAt())
                .attendingDoctorName(e.getAttendingDoctorName())
                .isAcknowledged(e.getIsAcknowledged())
                .acknowledgedByDoctor(e.getAcknowledgedByDoctor())
                .acknowledgedAt(e.getAcknowledgedAt())
                .doctorResponseNotes(e.getDoctorResponseNotes())
                .build();
    }

    // ==========================================
    // 5. CLINICAL RISK ASSESSMENTS & CHECKLISTS
    // ==========================================

    @Override
    @Transactional
    public NursingAssessmentDto recordAssessment(NursingAssessmentDto dto, String nurseName) {
        if (dto.getPatientId() == null || dto.getAssessmentType() == null) {
            throw new BusinessValidationException("Patient ID and Assessment Type are required.");
        }
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + dto.getPatientId()));
        BedAdmission admission = validateInpatientScope(patient.getId(), nurseName);

        String assessmentType = dto.getAssessmentType().toUpperCase();
        Integer score = dto.getTotalScore();
        String riskLevel = dto.getRiskLevel();

        // Automated Clinical Risk Calculation
        if ("FALL_RISK_MORSE".equalsIgnoreCase(assessmentType) && score != null) {
            if (score >= 45) riskLevel = "HIGH";
            else if (score >= 25) riskLevel = "MODERATE";
            else riskLevel = "LOW";
        } else if ("PRESSURE_ULCER_BRADEN".equalsIgnoreCase(assessmentType) && score != null) {
            if (score <= 9) riskLevel = "VERY_HIGH";
            else if (score <= 12) riskLevel = "HIGH";
            else if (score <= 14) riskLevel = "MODERATE";
            else if (score <= 18) riskLevel = "MILD";
            else riskLevel = "NO_RISK";
        }

        NursingAssessment assessment = NursingAssessment.builder()
                .patient(patient)
                .bedAdmission(admission)
                .assessmentType(assessmentType)
                .totalScore(score)
                .riskLevel(riskLevel != null ? riskLevel : "ROUTINE")
                .findingsJson(dto.getFindingsJson())
                .clinicalSummary(dto.getClinicalSummary())
                .assessedBy(nurseName)
                .assessedAt(dto.getAssessedAt() != null ? dto.getAssessedAt() : LocalDateTime.now())
                .build();

        NursingAssessment saved = nursingAssessmentRepository.save(assessment);
        auditService.logAction(nurseName, "RECORD_NURSING_ASSESSMENT", null,
                "Recorded assessment " + saved.getAssessmentType() + " with risk " + saved.getRiskLevel(), null, null, null);

        return mapToAssessmentDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NursingAssessmentDto> getPatientAssessments(UUID patientId, String nurseName) {
        validateInpatientScope(patientId, nurseName);
        return nursingAssessmentRepository.findByPatientIdAndDeletedAtIsNullOrderByAssessedAtDesc(patientId)
                .stream()
                .map(this::mapToAssessmentDto)
                .collect(Collectors.toList());
    }

    private NursingAssessmentDto mapToAssessmentDto(NursingAssessment a) {
        return NursingAssessmentDto.builder()
                .id(a.getId())
                .patientId(a.getPatient().getId())
                .patientName(a.getPatient().getName() + " " + (a.getPatient().getLastName() != null ? a.getPatient().getLastName() : ""))
                .patientUhid(a.getPatient().getUhid())
                .bedAdmissionId(a.getBedAdmission() != null ? a.getBedAdmission().getId() : null)
                .assessmentType(a.getAssessmentType())
                .totalScore(a.getTotalScore())
                .riskLevel(a.getRiskLevel())
                .findingsJson(a.getFindingsJson())
                .clinicalSummary(a.getClinicalSummary())
                .assessedBy(a.getAssessedBy())
                .assessedAt(a.getAssessedAt())
                .build();
    }

    // ==========================================
    // 6. HOSPITAL INCIDENT REPORTING
    // ==========================================

    @Override
    @Transactional
    public NursingIncidentDto reportIncident(NursingIncidentDto dto, String nurseName) {
        if (dto.getIncidentType() == null || dto.getDescription() == null) {
            throw new BusinessValidationException("Incident Type and Description are required.");
        }

        Patient patient = null;
        BedAdmission admission = null;
        if (dto.getPatientId() != null) {
            patient = patientRepository.findById(dto.getPatientId()).orElse(null);
            if (patient != null) {
                admission = validateInpatientScope(patient.getId(), nurseName);
            }
        }

        Ward ward = null;
        if (admission != null && admission.getBed() != null) {
            ward = admission.getBed().getWard();
        }
        if (ward == null && dto.getWardId() != null) {
            ward = wardRepository.findById(dto.getWardId()).orElse(null);
        }
        if (ward == null) {
            User user = userRepository.findByUsername(nurseName).orElse(null);
            ward = user != null ? user.getAssignedWard() : null;
        }
        if (ward == null) {
            throw new BusinessValidationException("Ward could not be determined for incident report.");
        }

        NursingIncident incident = NursingIncident.builder()
                .patient(patient)
                .bedAdmission(admission)
                .ward(ward)
                .incidentType(dto.getIncidentType().toUpperCase())
                .severity(dto.getSeverity() != null ? dto.getSeverity().toUpperCase() : "MINOR")
                .incidentTime(dto.getIncidentTime() != null ? dto.getIncidentTime() : LocalDateTime.now())
                .description(dto.getDescription())
                .immediateActionTaken(dto.getImmediateActionTaken())
                .reportedBy(nurseName)
                .reportedAt(LocalDateTime.now())
                .investigationStatus("REPORTED")
                .build();

        NursingIncident saved = nursingIncidentRepository.save(incident);
        auditService.logAction(nurseName, "REPORT_INCIDENT", null,
                "Reported incident " + saved.getIncidentType() + " in ward " + ward.getName(), null, null, null);

        return mapToIncidentDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NursingIncidentDto> getWardIncidents(UUID wardId, String nurseName) {
        UUID effectiveWardId = wardId;
        if (effectiveWardId == null) {
            User nurse = userRepository.findByUsername(nurseName)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + nurseName));
            if (nurse.getAssignedWard() != null) {
                effectiveWardId = nurse.getAssignedWard().getId();
            }
        }
        if (effectiveWardId == null) {
            return Collections.emptyList();
        }

        return nursingIncidentRepository.findByWardIdAndDeletedAtIsNullOrderByReportedAtDesc(effectiveWardId)
                .stream()
                .map(this::mapToIncidentDto)
                .collect(Collectors.toList());
    }

    private NursingIncidentDto mapToIncidentDto(NursingIncident i) {
        return NursingIncidentDto.builder()
                .id(i.getId())
                .patientId(i.getPatient() != null ? i.getPatient().getId() : null)
                .patientName(i.getPatient() != null ? i.getPatient().getName() + " " + (i.getPatient().getLastName() != null ? i.getPatient().getLastName() : "") : null)
                .patientUhid(i.getPatient() != null ? i.getPatient().getUhid() : null)
                .bedAdmissionId(i.getBedAdmission() != null ? i.getBedAdmission().getId() : null)
                .wardId(i.getWard().getId())
                .wardName(i.getWard().getName())
                .incidentType(i.getIncidentType())
                .severity(i.getSeverity())
                .incidentTime(i.getIncidentTime())
                .description(i.getDescription())
                .immediateActionTaken(i.getImmediateActionTaken())
                .reportedBy(i.getReportedBy())
                .reportedAt(i.getReportedAt())
                .investigationStatus(i.getInvestigationStatus())
                .resolutionNotes(i.getResolutionNotes())
                .build();
    }

    // ==========================================
    // 7. SHIFT HANDOVER REPORTS
    // ==========================================

    @Override
    @Transactional
    public ShiftHandoverReportDto createShiftHandover(ShiftHandoverReportDto dto, String nurseName) {
        if (dto.getShiftType() == null || dto.getHandoverSummary() == null) {
            throw new BusinessValidationException("Shift Type and Handover Summary are required.");
        }

        Ward ward = null;
        if (dto.getWardId() != null) {
            ward = wardRepository.findById(dto.getWardId()).orElse(null);
        }
        if (ward == null) {
            User user = userRepository.findByUsername(nurseName).orElse(null);
            ward = user != null ? user.getAssignedWard() : null;
        }
        if (ward == null) {
            throw new BusinessValidationException("Ward could not be determined for handover report.");
        }

        ShiftHandoverReport report = ShiftHandoverReport.builder()
                .ward(ward)
                .shiftType(dto.getShiftType().toUpperCase())
                .shiftDate(dto.getShiftDate() != null ? dto.getShiftDate() : LocalDate.now())
                .outgoingNurse(nurseName)
                .incomingNurse(dto.getIncomingNurse())
                .totalInpatients(dto.getTotalInpatients() != null ? dto.getTotalInpatients() : 0)
                .criticalPatientsCount(dto.getCriticalPatientsCount() != null ? dto.getCriticalPatientsCount() : 0)
                .handoverSummary(dto.getHandoverSummary())
                .pendingTasksSummary(dto.getPendingTasksSummary())
                .handoverTime(LocalDateTime.now())
                .build();

        ShiftHandoverReport saved = shiftHandoverReportRepository.save(report);
        auditService.logAction(nurseName, "CREATE_SHIFT_HANDOVER", null,
                "Handover logged for " + saved.getShiftType() + " shift in " + ward.getName(), null, null, null);

        return mapToHandoverDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShiftHandoverReportDto> getWardHandovers(UUID wardId, String nurseName) {
        UUID effectiveWardId = wardId;
        if (effectiveWardId == null) {
            User nurse = userRepository.findByUsername(nurseName)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + nurseName));
            if (nurse.getAssignedWard() != null) {
                effectiveWardId = nurse.getAssignedWard().getId();
            }
        }
        if (effectiveWardId == null) {
            return Collections.emptyList();
        }

        return shiftHandoverReportRepository.findByWardIdAndDeletedAtIsNullOrderByHandoverTimeDesc(effectiveWardId)
                .stream()
                .map(this::mapToHandoverDto)
                .collect(Collectors.toList());
    }

    private ShiftHandoverReportDto mapToHandoverDto(ShiftHandoverReport h) {
        return ShiftHandoverReportDto.builder()
                .id(h.getId())
                .wardId(h.getWard().getId())
                .wardName(h.getWard().getName())
                .shiftType(h.getShiftType())
                .shiftDate(h.getShiftDate())
                .outgoingNurse(h.getOutgoingNurse())
                .incomingNurse(h.getIncomingNurse())
                .totalInpatients(h.getTotalInpatients())
                .criticalPatientsCount(h.getCriticalPatientsCount())
                .handoverSummary(h.getHandoverSummary())
                .pendingTasksSummary(h.getPendingTasksSummary())
                .handoverTime(h.getHandoverTime())
                .build();
    }

    // ==========================================
    // 8. CONSOLIDATED INPATIENT CLINICAL SUMMARY
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public InpatientSummaryDto getInpatientSummary(UUID patientId, String nurseName) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));
        BedAdmission admission = validateInpatientScope(patientId, nurseName);

        // 1. Latest Vitals
        VitalSignsDto latestVitals = vitalSignsRepository.findTopByPatientIdOrderByRecordedAtDesc(patientId)
                .map(this::mapToVitalSignsDto)
                .orElse(null);

        // 2. Fluid Balance Summary
        FluidBalanceSummaryDto fluidSummary = getFluidBalanceSummary(patientId, nurseName);

        // 3. Pending eMAR
        List<MedicationAdministrationDto> pendingMeds = getPatientPrescriptionsDue(patientId);

        // 4. Active Tasks
        List<NursingTaskDto> activeTasks = nursingTaskRepository.findByPatientIdAndDeletedAtIsNullOrderByScheduledAtDesc(patientId)
                .stream()
                .filter(t -> !"COMPLETED".equalsIgnoreCase(t.getStatus()) && !"CANCELLED".equalsIgnoreCase(t.getStatus()))
                .map(this::mapToTaskDto)
                .collect(Collectors.toList());

        // 5. Latest Risk Assessments
        List<NursingAssessmentDto> assessments = nursingAssessmentRepository.findByPatientIdAndDeletedAtIsNullOrderByAssessedAtDesc(patientId)
                .stream()
                .limit(5)
                .map(this::mapToAssessmentDto)
                .collect(Collectors.toList());

        // 6. Active Escalations
        List<ClinicalEscalationDto> escalations = clinicalEscalationRepository.findByPatientIdAndDeletedAtIsNullOrderByEscalatedAtDesc(patientId)
                .stream()
                .filter(e -> Boolean.FALSE.equals(e.getIsAcknowledged()))
                .map(this::mapToEscalationDto)
                .collect(Collectors.toList());

        // 7. Recent Nursing Notes
        List<NursingNoteDto> notes = nursingNoteRepository.findByPatientIdAndDeletedAtIsNullOrderByRecordedAtDesc(patientId)
                .stream()
                .limit(5)
                .map(this::mapToNoteDto)
                .collect(Collectors.toList());

        // 8. Allergies
        List<String> allergies = patient.getAllergies() != null
                ? patient.getAllergies().stream().map(a -> a.getAllergen() + " (" + a.getSeverity() + ")").collect(Collectors.toList())
                : Collections.emptyList();

        String wardName = admission != null && admission.getBed() != null && admission.getBed().getWard() != null
                ? admission.getBed().getWard().getName() : null;
        String bedNum = admission != null && admission.getBed() != null ? admission.getBed().getBedNumber() : null;
        String doctorName = admission != null && admission.getAdmittingDoctor() != null ? admission.getAdmittingDoctor().getName() : null;

        return InpatientSummaryDto.builder()
                .patientId(patient.getId())
                .name(patient.getName() + " " + (patient.getLastName() != null ? patient.getLastName() : ""))
                .uhid(patient.getUhid())
                .gender(patient.getGender())
                .bloodGroup(patient.getBloodGroup() != null ? patient.getBloodGroup().name() : null)
                .age(patient.getAge())
                .bedAdmissionId(admission != null ? admission.getId() : null)
                .currentWardName(wardName)
                .currentBedNumber(bedNum)
                .admissionStatus(admission != null ? admission.getStatus() : "NOT_ADMITTED")
                .admittingDoctorName(doctorName)
                .reasonForAdmission(admission != null ? admission.getReasonForAdmission() : null)
                .allergies(allergies)
                .latestVitals(latestVitals)
                .fluidBalanceSummary(fluidSummary)
                .pendingMedications(pendingMeds)
                .activeTasks(activeTasks)
                .latestRiskAssessments(assessments)
                .activeEscalations(escalations)
                .recentNotes(notes)
                .build();
    }
}
