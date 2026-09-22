package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.*;

import java.util.List;
import java.util.UUID;

/**
 * Service interface defining clinical nursing workflows:
 * Nurse station dashboard, OPD pre-consultation triage, inpatient bed allocations,
 * medication administration records (eMAR), and nursing progress notes.
 */
public interface NurseService {

    /**
     * Retrieves aggregated clinical and operational metrics for the nurse station dashboard.
     */
    NurseDashboardDto getDashboardStats();

    /**
     * Fetches real-time queue of checked-in patients awaiting vital signs capture.
     */
    List<QueueManagementDto> getTriageQueue();

    /**
     * Records comprehensive vital signs, evaluates clinical safety thresholds,
     * flags abnormal parameters, and auto-advances queue to WAITING_DOCTOR.
     */
    VitalSignsDto recordTriageVitals(VitalSignsDto dto, String nurseName);

    /**
     * Lists all wards for a hospital including bed capacity and availability.
     */
    List<WardDto> getWards(UUID hospitalId);

    /**
     * Creates a new ward.
     */
    WardDto createWard(WardDto dto, String nurseName);

    /**
     * Lists beds filtered by ward or hospital with active occupant details.
     */
    List<BedDto> getBeds(UUID wardId, UUID hospitalId);

    /**
     * Creates a new bed in a ward.
     */
    BedDto createBed(BedDto dto, String nurseName);

    /**
     * Admits a patient to a bed with doctor assignment and updates bed status to OCCUPIED.
     */
    BedAdmissionDto admitPatient(BedAdmissionRequestDto dto, String nurseName);

    /**
     * Transfers an admitted patient to another bed/ward.
     */
    BedAdmissionDto transferBed(UUID admissionId, UUID targetBedId, String nurseName);

    /**
     * Discharges an inpatient and transitions bed status to CLEANING.
     */
    BedAdmissionDto dischargePatient(UUID admissionId, String dischargeNotes, String nurseName);

    /**
     * Fetches active bed admissions for a hospital.
     */
    List<BedAdmissionDto> getActiveAdmissions(UUID hospitalId);

    /**
     * Retrieves prescription items due for administration for a patient.
     */
    List<MedicationAdministrationDto> getPatientPrescriptionsDue(UUID patientId);

    /**
     * Records an electronic medication administration log (eMAR) with allergy verification.
     */
    MedicationAdministrationDto recordMedicationAdministration(MedicationAdministrationRequestDto dto, String nurseName);

    /**
     * Fetches eMAR history for a patient.
     */
    List<MedicationAdministrationDto> getPatientMedicationHistory(UUID patientId);

    /**
     * Adds a clinical nursing progress note or shift handover note.
     */
    NursingNoteDto addNursingNote(NursingNoteDto dto, String nurseName);

    /**
     * Retrieves clinical nursing notes for a patient.
     */
    List<NursingNoteDto> getPatientNursingNotes(UUID patientId);
}
