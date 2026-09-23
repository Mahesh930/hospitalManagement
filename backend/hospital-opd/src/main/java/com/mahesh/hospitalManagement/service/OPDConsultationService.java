package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.OPDConsultationDto;
import com.mahesh.hospitalManagement.entity.*;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service orchestrating OPD Clinical Consultations, vital sign synchronization,
 * ICD-10 diagnostic coding, structured prescriptions, and drug allergy hard blocker enforcement.
 */
@Service
@RequiredArgsConstructor
public class OPDConsultationService {

    private final OPDConsultationRepository consultationRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final VitalSignsRepository vitalSignsRepository;
    private final PatientVisitRepository patientVisitRepository;
    private final AuditService auditService;

    /**
     * Starts or updates an OPD consultation record.
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

        // Pre-fill triage vitals if not provided
        Optional<VitalSigns> triageVitals = vitalSignsRepository.findActiveByAppointmentId(appointmentId);
        if (triageVitals.isEmpty()) {
            triageVitals = vitalSignsRepository.findTopByPatientIdOrderByRecordedAtDesc(appointment.getPatient().getId());
        }

        // Update vitals
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

        // Update ICD-10 diagnosis
        if (dto.getIcdCode() != null) consultation.setIcdCode(dto.getIcdCode());
        if (dto.getDiagnosisNotes() != null) consultation.setDiagnosisNotes(dto.getDiagnosisNotes());

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
                            .durationDays(itemDto.getDurationDays())
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

    @Transactional(readOnly = true)
    public OPDConsultationDto getConsultationByAppointment(UUID appointmentId) {
        OPDConsultation consultation = consultationRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("No consultation found for appointment: " + appointmentId));
        return mapToDto(consultation);
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
                            .durationDays(item.getDurationDays())
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
                .icdCode(consultation.getIcdCode())
                .diagnosisNotes(consultation.getDiagnosisNotes())
                .status(consultation.getStatus())
                .prescription(prescriptionDto)
                .build();
    }
}
