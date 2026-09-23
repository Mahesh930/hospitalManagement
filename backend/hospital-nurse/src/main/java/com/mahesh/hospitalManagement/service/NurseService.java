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

    /**
     * Retrieves the assigned ward of the logged-in nurse.
     */
    WardDto getAssignedWard(String nurseName);

    /**
     * Updates/assigns the active ward for the nurse.
     */
    WardDto setAssignedWard(String nurseName, UUID wardId);

    /**
     * Records Intake or Output fluid balance for an inpatient.
     */
    FluidBalanceDto recordFluidBalance(FluidBalanceDto dto, String nurseName);

    /**
     * Retrieves 24-hour Intake/Output summary and net balance for an inpatient.
     */
    FluidBalanceSummaryDto getFluidBalanceSummary(UUID patientId, String nurseName);

    /**
     * Logs bedside care procedures (wound care, catheter, IV line, repositioning, hygiene).
     */
    NursingCareRecordDto recordBedsideCare(NursingCareRecordDto dto, String nurseName);

    /**
     * Retrieves bedside care history for an inpatient.
     */
    List<NursingCareRecordDto> getPatientBedsideCareHistory(UUID patientId, String nurseName);

    /**
     * Retrieves nursing tasks for a ward.
     */
    List<NursingTaskDto> getWardTasks(UUID wardId, String nurseName);

    /**
     * Creates a new nursing task or schedule order.
     */
    NursingTaskDto createNursingTask(NursingTaskDto dto, String nurseName);

    /**
     * Marks a nursing task as completed with completion notes.
     */
    NursingTaskDto completeNursingTask(UUID taskId, String completionNotes, String nurseName);

    /**
     * Raises a clinical escalation or urgent doctor alert.
     */
    ClinicalEscalationDto createClinicalEscalation(ClinicalEscalationDto dto, String nurseName);

    /**
     * Retrieves active clinical escalations for a ward.
     */
    List<ClinicalEscalationDto> getWardEscalations(UUID wardId, String nurseName);

    /**
     * Acknowledges and responds to a clinical escalation by a doctor.
     */
    ClinicalEscalationDto acknowledgeEscalation(UUID escalationId, String doctorResponse, String doctorName);

    /**
     * Records a standardized risk assessment (Morse Fall, Braden Scale, Checklists).
     */
    NursingAssessmentDto recordAssessment(NursingAssessmentDto dto, String nurseName);

    /**
     * Retrieves standardized assessments for a patient.
     */
    List<NursingAssessmentDto> getPatientAssessments(UUID patientId, String nurseName);

    /**
     * Logs a hospital/clinical incident report.
     */
    NursingIncidentDto reportIncident(NursingIncidentDto dto, String nurseName);

    /**
     * Retrieves incident reports for a ward.
     */
    List<NursingIncidentDto> getWardIncidents(UUID wardId, String nurseName);

    /**
     * Documents an end-of-shift handover report.
     */
    ShiftHandoverReportDto createShiftHandover(ShiftHandoverReportDto dto, String nurseName);

    /**
     * Retrieves shift handover reports for a ward.
     */
    List<ShiftHandoverReportDto> getWardHandovers(UUID wardId, String nurseName);

    /**
     * Retrieves a consolidated clinical inpatient summary for bedside nursing.
     */
    InpatientSummaryDto getInpatientSummary(UUID patientId, String nurseName);
}
