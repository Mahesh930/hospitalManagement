package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.ClinicalAmendmentDto;
import com.mahesh.hospitalManagement.dto.ClinicalSafetyCheckDto;
import com.mahesh.hospitalManagement.dto.OPDConsultationDto;
import com.mahesh.hospitalManagement.entity.*;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service orchestrating OPD Clinical Consultations, vital sign synchronization,
 * clinical assessments (complaint, HPI, medical/surgical history, examination),
 * ICD-10 diagnostic coding, structured prescriptions with route/quantity,
 * drug allergy hard blocker enforcement, finalized record protection, and audited amendments.
 */
@Service
@RequiredArgsConstructor
public class OPDConsultationService {

    private final OPDConsultationRepository consultationRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final VitalSignsRepository vitalSignsRepository;
    private final PatientVisitRepository patientVisitRepository;
    private final PatientRepository patientRepository;
    private final AuditService auditService;

    /**
     * Starts or updates an OPD consultation record.
     * Enforces Finalized Consultation Protection if already completed.
     * Auto-syncs recorded vitals from check-in triage if not manually specified.
     */
    @Transactional
    public OPDConsultationDto startOrCreateConsultation(UUID appointmentId, OPDConsultationDto dto, String currentUser) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + appointmentId));

        OPDConsultation consultation = consultationRepository.findByAppointmentId(appointmentId)
                .orElseGet(() -> OPDConsultation.builder()
                        .appointment(appointment)
                        .patient(appointment.getPatient())
                        .doctor(appointment.getDoctor())
                        .status("IN_PROGRESS")
                        .build());

        // Finalized Consultation Protection
        if ("COMPLETED".equalsIgnoreCase(consultation.getStatus())) {
            throw new BusinessValidationException("Consultation is finalized and completed. Normal edits are prevented; use the clinical amendment process.");
        }

        // Pre-fill triage vitals if not provided
        Optional<VitalSigns> triageVitals = vitalSignsRepository.findActiveByAppointmentId(appointmentId);
        if (triageVitals.isEmpty()) {
            triageVitals = vitalSignsRepository.findTopByPatientIdOrderByRecordedAtDesc(appointment.getPatient().getId());
        }

        // Vitals
        if (dto.getBloodPressure() != null && !dto.getBloodPressure().isBlank()) {
            consultation.setBloodPressure(dto.getBloodPressure());
        } else if (consultation.getBloodPressure() == null && triageVitals.isPresent()) {
            consultation.setBloodPressure(triageVitals.get().getBloodPressure());
        }

        if (dto.getPulseRate() != null) {
            consultation.setPulseRate(dto.getPulseRate());
        } else if (consultation.getPulseRate() == null && triageVitals.isPresent()) {
            consultation.setPulseRate(triageVitals.get().getPulseRate());
        }

        if (dto.getTemperature() != null) {
            consultation.setTemperature(dto.getTemperature());
        } else if (consultation.getTemperature() == null && triageVitals.isPresent()) {
            consultation.setTemperature(triageVitals.get().getTemperature());
        }

        if (dto.getWeight() != null) {
            consultation.setWeight(dto.getWeight());
        } else if (consultation.getWeight() == null && triageVitals.isPresent()) {
            consultation.setWeight(triageVitals.get().getWeightKg());
        }

        if (dto.getSpo2() != null) {
            consultation.setSpo2(dto.getSpo2());
        } else if (consultation.getSpo2() == null && triageVitals.isPresent()) {
            consultation.setSpo2(triageVitals.get().getSpo2());
        }

        if (dto.getRespiratoryRate() != null) {
            consultation.setRespiratoryRate(dto.getRespiratoryRate());
        } else if (consultation.getRespiratoryRate() == null && triageVitals.isPresent()) {
            consultation.setRespiratoryRate(triageVitals.get().getRespiratoryRate());
        }

        // Clinical Assessment & History
        if (dto.getChiefComplaint() != null) consultation.setChiefComplaint(dto.getChiefComplaint());
        if (dto.getHistoryOfPresentIllness() != null) consultation.setHistoryOfPresentIllness(dto.getHistoryOfPresentIllness());
        if (dto.getPastMedicalHistory() != null) consultation.setPastMedicalHistory(dto.getPastMedicalHistory());
        if (dto.getSurgicalHistory() != null) consultation.setSurgicalHistory(dto.getSurgicalHistory());
        if (dto.getFamilyHistory() != null) consultation.setFamilyHistory(dto.getFamilyHistory());
        if (dto.getSocialHistory() != null) consultation.setSocialHistory(dto.getSocialHistory());
        if (dto.getPhysicalExamination() != null) consultation.setPhysicalExamination(dto.getPhysicalExamination());
        if (dto.getClinicalNotes() != null) consultation.setClinicalNotes(dto.getClinicalNotes());

        // Diagnosis (Primary ICD-10, Secondary, Differential)
        if (dto.getIcdCode() != null) consultation.setIcdCode(dto.getIcdCode());
        if (dto.getDiagnosisNotes() != null) consultation.setDiagnosisNotes(dto.getDiagnosisNotes());
        if (dto.getSecondaryDiagnoses() != null) consultation.setSecondaryDiagnoses(dto.getSecondaryDiagnoses());
        if (dto.getDifferentialDiagnosis() != null) consultation.setDifferentialDiagnosis(dto.getDifferentialDiagnosis());

        // Care & Treatment Plan
        if (dto.getTreatmentPlan() != null) consultation.setTreatmentPlan(dto.getTreatmentPlan());
        if (dto.getPatientInstructions() != null) consultation.setPatientInstructions(dto.getPatientInstructions());
        if (dto.getDietInstructions() != null) consultation.setDietInstructions(dto.getDietInstructions());
        if (dto.getActivityInstructions() != null) consultation.setActivityInstructions(dto.getActivityInstructions());

        // Referral & Follow-up
        if (dto.getReferralDepartment() != null) consultation.setReferralDepartment(dto.getReferralDepartment());
        if (dto.getReferralDoctor() != null) consultation.setReferralDoctor(dto.getReferralDoctor());
        if (dto.getReferralNotes() != null) consultation.setReferralNotes(dto.getReferralNotes());
        if (dto.getFollowUpDate() != null) consultation.setFollowUpDate(dto.getFollowUpDate());
        if (dto.getFollowUpInstructions() != null) consultation.setFollowUpInstructions(dto.getFollowUpInstructions());

        appointment.setStatus("IN_CONSULTATION");
        appointmentRepository.save(appointment);

        patientVisitRepository.findByAppointmentId(appointmentId).ifPresent(v -> {
            v.setStatus("IN_CONSULTATION");
            if (v.getConsultationStartTime() == null) {
                v.setConsultationStartTime(LocalDateTime.now());
            }
            patientVisitRepository.save(v);
        });

        OPDConsultation saved = consultationRepository.save(consultation);

        // Process Structured Prescription if provided
        if (dto.getPrescription() != null && dto.getPrescription().getItems() != null && !dto.getPrescription().getItems().isEmpty()) {
            validateDrugAllergies(appointment.getPatient(), dto.getPrescription().getItems());

            Prescription prescription = prescriptionRepository.findByConsultationId(saved.getId())
                    .orElseGet(() -> Prescription.builder()
                            .consultation(saved)
                            .patient(appointment.getPatient())
                            .doctor(appointment.getDoctor())
                            .build());

            prescription.setAdvice(dto.getPrescription().getAdvice());

            List<PrescriptionItem> items = dto.getPrescription().getItems().stream()
                    .map(itemDto -> PrescriptionItem.builder()
                            .prescription(prescription)
                            .medicineName(itemDto.getMedicineName())
                            .dosage(itemDto.getDosage())
                            .frequency(itemDto.getFrequency())
                            .route(itemDto.getRoute() != null ? itemDto.getRoute() : "Oral")
                            .durationDays(itemDto.getDurationDays())
                            .quantity(itemDto.getQuantity() != null ? itemDto.getQuantity() : 1)
                            .instructions(itemDto.getInstructions())
                            .build())
                    .collect(Collectors.toList());

            prescription.getItems().clear();
            prescription.getItems().addAll(items);
            prescriptionRepository.save(prescription);
            saved.setPrescription(prescription);
        }

        auditService.logAction(currentUser, "SAVE_OPD_CONSULTATION", null, saved.getId().toString(), null, null, null);

        return mapToDto(saved);
    }

    /**
     * Finalizes an active consultation session, advancing patient to Pharmacy & Billing queues.
     */
    @Transactional
    public OPDConsultationDto completeConsultation(UUID consultationId, String currentUser) {
        OPDConsultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with ID: " + consultationId));

        consultation.setStatus("COMPLETED");
        Appointment appointment = consultation.getAppointment();
        appointment.setStatus("COMPLETED");
        appointmentRepository.save(appointment);

        patientVisitRepository.findByAppointmentId(appointment.getId()).ifPresent(v -> {
            v.setStatus("COMPLETED");
            v.setConsultationEndTime(LocalDateTime.now());
            patientVisitRepository.save(v);
        });

        OPDConsultation saved = consultationRepository.save(consultation);
        auditService.logAction(currentUser, "COMPLETE_OPD_CONSULTATION", "IN_PROGRESS", "COMPLETED", null, null, null);

        return mapToDto(saved);
    }

    /**
     * Amends a finalized consultation with explicit clinical rationale and an immutable audit trail.
     */
    @Transactional
    public OPDConsultationDto amendConsultation(UUID consultationId, ClinicalAmendmentDto amendmentDto, String currentUser) {
        OPDConsultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with ID: " + consultationId));

        String oldDiagnosis = consultation.getDiagnosisNotes();
        String oldPlan = consultation.getTreatmentPlan();

        if (amendmentDto.getUpdatedClinicalNotes() != null) {
            consultation.setClinicalNotes(consultation.getClinicalNotes() != null
                    ? consultation.getClinicalNotes() + "\n[Amendment " + LocalDateTime.now() + "]: " + amendmentDto.getUpdatedClinicalNotes()
                    : amendmentDto.getUpdatedClinicalNotes());
        }
        if (amendmentDto.getUpdatedDiagnosisNotes() != null) {
            consultation.setDiagnosisNotes(amendmentDto.getUpdatedDiagnosisNotes());
        }
        if (amendmentDto.getUpdatedTreatmentPlan() != null) {
            consultation.setTreatmentPlan(amendmentDto.getUpdatedTreatmentPlan());
        }
        if (amendmentDto.getUpdatedPatientInstructions() != null) {
            consultation.setPatientInstructions(amendmentDto.getUpdatedPatientInstructions());
        }
        if (amendmentDto.getUpdatedDietInstructions() != null) {
            consultation.setDietInstructions(amendmentDto.getUpdatedDietInstructions());
        }
        if (amendmentDto.getUpdatedActivityInstructions() != null) {
            consultation.setActivityInstructions(amendmentDto.getUpdatedActivityInstructions());
        }

        consultation.setAmended(true);
        consultation.setAmendmentReason(amendmentDto.getAmendmentReason());
        consultation.setAmendedAt(Instant.now());
        consultation.setAmendedBy(currentUser);

        OPDConsultation saved = consultationRepository.save(consultation);

        auditService.logAction(currentUser, "AMEND_CONSULTATION",
                "Old: " + oldDiagnosis + " | Plan: " + oldPlan,
                "Reason: " + amendmentDto.getAmendmentReason() + " | New Notes: " + amendmentDto.getUpdatedClinicalNotes(),
                null, null, null);

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public OPDConsultationDto getConsultationByAppointment(UUID appointmentId) {
        OPDConsultation consultation = consultationRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("No consultation found for appointment: " + appointmentId));
        return mapToDto(consultation);
    }

    @Transactional(readOnly = true)
    public OPDConsultationDto getConsultationById(UUID consultationId) {
        OPDConsultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("No consultation found with ID: " + consultationId));
        return mapToDto(consultation);
    }

    /**
     * Pre-flight clinical safety checker for allergy collisions and major drug-drug interactions.
     */
    @Transactional(readOnly = true)
    public ClinicalSafetyCheckDto checkClinicalSafety(UUID patientId, List<String> medications) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));

        List<String> allergyConflicts = new ArrayList<>();
        List<String> drugInteractions = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (patient.getAllergies() != null && medications != null) {
            for (String med : medications) {
                if (med == null || med.isBlank()) continue;
                String medLower = med.trim().toLowerCase();

                for (PatientAllergy allergy : patient.getAllergies()) {
                    if (allergy.getAllergen() == null || allergy.getAllergen().isBlank()) continue;
                    String allergenLower = allergy.getAllergen().trim().toLowerCase();

                    if (medLower.equals(allergenLower) || medLower.contains(allergenLower) || allergenLower.contains(medLower)) {
                        allergyConflicts.add("Patient allergen conflict: Prescribed '" + med + "' matches documented allergen '" + allergy.getAllergen() + "' (" + (allergy.getSeverity() != null ? allergy.getSeverity() : "HIGH") + ")");
                    }
                }
            }
        }

        // Known critical drug interaction heuristics
        if (medications != null) {
            Set<String> set = medications.stream().filter(Objects::nonNull).map(String::toLowerCase).collect(Collectors.toSet());
            boolean hasAspirin = set.stream().anyMatch(m -> m.contains("aspirin"));
            boolean hasWarfarin = set.stream().anyMatch(m -> m.contains("warfarin") || m.contains("heparin"));
            boolean hasIbuprofen = set.stream().anyMatch(m -> m.contains("ibuprofen") || m.contains("nsaid") || m.contains("diclofenac"));

            if (hasAspirin && hasWarfarin) {
                drugInteractions.add("Major interaction: Concurrent use of Warfarin and Aspirin significantly increases hemorrhage/bleeding risk.");
            }
            if (hasWarfarin && hasIbuprofen) {
                drugInteractions.add("Major interaction: Concurrent NSAIDs (Ibuprofen/Diclofenac) and Anticoagulants substantially heighten GI ulceration and bleeding.");
            }
        }

        boolean hardBlocked = !allergyConflicts.isEmpty();

        return ClinicalSafetyCheckDto.builder()
                .patientId(patientId)
                .medications(medications)
                .isBlocked(hardBlocked)
                .allergyConflicts(allergyConflicts)
                .drugInteractions(drugInteractions)
                .warnings(warnings)
                .build();
    }

    /**
     * Hard Blocker: Compares each prescribed medication against the patient's recorded allergies.
     * Throws BusinessValidationException if an allergy match is identified.
     */
    private void validateDrugAllergies(Patient patient, List<OPDConsultationDto.PrescriptionItemDto> items) {
        if (patient.getAllergies() == null || patient.getAllergies().isEmpty()) {
            return;
        }

        for (OPDConsultationDto.PrescriptionItemDto item : items) {
            if (item.getMedicineName() == null || item.getMedicineName().isBlank()) continue;

            String medNameLower = item.getMedicineName().trim().toLowerCase();

            for (PatientAllergy allergy : patient.getAllergies()) {
                if (allergy.getAllergen() == null || allergy.getAllergen().isBlank()) continue;

                String allergenLower = allergy.getAllergen().trim().toLowerCase();

                if (medNameLower.equals(allergenLower) || medNameLower.contains(allergenLower) || allergenLower.contains(medNameLower)) {
                    throw new BusinessValidationException(
                            "CRITICAL SAFETY BLOCKER: Prescribed medicine '" + item.getMedicineName() +
                                    "' conflicts with recorded patient allergen '" + allergy.getAllergen() +
                                    "' (Severity: " + (allergy.getSeverity() != null ? allergy.getSeverity() : "HIGH") + "). Prescription cannot be saved.");
                }
            }
        }
    }

    public OPDConsultationDto mapToDto(OPDConsultation consultation) {
        OPDConsultationDto.PrescriptionDto prescriptionDto = null;
        if (consultation.getPrescription() != null) {
            List<OPDConsultationDto.PrescriptionItemDto> itemDtos = consultation.getPrescription().getItems().stream()
                    .map(item -> OPDConsultationDto.PrescriptionItemDto.builder()
                            .id(item.getId())
                            .medicineName(item.getMedicineName())
                            .dosage(item.getDosage())
                            .frequency(item.getFrequency())
                            .route(item.getRoute())
                            .durationDays(item.getDurationDays())
                            .quantity(item.getQuantity())
                            .instructions(item.getInstructions())
                            .build())
                    .collect(Collectors.toList());

            prescriptionDto = OPDConsultationDto.PrescriptionDto.builder()
                    .id(consultation.getPrescription().getId())
                    .advice(consultation.getPrescription().getAdvice())
                    .items(itemDtos)
                    .build();
        }

        return OPDConsultationDto.builder()
                .id(consultation.getId())
                .appointmentId(consultation.getAppointment().getId())
                .patientId(consultation.getPatient().getId())
                .patientName(consultation.getPatient().getName())
                .patientUhid(consultation.getPatient().getUhid())
                .doctorId(consultation.getDoctor().getId())
                .doctorName(consultation.getDoctor().getName())
                .bloodPressure(consultation.getBloodPressure())
                .pulseRate(consultation.getPulseRate())
                .temperature(consultation.getTemperature())
                .weight(consultation.getWeight())
                .spo2(consultation.getSpo2())
                .respiratoryRate(consultation.getRespiratoryRate())
                .chiefComplaint(consultation.getChiefComplaint())
                .historyOfPresentIllness(consultation.getHistoryOfPresentIllness())
                .pastMedicalHistory(consultation.getPastMedicalHistory())
                .surgicalHistory(consultation.getSurgicalHistory())
                .familyHistory(consultation.getFamilyHistory())
                .socialHistory(consultation.getSocialHistory())
                .physicalExamination(consultation.getPhysicalExamination())
                .clinicalNotes(consultation.getClinicalNotes())
                .icdCode(consultation.getIcdCode())
                .diagnosisNotes(consultation.getDiagnosisNotes())
                .secondaryDiagnoses(consultation.getSecondaryDiagnoses())
                .differentialDiagnosis(consultation.getDifferentialDiagnosis())
                .treatmentPlan(consultation.getTreatmentPlan())
                .patientInstructions(consultation.getPatientInstructions())
                .dietInstructions(consultation.getDietInstructions())
                .activityInstructions(consultation.getActivityInstructions())
                .referralDepartment(consultation.getReferralDepartment())
                .referralDoctor(consultation.getReferralDoctor())
                .referralNotes(consultation.getReferralNotes())
                .followUpDate(consultation.getFollowUpDate())
                .followUpInstructions(consultation.getFollowUpInstructions())
                .status(consultation.getStatus())
                .amended(consultation.getAmended())
                .amendmentReason(consultation.getAmendmentReason())
                .amendedAt(consultation.getAmendedAt())
                .amendedBy(consultation.getAmendedBy())
                .prescription(prescriptionDto)
                .build();
    }
}
