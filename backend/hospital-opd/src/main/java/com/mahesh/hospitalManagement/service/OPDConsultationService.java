package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.OPDConsultationDto;
import com.mahesh.hospitalManagement.entity.*;
import com.mahesh.hospitalManagement.error.BusinessValidationException;
import com.mahesh.hospitalManagement.error.ResourceNotFoundException;
import com.mahesh.hospitalManagement.repository.AppointmentRepository;
import com.mahesh.hospitalManagement.repository.OPDConsultationRepository;
import com.mahesh.hospitalManagement.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OPDConsultationService {

    private final OPDConsultationRepository consultationRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AuditService auditService;

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

        // Update vitals
        if (dto.getBloodPressure() != null) consultation.setBloodPressure(dto.getBloodPressure());
        if (dto.getPulseRate() != null) consultation.setPulseRate(dto.getPulseRate());
        if (dto.getTemperature() != null) consultation.setTemperature(dto.getTemperature());
        if (dto.getWeight() != null) consultation.setWeight(dto.getWeight());

        // Update ICD-10 diagnosis
        if (dto.getIcdCode() != null) consultation.setIcdCode(dto.getIcdCode());
        if (dto.getDiagnosisNotes() != null) consultation.setDiagnosisNotes(dto.getDiagnosisNotes());

        appointment.setStatus("IN_CONSULTATION");
        appointmentRepository.save(appointment);

        OPDConsultation saved = consultationRepository.save(consultation);

        // Process Prescription if provided
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

    @Transactional
    public OPDConsultationDto completeConsultation(UUID consultationId, String currentUser) {
        OPDConsultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with ID: " + consultationId));

        consultation.setStatus("COMPLETED");
        Appointment appointment = consultation.getAppointment();
        appointment.setStatus("COMPLETED");
        appointmentRepository.save(appointment);

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

    private void validateDrugAllergies(Patient patient, List<OPDConsultationDto.PrescriptionItemDto> items) {
        if (patient.getAllergies() == null || patient.getAllergies().isEmpty()) {
            return;
        }

        for (OPDConsultationDto.PrescriptionItemDto item : items) {
            for (PatientAllergy allergy : patient.getAllergies()) {
                if (item.getMedicineName() != null && allergy.getAllergen() != null &&
                        item.getMedicineName().equalsIgnoreCase(allergy.getAllergen())) {
                    throw new BusinessValidationException(
                            "CRITICAL SAFETY BLOCKER: Prescribed medicine '" + item.getMedicineName() +
                                    "' conflicts with recorded patient allergen '" + allergy.getAllergen() + "' (" + allergy.getSeverity() + ")");
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
