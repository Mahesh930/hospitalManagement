import apiClient from "./client";
import type { ApiResponse } from "./patients";

export interface PrescriptionItemDto {
  id?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  route?: string;
  durationDays: number;
  quantity?: number;
  instructions?: string;
}

export interface PrescriptionDto {
  id?: string;
  advice?: string;
  items: PrescriptionItemDto[];
}

export interface ConsultationDto {
  id?: string;
  appointmentId?: string;
  patientId?: string;
  patientName?: string;
  patientUhid?: string;
  doctorId?: string;
  doctorName?: string;
  
  // Vitals
  bloodPressure?: string;
  pulseRate?: number;
  temperature?: number;
  weight?: number;
  spo2?: number;
  respiratoryRate?: number;

  // Clinical Assessment
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  surgicalHistory?: string;
  familyHistory?: string;
  socialHistory?: string;
  physicalExamination?: string;
  clinicalNotes?: string;

  // Diagnosis
  icdCode?: string;
  diagnosisNotes?: string;
  secondaryDiagnoses?: string;
  differentialDiagnosis?: string;

  // Care & Treatment Plan
  treatmentPlan?: string;
  patientInstructions?: string;
  dietInstructions?: string;
  activityInstructions?: string;

  // Referral & Follow-up
  referralDepartment?: string;
  referralDoctor?: string;
  referralNotes?: string;
  followUpDate?: string;
  followUpInstructions?: string;

  status?: string;

  // Amendment tracking
  amended?: boolean;
  amendmentReason?: string;
  amendedAt?: string;
  amendedBy?: string;

  prescription?: PrescriptionDto;
}

export interface ClinicalAmendmentDto {
  amendmentReason: string;
  updatedClinicalNotes?: string;
  updatedDiagnosisNotes?: string;
  updatedTreatmentPlan?: string;
  updatedPatientInstructions?: string;
  updatedDietInstructions?: string;
  updatedActivityInstructions?: string;
}

export interface ClinicalSafetyCheckDto {
  patientId: string;
  medications: string[];
  isBlocked?: boolean;
  allergyConflicts?: string[];
  drugInteractions?: string[];
  warnings?: string[];
}

export const consultationsApi = {
  save: (appointmentId: string, data: ConsultationDto) =>
    apiClient.post<ApiResponse<ConsultationDto>>(`/opd/consultations/appointment/${appointmentId}`, data),

  complete: (consultationId: string) =>
    apiClient.post<ApiResponse<ConsultationDto>>(`/opd/consultations/${consultationId}/complete`),

  amend: (consultationId: string, data: ClinicalAmendmentDto) =>
    apiClient.post<ApiResponse<ConsultationDto>>(`/opd/consultations/${consultationId}/amend`, data),

  checkSafety: (data: { patientId: string; medications: string[] }) =>
    apiClient.post<ApiResponse<ClinicalSafetyCheckDto>>(`/opd/consultations/clinical-safety/check`, data),

  getByAppointment: (appointmentId: string) =>
    apiClient.get<ApiResponse<ConsultationDto>>(`/opd/consultations/appointment/${appointmentId}`),

  getById: (consultationId: string) =>
    apiClient.get<ApiResponse<ConsultationDto>>(`/opd/consultations/${consultationId}`),
};
